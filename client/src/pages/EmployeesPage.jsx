import React, { useState, useEffect } from 'react';
import { apiFetch } from '../hooks/useApi.js';
import { useToast } from '../context/ToastContext.jsx';

function AddEmployeeModal({ onClose, onAdded }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const emp = await apiFetch('/employees', { method:'POST', body: form });
      showToast(`${emp.name} has been added as an employee.`, 'success', 'Employee Added');
      onAdded(emp); onClose();
    } catch (err) {
      showToast(err.message, 'error');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add New Employee</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name <span style={{color:'var(--danger)'}}>*</span></label>
            <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="John Smith" required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address <span style={{color:'var(--danger)'}}>*</span></label>
            <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="john@company.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Temporary Password <span style={{color:'var(--danger)'}}>*</span></label>
            <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min. 6 characters" required minLength={6} />
            <div className="form-hint">The employee should change this after first login.</div>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <input value="Employee (read/write)" disabled />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toggling, setToggling] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch('/employees').then(setEmployees).catch(e => showToast(e.message,'error')).finally(() => setLoading(false));
  }, []);

  const toggle = async (id, isActive) => {
    setToggling(p => ({ ...p, [id]: true }));
    try {
      const updated = await apiFetch(`/employees/${id}`, { method:'PATCH', body: { is_active: isActive } });
      setEmployees(prev => prev.map(e => e._id === id ? { ...e, ...updated } : e));
      showToast(`Employee ${isActive ? 'activated' : 'deactivated'} successfully.`, isActive ? 'success' : 'warning');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setToggling(p => ({ ...p, [id]: false })); }
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
  );
  const active = employees.filter(e => e.isActive).length;

  if (loading) return <div className="loading-center"><span className="spinner" /></div>;

  return (
    <div>
      {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} onAdded={e => setEmployees(p => [e,...p])} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'0.2rem' }}>
            {active} active · {employees.length - active} inactive
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Employee</button>
        </div>
      </div>

      <div className="card" style={{ padding:0 }}>
        <div style={{ padding:'0.85rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <div className="search-wrap" style={{ flex:1, maxWidth:300 }}>
            <svg className="search-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email..." />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">{search ? 'No results found' : 'No employees yet'}</div>
            <div className="empty-state-sub">{search ? 'Try a different search term' : 'Add your first employee to get started'}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Employee</th><th>Email</th><th>Status</th><th>Added</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--primary-soft)', color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.8rem', flexShrink:0 }}>
                          {emp.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <span className="td-primary">{emp.name}</span>
                      </div>
                    </td>
                    <td className="td-muted">{emp.email}</td>
                    <td>
                      <span className={`badge ${emp.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="td-muted">{new Date(emp.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${emp.isActive ? 'btn-ghost' : 'btn-success'}`}
                        style={{ borderColor: emp.isActive ? 'var(--danger)' : undefined, color: emp.isActive ? 'var(--danger)' : undefined }}
                        onClick={() => toggle(emp._id, !emp.isActive)}
                        disabled={toggling[emp._id]}
                      >
                        {toggling[emp._id] ? '...' : emp.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
