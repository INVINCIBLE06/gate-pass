import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../hooks/useApi.js';
import StatusBadge from '../components/StatusBadge.jsx';
import GatePassFormModal from '../components/GatePassFormModal.jsx';

const statConfig = [
  { key:'total',    label:'Total Today',  icon:'📋', cls:'blue',   filter:() => true,                     allTime:true },
  { key:'active',   label:'Unloading',    icon:'🚛', cls:'amber',  filter:g => g.status==='unloading_started' },
  { key:'qc',       label:'Pending QC',   icon:'🔍', cls:'purple', filter:g => g.status==='unloading_over'    },
  { key:'checkout', label:'Checked Out',  icon:'✅', cls:'green',  filter:g => g.status==='checked_out'       },
];

const isToday = (d) => {
  const n = new Date(); const t = new Date(d);
  return t.getFullYear()===n.getFullYear() && t.getMonth()===n.getMonth() && t.getDate()===n.getDate();
};

export default function DashboardPage() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  const load = async () => {
    try { setPasses(await apiFetch('/gate-passes/dashboard')); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id); }, []);

  const today = passes.filter(g => isToday(g.createdAt));

  if (loading) return <div className="loading-center"><span className="spinner" /><span style={{color:'var(--text-muted)'}}>Loading...</span></div>;

  return (
    <div>
      {showNewModal && (
        <GatePassFormModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => load()}
        />
      )}

      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>+ New Gate Pass</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {statConfig.map(s => {
          const count = s.key === 'total' ? today.length : passes.filter(s.filter).length;
          return (
            <div key={s.key} className="stat-card">
              <div className={`stat-icon ${s.cls}`}><span style={{fontSize:'1rem'}}>{s.icon}</span></div>
              <div className="stat-value">{count}</div>
              <div className="stat-label">{s.label}</div>
              {s.allTime && <div className="stat-sub">{passes.length} all time</div>}
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0 }}>
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.5rem' }}>
          <span className="card-title" style={{ margin:0 }}>All Gate Passes</span>
          <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Auto-refreshes every 5s</span>
        </div>
        {passes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚚</div>
            <div className="empty-state-title">No gate passes yet</div>
            <div className="empty-state-sub"><button className="btn btn-primary btn-sm" style={{marginTop:'0.5rem'}} onClick={() => setShowNewModal(true)}>Create your first one</button></div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Gate Pass</th><th>Vehicle</th><th>Driver</th><th>PO Number</th><th>From</th><th>Status</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {passes.map(gp => (
                  <tr key={gp._id}>
                    <td><span className="td-code">{gp.gatePassCode}</span></td>
                    <td><div className="td-primary">{gp.vehicleNumber}</div><div className="td-muted">{gp.vehicleType}</div></td>
                    <td><div className="td-primary">{gp.driverName||'—'}</div><div className="td-muted">{gp.driverPhone||''}</div></td>
                    <td className="td-primary">{gp.poNumber}</td>
                    <td className="td-muted">{gp.fromCity||'—'}</td>
                    <td><StatusBadge status={gp.status} /></td>
                    <td className="td-muted">{new Date(gp.createdAt).toLocaleString()}</td>
                    <td>
                      <div style={{ display:'flex', gap:'0.3rem' }}>
                        <Link to={`/gate-pass/${gp.gatePassCode}/label`} className="btn btn-ghost btn-sm">Label</Link>
                        <Link to={`/unloading/${gp.gatePassCode}`} className="btn btn-ghost btn-sm">Unload</Link>
                        <Link to={`/qc/${gp.gatePassCode}`} className="btn btn-ghost btn-sm">QC</Link>
                      </div>
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
