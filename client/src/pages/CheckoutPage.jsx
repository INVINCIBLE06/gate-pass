import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../hooks/useApi.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';

const STEP_LABELS = {
  in_checking:       { next: null, label: 'Waiting to start unloading', color: 'var(--warning)' },
  unloading_started: { next: 'unloading_over', label: 'Mark Unloading Complete', color: 'var(--info)' },
  unloading_over:    { next: 'checked_out', label: 'Check Out & Lock Gate Pass', color: 'var(--success)' },
  checked_out:       { next: null, label: 'Checked Out', color: 'var(--success)' },
};

const STEPS = ['in_checking','unloading_started','unloading_over','checked_out'];
const STEP_NAMES = ['In Checking','Unloading','Unloaded','Checked Out'];

export default function CheckoutPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [gp, setGp] = useState(null);
  const [loading, setLoading] = useState(!!code);
  const [codeInput, setCodeInput] = useState('');
  const [vehicleInput, setVehicleInput] = useState('');
  const [vehicleResults, setVehicleResults] = useState([]);
  const [transitioning, setTransitioning] = useState(false);

  const loadGp = async (c) => {
    setLoading(true);
    try { setGp(await apiFetch(`/gate-passes/${c.toUpperCase()}`)); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (code) loadGp(code); }, [code]);

  const searchVehicle = async () => {
    try { setVehicleResults(await apiFetch(`/gate-passes/search?vehicle=${encodeURIComponent(vehicleInput)}`)); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const transition = async () => {
    setTransitioning(true);
    try {
      const updated = await apiFetch(`/gate-passes/${gp.gatePassCode}/checkout`, { method:'POST' });
      setGp(p => ({ ...p, ...updated }));
      if (updated.status === 'checked_out') showToast(`${gp.gatePassCode} has been checked out and locked.`, 'success', 'Checked Out');
      else showToast(`Status updated to: ${updated.status.replace(/_/g,' ')}.`, 'success');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setTransitioning(false); }
  };

  if (!code && !gp) {
    return (
      <div style={{ maxWidth:520 }}>
        <div className="card" style={{ marginBottom:'1rem' }}>
          <div className="card-title">🔍 Look Up by Code</div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <input value={codeInput} onChange={e=>setCodeInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&navigate(`/checkout/${codeInput.trim().toUpperCase()}`)} placeholder="GP-000001" autoFocus />
            <button className="btn btn-primary" onClick={()=>navigate(`/checkout/${codeInput.trim().toUpperCase()}`)}>Load</button>
          </div>
        </div>
        <div className="card">
          <div className="card-title">🚛 Search by Vehicle Number</div>
          <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.75rem' }}>
            <input value={vehicleInput} onChange={e=>setVehicleInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchVehicle()} placeholder="Enter vehicle number..." />
            <button className="btn btn-primary" onClick={searchVehicle}>Search</button>
          </div>
          {vehicleResults.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Code</th><th>Vehicle</th><th>Driver</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {vehicleResults.map(r => (
                    <tr key={r._id}>
                      <td><span className="td-code">{r.gatePassCode}</span></td>
                      <td className="td-primary">{r.vehicleNumber}</td>
                      <td className="td-muted">{r.driverName||'—'}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td><button className="btn btn-ghost btn-sm" onClick={()=>navigate(`/checkout/${r.gatePassCode}`)}>Select →</button></td>
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

  if (loading) return <div className="loading-center"><span className="spinner" /></div>;
  if (!gp) return null;

  const currentStep = STEPS.indexOf(gp.status);
  const meta = STEP_LABELS[gp.status];

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
          <div>
            <div style={{ fontSize:'1.4rem', fontWeight:900, fontFamily:'monospace', color:'var(--primary)', marginBottom:'0.4rem' }}>{gp.gatePassCode}</div>
            <div className="info-grid" style={{ gridTemplateColumns:'repeat(2,1fr)' }}>
              {[['Vehicle',gp.vehicleNumber],['Driver',gp.driverName||'—'],['PO No.',gp.poNumber],['From',gp.fromCity||'—']].map(([l,v])=>(
                <div key={l} className="info-item"><div className="info-label">{l}</div><div className="info-value">{v}</div></div>
              ))}
            </div>
          </div>
          <StatusBadge status={gp.status} />
        </div>

        {/* Progress steps */}
        <div style={{ display:'flex', gap:0, marginBottom:'1.5rem', position:'relative' }}>
          <div style={{ position:'absolute', top:14, left:'12.5%', right:'12.5%', height:2, background:'var(--border)', zIndex:0 }} />
          {STEPS.map((s, i) => {
            const done = i < currentStep, active = i === currentStep;
            return (
              <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem', position:'relative', zIndex:1 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--border)',
                  color: (done || active) ? 'white' : 'var(--text-muted)',
                  fontSize:'0.75rem', fontWeight:700,
                  boxShadow: active ? `0 0 0 4px var(--primary-soft)` : 'none',
                  transition: 'all 0.3s',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <div style={{ fontSize:'0.65rem', fontWeight: active?700:500, color: active?'var(--primary)':done?'var(--success)':'var(--text-muted)', textAlign:'center', lineHeight:1.3 }}>
                  {STEP_NAMES[i]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timestamps */}
        <div className="info-grid" style={{ marginBottom:'1.25rem' }}>
          {gp.unloadingStartedAt && <div className="info-item"><div className="info-label">Unloading Started</div><div className="info-value" style={{fontSize:'0.8rem'}}>{new Date(gp.unloadingStartedAt).toLocaleString()}</div></div>}
          {gp.unloadingOverAt    && <div className="info-item"><div className="info-label">Unloading Completed</div><div className="info-value" style={{fontSize:'0.8rem'}}>{new Date(gp.unloadingOverAt).toLocaleString()}</div></div>}
          {gp.checkedOutAt       && <div className="info-item"><div className="info-label">Checked Out</div><div className="info-value" style={{fontSize:'0.8rem'}}>{new Date(gp.checkedOutAt).toLocaleString()}</div></div>}
        </div>

        {gp.locked ? (
          <div className="alert alert-success">
            <span>✓</span>
            <span>Gate pass has been checked out and permanently locked.</span>
          </div>
        ) : meta?.next ? (
          <button className="btn btn-primary btn-lg" style={{ width:'100%' }} onClick={transition} disabled={transitioning}>
            {transitioning ? <><span className="spinner" style={{width:'1rem',height:'1rem'}} />Processing...</> : `${meta.label} →`}
          </button>
        ) : (
          <div className="alert alert-info">
            <span>ℹ</span>
            <span>Cannot proceed — gate pass is in <strong>{gp.status.replace(/_/g,' ')}</strong> state. Complete unloading first.</span>
          </div>
        )}
      </div>
    </div>
  );
}
