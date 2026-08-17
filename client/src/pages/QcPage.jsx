import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../hooks/useApi.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';

function CodeLookup() {
  const [val, setVal] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const search = async () => {
    try { await apiFetch(`/gate-passes/${val.trim().toUpperCase()}`); navigate(`/qc/${val.trim().toUpperCase()}`); }
    catch { showToast('Gate pass not found.', 'error'); }
  };
  return (
    <div style={{ maxWidth:440 }}>
      <div className="card">
        <div className="card-title">🔍 QC Inspection — Look Up</div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="GP-000001" autoFocus />
          <button className="btn btn-primary" onClick={search}>Load</button>
        </div>
      </div>
    </div>
  );
}

function ItemDetailModal({ code, itemId, onClose, onUpdated }) {
  const { showToast } = useToast();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeStatus, setRouteStatus] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch(`/gate-passes/${code}/items/${itemId}`)
      .then(setDetail).catch(e => showToast(e.message,'error')).finally(() => setLoading(false));
  }, [code, itemId]);

  const route = async () => {
    if (!routeStatus) { showToast('Please select a status.', 'warning'); return; }
    if (!desc)        { showToast('Description is required.', 'warning'); return; }
    setSaving(true);
    try {
      await apiFetch(`/gate-passes/${code}/items/${itemId}/route`, { method:'PATCH', body: { status: routeStatus, description: desc } });
      showToast(`Item routed to ${routeStatus.toUpperCase()}.`, 'success');
      onUpdated(); onClose();
    } catch (e) { showToast(e.message,'error'); setSaving(false); }
  };

  const postItem = async () => {
    setSaving(true);
    try {
      await apiFetch(`/gate-passes/${code}/items/${itemId}/post`, { method:'POST' });
      showToast('Item posted to Digital Drive.', 'success');
      onUpdated(); onClose();
    } catch (e) { showToast(e.message,'error'); setSaving(false); }
  };

  if (loading) return (
    <div className="modal-overlay"><div className="modal"><div className="loading-center"><span className="spinner" /></div></div></div>
  );

  const item = detail?.item;
  const events = detail?.events || [];
  const dotCls = (t) => ({ quarantine:'quarantine', grn:'grn', posted:'posted' }[t] || 'default');

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth:560 }}>
        <div className="modal-header">
          <div className="modal-title">Item Detail — <span className="code-chip">{item?.itemCode}</span></div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="info-grid" style={{ marginBottom:'1.25rem' }}>
          <div className="info-item"><div className="info-label">Part #</div><div className="info-value">{item?.partNumber}</div></div>
          <div className="info-item"><div className="info-label">Internal #</div><div className="info-value">{item?.internalPartNumber||'—'}</div></div>
          <div className="info-item"><div className="info-label">Quantity</div><div className="info-value">{item?.quantity}</div></div>
          <div className="info-item"><div className="info-label">Status</div><div className="info-value"><StatusBadge status={item?.status} /></div></div>
          <div className="info-item"><div className="info-label">Supplier</div><div className="info-value">{item?.supplierName||'—'}</div></div>
          <div className="info-item"><div className="info-label">Invoice</div><div className="info-value">{item?.invoiceNumber||'—'}</div></div>
        </div>

        {events.length > 0 && (
          <div style={{ marginBottom:'1.25rem' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--text-muted)', marginBottom:'0.75rem' }}>History</div>
            <div className="timeline">
              {events.map(ev => (
                <div key={ev._id} className="timeline-item">
                  <div className={`timeline-dot ${dotCls(ev.eventType)}`}>{ev.eventType[0].toUpperCase()}</div>
                  <div className="timeline-content">
                    <div className="timeline-label"><StatusBadge status={ev.eventType} /></div>
                    {ev.description && <div className="timeline-desc">{ev.description}</div>}
                    <div className="timeline-time">{new Date(ev.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr className="divider" />

        {item?.posted && <div className="alert alert-success">✓ Posted to Digital Drive on {new Date(item.postedAt).toLocaleString()}</div>}

        {item?.status === 'grn' && !item?.posted && (
          <button className="btn btn-primary" onClick={postItem} disabled={saving} style={{ marginBottom:'0.75rem' }}>
            {saving ? 'Posting...' : '📤 Post to Digital Drive'}
          </button>
        )}

        {item?.status === 'pending_qc' && (
          <>
            <div className="form-group">
              <label className="form-label">Route To <span style={{color:'var(--danger)'}}>*</span></label>
              <select value={routeStatus} onChange={e => setRouteStatus(e.target.value)}>
                <option value="">Select destination...</option>
                <option value="quarantine">🔴 Quarantine</option>
                <option value="grn">🟢 GRN (Good Receipt Note)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reason / Notes <span style={{color:'var(--danger)'}}>*</span></label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Describe the condition, reason for routing..." />
            </div>
            <div className="modal-footer" style={{ paddingTop:0, borderTop:'none', marginTop:0 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={route} disabled={saving}>
                {saving ? 'Saving...' : 'Confirm Route'}
              </button>
            </div>
          </>
        )}

        {item?.status !== 'pending_qc' && !item?.posted && item?.status !== 'grn' && (
          <div className="modal-footer" style={{ paddingTop:0, borderTop:'none', marginTop:0 }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        )}

        {(item?.status === 'quarantine' || item?.status === 'grn') && item?.posted !== false && item?.status !== 'grn' && (
          <div className="modal-footer" style={{ paddingTop:0, borderTop:'none', marginTop:0 }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QcPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!code);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = async (c) => {
    try { setData(await apiFetch(`/gate-passes/${c}/qc`)); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (code) load(code); }, [code]);

  if (!code) return <CodeLookup />;
  if (loading) return <div className="loading-center"><span className="spinner" /></div>;
  if (!data) return null;

  const { gatePass: gp, items } = data;
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
  const counts = { all: items.length, pending_qc: 0, quarantine: 0, grn: 0 };
  items.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++; });

  return (
    <div style={{ maxWidth: 960 }}>
      {selectedItem && (
        <ItemDetailModal code={gp.gatePassCode} itemId={selectedItem} onClose={() => setSelectedItem(null)} onUpdated={() => load(gp.gatePassCode)} />
      )}

      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'0.75rem' }}>
          <div>
            <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', marginBottom:'0.5rem' }}>
              <span style={{ fontSize:'1.4rem', fontWeight:900, fontFamily:'monospace', color:'var(--primary)' }}>{gp.gatePassCode}</span>
              <StatusBadge status={gp.status} />
            </div>
            <div className="info-grid">
              {[['Vehicle',gp.vehicleNumber],['Driver',gp.driverName||'—'],['PO',gp.poNumber],['From',gp.fromCity||'—']].map(([l,v]) => (
                <div key={l} className="info-item"><div className="info-label">{l}</div><div className="info-value">{v}</div></div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            {[['all','All',counts.all],['pending_qc','Pending',counts.pending_qc],['quarantine','Quarantine',counts.quarantine],['grn','GRN',counts.grn]].map(([k,l,n]) => (
              <button key={k} onClick={() => setFilter(k)} className={`btn btn-sm ${filter===k?'btn-primary':'btn-ghost'}`}>{l} ({n})</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding:0 }}>
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
          <span className="card-title" style={{ margin:0 }}>Items — {filtered.length} shown</span>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No items found</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Code</th><th>Part #</th><th>Internal #</th><th>Supplier</th><th>Qty</th><th>Status</th><th>Posted</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item._id} onClick={() => setSelectedItem(item._id)} style={{ cursor:'pointer' }}>
                    <td><span className="code-chip">{item.itemCode}</span></td>
                    <td className="td-primary">{item.partNumber}</td>
                    <td className="td-muted">{item.internalPartNumber||'—'}</td>
                    <td className="td-muted">{item.supplierName}</td>
                    <td>{item.quantity}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>{item.posted ? <span className="badge badge-posted">✓ Posted</span> : <span style={{color:'var(--text-faint)',fontSize:'0.8rem'}}>—</span>}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setSelectedItem(item._id)}}>Details →</button></td>
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
