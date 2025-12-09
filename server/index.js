// Import Express framework
const express = require('express');

// Import body-parser for reading JSON request data
const bodyParser = require('body-parser');

// Import CORS to allow frontend-backend communication
const cors = require('cors');

// Import path for file path handling
const path = require('path');

// Create Express application
const app = express();

// Enable CORS for all requests
app.use(cors());

// Enable JSON body parsing
app.use(bodyParser.json());

// Simple in-memory storage for rates and projects (for prototype)
let settings = {
  itRate: 100,          // default IT hourly rate
  businessRate: 150     // default Business hourly rate
};

// Seeded project data
let projects = [
  {
    id: 'powerbi',                     // Unique project id
    name: 'Power BI',                  // Project name
    timePerTransactionMin: 14,         // Time per transaction in minutes
    businessHoursBack: 30,             // Business hours saved
    count: 200                         // Number of transactions
  },
  {
    id: 'project2',
    name: 'Project 2',
    timePerTransactionMin: 10,
    businessHoursBack: 15,
    count: 100
  }
];

// Helper function to calculate derived values
function computeProjectDerived(project) {

  // Convert time to number
  const timeMin = Number(project.timePerTransactionMin) || 0;

  // Convert count to number
  const count = Number(project.count) || 0;

  // Calculate IT hours
  const itHours = (count * timeMin) / 60;

  // Calculate IT cost saving
  const itSaving = itHours * settings.itRate;

  // Convert business hours to number
  const businessHoursBack = Number(project.businessHoursBack) || 0;

  // Calculate business cost saving
  const businessSaving = businessHoursBack * settings.businessRate;

  // Calculate total saving
  const total = itSaving + businessSaving;

  // Return project with computed values added
  return {
    ...project,
    itHours,
    itSaving,
    businessSaving,
    total
  };
}

// Get settings API
app.get('/api/settings', (req, res) => res.json(settings));

// Update settings API
app.post('/api/settings', (req, res) => {
  const { itRate, businessRate } = req.body;

  // Update IT rate if provided
  if (itRate !== undefined) settings.itRate = Number(itRate);

  // Update business rate if provided
  if (businessRate !== undefined) settings.businessRate = Number(businessRate);

  return res.json(settings);
});

// Get all projects with computed savings
app.get('/api/projects', (req, res) => {

  // Calculate derived values for all projects
  const computed = projects.map(p => computeProjectDerived(p));

  res.json(computed);
});

// Add or replace a project
app.post('/api/projects', (req, res) => {

  const proj = req.body;

  // Validate project id
  if (!proj.id) return res.status(400).json({ error: 'id required' });

  // Find existing project index
  const idx = projects.findIndex(p => p.id === proj.id);

  // Replace existing project
  if (idx >= 0) projects[idx] = proj;

  // Add new project
  else projects.push(proj);

  res.json(computeProjectDerived(proj));
});

// Update project by id
app.put('/api/projects/:id', (req, res) => {

  const id = req.params.id;

  // Find project index
  const idx = projects.findIndex(p => p.id === id);

  // Return error if not found
  if (idx < 0) return res.status(404).json({ error: 'not found' });

  // Update project fields
  projects[idx] = { ...projects[idx], ...req.body };

  return res.json(computeProjectDerived(projects[idx]));
});

// Delete project by id
app.delete('/api/projects/:id', (req, res) => {

  const id = req.params.id;

  // Remove project from list
  projects = projects.filter(p => p.id !== id);

  res.json({ success: true });
});

// Server start port
const PORT = process.env.PORT || 4000;

// Start backend server
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
