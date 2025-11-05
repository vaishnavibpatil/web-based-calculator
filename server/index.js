const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple in-memory storage for rates and projects (for prototype)
let settings = {
  itRate: 100,          // default IT hourly rate
  businessRate: 150     // default Business hourly rate
};

// Replace the existing "let projects = [];" with this seeded data:
let projects = [
  {
    id: 'powerbi',
    name: 'Power BI',
    timePerTransactionMin: 14,
    businessHoursBack: 30,
    count: 200
  },
  {
    id: 'project2',
    name: 'Project 2',
    timePerTransactionMin: 10,
    businessHoursBack: 15,
    count: 100
  }
];

// Helpers
function computeProjectDerived(project) {
  const timeMin = Number(project.timePerTransactionMin) || 0;
  const count = Number(project.count) || 0;
  const itHours = (count * timeMin) / 60;
  const itSaving = itHours * settings.itRate;
  const businessHoursBack = Number(project.businessHoursBack) || 0;
  const businessSaving = businessHoursBack * settings.businessRate;
  const total = itSaving + businessSaving;
  return {
    ...project,
    itHours,
    itSaving,
    businessSaving,
    total
  };
}

// Routes
app.get('/api/settings', (req, res) => res.json(settings));

app.post('/api/settings', (req, res) => {
  const { itRate, businessRate } = req.body;
  if (itRate !== undefined) settings.itRate = Number(itRate);
  if (businessRate !== undefined) settings.businessRate = Number(businessRate);
  return res.json(settings);
});

app.get('/api/projects', (req, res) => {
  const computed = projects.map(p => computeProjectDerived(p));
  res.json(computed);
});

app.post('/api/projects', (req, res) => {
  const proj = req.body;
  // Expect id, name, timePerTransactionMin, businessHoursBack, count
  if (!proj.id) return res.status(400).json({ error: 'id required' });
  // replace existing or add
  const idx = projects.findIndex(p => p.id === proj.id);
  if (idx >= 0) projects[idx] = proj;
  else projects.push(proj);
  res.json(computeProjectDerived(proj));
});

app.put('/api/projects/:id', (req, res) => {
  const id = req.params.id;
  const idx = projects.findIndex(p => p.id === id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  projects[idx] = { ...projects[idx], ...req.body };
  return res.json(computeProjectDerived(projects[idx]));
});

app.delete('/api/projects/:id', (req, res) => {
  const id = req.params.id;
  projects = projects.filter(p => p.id !== id);
  res.json({ success: true });
});

// Server start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
