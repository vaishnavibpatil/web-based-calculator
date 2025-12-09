// client/src/components/Calculator.jsx

// Import React hooks
import React, { useEffect, useState } from 'react';

// Import Axios for API calls
import axios from 'axios';

// Helper function to format numbers
function formatNum(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Calculator() {

  // State to store all projects
  const [projects, setProjects] = useState([]);

  // State for loading indicator
  const [loading, setLoading] = useState(true);

  // State for tracking save/delete operation
  const [savingId, setSavingId] = useState(null);

  // State to control Add Project modal
  const [showAddModal, setShowAddModal] = useState(false);

  // State for new project form
  const [newProject, setNewProject] = useState({
    name: '',
    id: '',
    count: 0,
    timePerTransactionMin: 0,
    businessHoursBack: 0
  });

  // State for Add Project error
  const [addError, setAddError] = useState('');

  // Load projects on initial render
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch all projects from backend
  async function fetchProjects() {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:4000/api/projects');
      setProjects(res.data || []);
    } catch (err) {
      console.error('Failed to fetch projects', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  // Static IT rate
  const IT_RATE = 100;

  // Static Business rate
  const BUSINESS_RATE = 150;

  // Compute derived IT and business savings
  function computeDerived(p) {
    const timeMin = Number(p.timePerTransactionMin) || 0;
    const count = Number(p.count) || 0;

    const itHours = (count * timeMin) / 60;
    const itSaving = itHours * IT_RATE;

    const businessHoursBack = Number(p.businessHoursBack) || 0;
    const businessSaving = (count * businessHoursBack * BUSINESS_RATE) / 60;

    const total = itSaving + businessSaving;
    return { itHours, itSaving, businessSaving, total };
  }

  // Update project locally
  function updateLocal(id, patch) {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }

  // Save project to backend
  async function persistProject(id) {
    const item = projects.find(p => p.id === id);
    if (!item) return;
    setSavingId(id);
    try {
      await axios.post('http://localhost:4000/api/projects', item);
    } catch (err) {
      console.error('Failed to save project', err);
      fetchProjects();
    } finally {
      setSavingId(null);
    }
  }

  // Handle count change
  function onCountChange(id, raw) {
    const val = raw === '' ? '' : Number(raw);
    updateLocal(id, { count: val });
  }

  // Save count value
  function onCountSave(id) {
    const proj = projects.find(p => p.id === id);
    const normalized = proj && proj.count === '' ? 0 : Number(proj?.count || 0);
    updateLocal(id, { count: normalized });
    persistProject(id);
  }

  // Handle time per transaction change
  function onTimeChange(id, raw) {
    const val = raw === '' ? '' : Number(raw);
    updateLocal(id, { timePerTransactionMin: val });
  }

  // Save time per transaction
  function onTimeSave(id) {
    const proj = projects.find(p => p.id === id);
    const normalized = proj && proj.timePerTransactionMin === '' ? 0 : Number(proj?.timePerTransactionMin || 0);
    updateLocal(id, { timePerTransactionMin: normalized });
    persistProject(id);
  }

  // Handle business hours back change
  function onBizChange(id, raw) {
    const val = raw === '' ? '' : Number(raw);
    updateLocal(id, { businessHoursBack: val });
  }

  // Save business hours back
  function onBizSave(id) {
    const proj = projects.find(p => p.id === id);
    const normalized = proj && proj.businessHoursBack === '' ? 0 : Number(proj?.businessHoursBack || 0);
    updateLocal(id, { businessHoursBack: normalized });
    persistProject(id);
  }

  // Remove project
  async function handleRemoveProject(id) {
    const ok = window.confirm('Delete this project?');
    if (!ok) return;
    const before = projects;
    setProjects(prev => prev.filter(p => p.id !== id));
    setSavingId(id);
    try {
      await axios.delete(`http://localhost:4000/api/projects/${encodeURIComponent(id)}`);
    } catch (err) {
      console.error('Failed to delete project', err);
      setProjects(before);
    } finally {
      setSavingId(null);
    }
  }

  // Open Add Project modal
  function openAddModal() {
    setAddError('');
    setNewProject({ name: '', id: '', count: 0, timePerTransactionMin: 0, businessHoursBack: 0 });
    setShowAddModal(true);
  }

  // Close Add Project modal
  function closeAddModal() {
    setShowAddModal(false);
    setAddError('');
  }

  // Handle new project input change
  function onNewChange(e) {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  }

  // Convert name to URL-safe id
  function slugify(text) {
    return String(text || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Add new project
  async function addProject() {
    if (!newProject.name || String(newProject.name).trim() === '') {
      setAddError('Project name is required');
      return;
    }

    const idCandidate = newProject.id && newProject.id.trim() !== '' ? newProject.id.trim() : slugify(newProject.name);
    let finalId = idCandidate; let n = 1;

    while (projects.some(p => p.id === finalId)) finalId = `${idCandidate}-${n++}`;

    const toSave = {
      id: finalId,
      name: newProject.name.trim(),
      count: Number(newProject.count || 0),
      timePerTransactionMin: Number(newProject.timePerTransactionMin || 0),
      businessHoursBack: Number(newProject.businessHoursBack || 0)
    };

    // Update UI instantly
    setProjects(prev => [...prev, toSave]);
    closeAddModal();
    setSavingId(finalId);

    try {
      await axios.post('http://localhost:4000/api/projects', toSave);
    } catch (err) {
      console.error('Failed to add project', err);
      fetchProjects();
    } finally {
      setSavingId(null);
    }
  }

  // Calculate totals for all projects
  const totals = projects.reduce(
    (acc, p) => {
      const d = computeDerived(p);
      acc.itHours += d.itHours;
      acc.itSaving += d.itSaving;
      acc.businessSaving += d.businessSaving;
      acc.total += d.total;
      return acc;
    },
    { itHours: 0, itSaving: 0, businessSaving: 0, total: 0 }
  );

  return (
    <div>
      {/* Top header and Add button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Automation Projects</h5>
        <button className="btn btn-primary btn-sm" onClick={openAddModal}>
          + Add Project
        </button>
      </div>
