// client/src/components/Calculator.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function formatNum(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Calculator() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  // ---- Add Project modal state (restored) ----
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    id: '',
    count: 0,
    timePerTransactionMin: 0,
    businessHoursBack: 0
  });
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line
  }, []);

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

  // Rates (same for all projects; adjust if you later add per-project rates)
  const IT_RATE = 100;
  const BUSINESS_RATE = 150;

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

  // -------- generic helpers --------
  function updateLocal(id, patch) {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }
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

  // Count
  function onCountChange(id, raw) {
    const val = raw === '' ? '' : Number(raw);
    updateLocal(id, { count: val });
  }
  function onCountSave(id) {
    const proj = projects.find(p => p.id === id);
    const normalized = proj && proj.count === '' ? 0 : Number(proj?.count || 0);
    updateLocal(id, { count: normalized });
    persistProject(id);
  }

  // Time / transaction
  function onTimeChange(id, raw) {
    const val = raw === '' ? '' : Number(raw);
    updateLocal(id, { timePerTransactionMin: val });
  }
  function onTimeSave(id) {
    const proj = projects.find(p => p.id === id);
    const normalized = proj && proj.timePerTransactionMin === '' ? 0 : Number(proj?.timePerTransactionMin || 0);
    updateLocal(id, { timePerTransactionMin: normalized });
    persistProject(id);
  }

  // Business hours back
  function onBizChange(id, raw) {
    const val = raw === '' ? '' : Number(raw);
    updateLocal(id, { businessHoursBack: val });
  }
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

  // ---- Add Project modal handlers (restored) ----
  function openAddModal() {
    setAddError('');
    setNewProject({ name: '', id: '', count: 0, timePerTransactionMin: 0, businessHoursBack: 0 });
    setShowAddModal(true);
  }
  function closeAddModal() {
    setShowAddModal(false);
    setAddError('');
  }
  function onNewChange(e) {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  }
  function slugify(text) {
    return String(text || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
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

    // optimistic UI
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

  function renderRow(p) {
    const { itHours, itSaving, businessSaving, total } = computeDerived(p);
    return (
      <tr key={p.id}>
        <td style={{ minWidth: 180 }}>
          <strong>{p.name}</strong>
          {/* <div className="text-muted small">id: {p.id}</div> */}
        </td>

        {/* COUNT */}
        <td className="align-middle">
          <input
            type="number"
            min="0"
            step="1"
            className="form-control form-control-sm modern-input"
            style={{ width: 110 }}
            value={p.count === '' ? '' : p.count ?? 0}
            onChange={(e) => onCountChange(p.id, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onCountSave(p.id); }}
            onBlur={() => onCountSave(p.id)}
            aria-label={`Count for ${p.name}`}
          />
        </td>

        {/* TIME / TRANSACTION (narrow) */}
        <td className="align-middle">
          <div className="input-group input-group-sm modern-input-group" style={{ width: 90 }}>
            <input
              type="number"
              min="0"
              step="1"
              className="form-control modern-input"
              value={p.timePerTransactionMin === '' ? '' : p.timePerTransactionMin ?? 0}
              onChange={(e) => onTimeChange(p.id, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onTimeSave(p.id); }}
              onBlur={() => onTimeSave(p.id)}
              aria-label={`Time per transaction (min) for ${p.name}`}
            />
            <span className="input-group-text">m</span>
          </div>
        </td>

        {/* IT HOURS (read-only box) */}
        <td className="align-middle">
          <input
            type="text"
            readOnly
            className="form-control form-control-sm modern-input ro-input"
            style={{ width: 110 }}
            value={formatNum(itHours)}
            aria-label={`IT hours for ${p.name}`}
          />
        </td>

        {/* IT SAVING (read-only box) */}
        <td className="align-middle">
          <input
            type="text"
            readOnly
            className="form-control form-control-sm modern-input ro-input"
            style={{ width: 130 }}
            value={formatNum(itSaving)}
            aria-label={`IT saving for ${p.name}`}
          />
        </td>

        {/* BUSINESS HOURS BACK (narrow) */}
        <td className="align-middle">
          <div className="input-group input-group-sm modern-input-group" style={{ width: 90 }}>
            <input
              type="number"
              min="0"
              step="1"
              className="form-control modern-input"
              value={p.businessHoursBack === '' ? '' : p.businessHoursBack ?? 0}
              onChange={(e) => onBizChange(p.id, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onBizSave(p.id); }}
              onBlur={() => onBizSave(p.id)}
              aria-label={`Business hours back for ${p.name}`}
            />
            <span className="input-group-text">h</span>
          </div>
        </td>

        {/* BUSINESS SAVING (read-only box) */}
        <td className="align-middle">
          <input
            type="text"
            readOnly
            className="form-control form-control-sm modern-input ro-input"
            style={{ width: 130 }}
            value={formatNum(businessSaving)}
            aria-label={`Business saving for ${p.name}`}
          />
        </td>

        {/* TOTAL (read-only box) */}
        <td className="align-middle">
          <input
            type="text"
            readOnly
            className="form-control form-control-sm modern-input ro-input fw-bold"
            style={{ width: 140 }}
            value={formatNum(total)}
            aria-label={`Total saving for ${p.name}`}
          />
        </td>

        {/* Actions */}
        <td className="align-middle text-end">
          <button
            className="btn btn-sm btn-outline-danger"
            title="Remove project"
            onClick={() => handleRemoveProject(p.id)}
            disabled={savingId === p.id}
          >
            {savingId === p.id ? 'Removing…' : 'Remove'}
          </button>
        </td>
      </tr>
    );
  }

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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Automation Projects</h5>
        <button className="btn btn-primary btn-sm" onClick={openAddModal}>
          + Add Project
        </button>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-3">Loading projects…</div>
          ) : projects.length === 0 ? (
            <div className="p-3 text-muted">No projects yet. Use “Add Project” to create one.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-striped table-hover align-middle mb-0">
                <thead className="table-light sticky-top shadow-sm">
                  <tr>
                    <th style={{ width: 200 }}>Project</th>
                    <th style={{ width: 120 }}>Count</th>
                    <th style={{ width: 120 }}>Time / Transaction</th>
                    <th style={{ width: 120 }}>IT Hours</th>
                    <th style={{ width: 140 }}>IT Saving</th>
                    <th style={{ width: 120 }}>Business Hr</th>
                    <th style={{ width: 140 }}>Business Saving</th>
                    <th style={{ width: 150 }}>Total</th>
                    <th style={{ width: 120 }}></th>
                  </tr>
                </thead>
                <tbody>{projects.map(renderRow)}</tbody>
                <tfoot>
                  <tr className="table-secondary">
                    <td className="fw-bold">Totals</td>
                    <td></td>
                    <td></td>
                    <td>
                      <input
                        type="text"
                        readOnly
                        className="form-control form-control-sm modern-input ro-input"
                        style={{ width: 110 }}
                        value={formatNum(totals.itHours)}
                        aria-label="Total IT hours"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        readOnly
                        className="form-control form-control-sm modern-input ro-input"
                        style={{ width: 130 }}
                        value={formatNum(totals.itSaving)}
                        aria-label="Total IT saving"
                      />
                    </td>
                    <td></td>
                    <td>
                      <input
                        type="text"
                        readOnly
                        className="form-control form-control-sm modern-input ro-input"
                        style={{ width: 130 }}
                        value={formatNum(totals.businessSaving)}
                        aria-label="Total business saving"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        readOnly
                        className="form-control form-control-sm modern-input ro-input fw-bold"
                        style={{ width: 140 }}
                        value={formatNum(totals.total)}
                        aria-label="Grand total"
                      />
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ---- Add Project modal (restored) ---- */}
      {showAddModal && (
        <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 1050, minWidth: 360 }}>
          <div className="card shadow modern-modal">
            <div className="card-body">
              <h5 className="card-title">Add Project</h5>

              <div className="mb-2">
                <label className="form-label small">Name *</label>
                <input name="name" className="form-control form-control-sm" value={newProject.name} onChange={onNewChange} />
              </div>

              <div className="row">
                <div className="col-6 mb-2">
                  <label className="form-label small">Count</label>
                  <input name="count" type="number" min="0" step="1" className="form-control form-control-sm" value={newProject.count} onChange={onNewChange} />
                </div>
                <div className="col-6 mb-2">
                  <label className="form-label small">Time / Transaction (min)</label>
                  <input name="timePerTransactionMin" type="number" min="0" step="1" className="form-control form-control-sm" value={newProject.timePerTransactionMin} onChange={onNewChange} />
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label small">Business Hours Back</label>
                <input name="businessHoursBack" type="number" min="0" step="1" className="form-control form-control-sm" value={newProject.businessHoursBack} onChange={onNewChange} />
              </div>

              {addError && <div className="text-danger small mb-2">{addError}</div>}

              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-secondary btn-sm me-2" onClick={closeAddModal}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={addProject}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
