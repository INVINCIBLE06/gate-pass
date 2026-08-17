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
    if (!val.trim()) return;
    try {
      await apiFetch(`/gate-passes/${val.trim().toUpperCase()}`);
      navigate(`/unloading/${val.trim().toUpperCase()}`);
    } catch { showToast('Gate pass not found.', 'error'); }
  };

  return (
    <div style={{ maxWidth:440 }}>
      <div className="card">
        <div className="card-title">🔍 Look Up Gate Pass</div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key==='Enter' && search()} placeholder="Enter code e.g. GP-000001" autoFocus />
          <button className="btn btn-primary" onClick={search}>Load</button>
        </div>
        <p style={{ marginTop:'0.75rem', fontSize:'0.78rem', color:'var(--text-muted)' }}>Scan QR code or type manually</p>
      </div>
    </div>
  );
}

export default function UnloadingPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [gp, setGp] = useState(null);
  const [loading, setLoading] = useState(!!code);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [newInv, setNewInv] = useState({ supplierName:'', invoiceNumber:'', invoiceDate:'' });
  const [invFile, setInvFile] = useState(null);
  const [newItems, setNewItems] = useState({});
  const [busy, setBusy] = useState({});

  const loadGp = async (c) => {
    try { setGp(await apiFetch(`/gate-passes/${c}`)); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (code) loadGp(code); }, [code]);

  if (!code) return <CodeLookup />;
  if (loading) return <div className="loading-center"><span className="spinner" /></div>;
  if (!gp) return null;

  const setBusy_ = (key, val) => setBusy(p => ({ ...p, [key]: val }));

  const startUnloading = async () => {
    setBusy_('start', true);
    try {
      const updated = await apiFetch(`/gate-passes/${gp.gatePassCode}/unloading/start`, { method:'POST' });
      setGp(p => ({ ...p, ...updated }));
      showToast('Unloading started successfully.', 'success');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setBusy_('start', false); }
  };

  const addInvoice = async () => {
    if (!invFile) { showToast('Please select an invoice file.', 'warning'); return; }
    setBusy_('inv', true);
    try {
      const fd = new FormData();
      fd.append('file', invFile);
      Object.entries(newInv).forEach(([k,v]) => fd.append(k, v));
      await apiFetch(`/gate-passes/${gp.gatePassCode}/invoices`, { method:'POST', body: fd });
      setShowAddInvoice(false); setNewInv({ supplierName:'', invoiceNumber:'', invoiceDate:'' }); setInvFile(null);
      showToast('Invoice added successfully.', 'success');
      await loadGp(gp.gatePassCode);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setBusy_('inv', false); }
  };

  const setItemField = (id, f, v) => setNewItems(p => ({ ...p, [id]: { ...(p[id]||{}), [f]: v } }));

  const addItem = async (invId) => {
    const item = newItems[invId] || {};
    if (!item.partNumber || !item.quantity) { showToast('Part number and quantity are required.', 'warning'); return; }
    setBusy_(invId, true);
    try {
      await apiFetch(`/gate-passes/${gp.gatePassCode}/items`, {
        method:'POST',
        body: { invoiceId: invId, partNumber: item.partNumber, internalPartNumber: item.internalPartNumber, quantity: parseInt(item.quantity) }
      });
      setNewItems(p => ({ ...p, [invId]: {} }));
      showToast('Item added.', 'success');
      await loadGp(gp.gatePassCode);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setBusy_(invId, false); }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Gate pass banner */}
      <div className="card" style={{ marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem' }}>
              <span style={{ fontSize:'1.4rem', fontWeight:900, fontFamily:'monospace', color:'var(--primary)' }}>{gp.gatePassCode}</span>
              <StatusBadge status={gp.status} />
              {gp.locked && <span className="badge badge-quarantine">🔒 Locked</span>}
            </div>
            <div className="info-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))' }}>
              {[
                ['Vehicle', gp.vehicleNumber], ['Type', gp.vehicleType],
                ['Driver', gp.driverName||'—'], ['Phone', gp.driverPhone||'—'],
                ['PO No.', gp.poNumber], ['From', gp.fromCity||'—'],
                ['Packages', gp.numberOfPackages ?? '—'], ['Weight', gp.grossWeightKg ? `${gp.grossWeightKg}kg` : '—'],
              ].map(([l,v]) => (
                <div key={l} className="info-item"><div className="info-label">{l}</div><div className="info-value">{v}</div></div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            {gp.status === 'in_checking' && !gp.locked && (
              <button className="btn btn-primary" onClick={startUnloading} disabled={busy.start}>
                {busy.start ? <><span className="spinner" style={{width:'14px',height:'14px'}} />Starting...</> : '▶ Start Unloading'}
              </button>
            )}
            {!gp.locked && (
              <button className="btn btn-ghost" onClick={() => setShowAddInvoice(s => !s)}>
                {showAddInvoice ? '✕ Cancel' : '+ Add Invoice'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add invoice form */}
      {showAddInvoice && (
        <div className="card" style={{ marginBottom:'1rem', background:'var(--surface2)' }}>
          <div className="card-title">📄 Add Invoice</div>
          <div className="form-row">
            {[['Supplier Name','supplierName','text'],['Invoice Number','invoiceNumber','text'],['Invoice Date','invoiceDate','date']].map(([l,k,t]) => (
              <div key={k} className="form-group">
                <label className="form-label">{l}</label>
                <input type={t} value={newInv[k]} onChange={e => setNewInv(p=>({...p,[k]:e.target.value}))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">File <span style={{color:'var(--danger)'}}>*</span></label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setInvFile(e.target.files[0])} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={addInvoice} disabled={busy.inv}>
            {busy.inv ? 'Adding...' : 'Add Invoice'}
          </button>
        </div>
      )}

      {/* Invoices */}
      {gp.invoices?.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No invoices yet</div>
            <div className="empty-state-sub">Add an invoice to start recording items</div>
          </div>
        </div>
      )}

      {gp.invoices?.map(inv => (
        <div key={inv._id} className="card" style={{ marginBottom:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.85rem', flexWrap:'wrap', gap:'0.5rem' }}>
            <div>
              <span style={{ fontWeight:700, fontSize:'0.95rem' }}>{inv.supplierName}</span>
              <span style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginLeft:'0.6rem' }}>{inv.invoiceNumber} · {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : ''}</span>
            </div>
            <a href={`/uploads/${inv.filePath?.split(/[\\/]/).pop()}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">📄 View File</a>
          </div>

          {inv.items?.length > 0 && (
            <div className="table-wrap" style={{ marginBottom:'0.75rem' }}>
              <table>
                <thead><tr><th>Code</th><th>Part Number</th><th>Internal Part #</th><th>Qty</th><th>Status</th></tr></thead>
                <tbody>
                  {inv.items.map(item => (
                    <tr key={item._id}>
                      <td><span className="code-chip">{item.itemCode}</span></td>
                      <td className="td-primary">{item.partNumber}</td>
                      <td className="td-muted">{item.internalPartNumber || '—'}</td>
                      <td>{item.quantity}</td>
                      <td><StatusBadge status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!gp.locked && (
            <div style={{ background:'var(--surface2)', borderRadius:'var(--radius-sm)', padding:'0.85rem' }}>
              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'0.6rem' }}>Add Item</div>
              <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'flex-end' }}>
                <div style={{ flex:'2 1 160px' }}>
                  <input placeholder="Part Number *" value={newItems[inv._id]?.partNumber||''} onChange={e=>setItemField(inv._id,'partNumber',e.target.value)} />
                </div>
                <div style={{ flex:'2 1 160px' }}>
                  <input placeholder="Internal Part # (optional)" value={newItems[inv._id]?.internalPartNumber||''} onChange={e=>setItemField(inv._id,'internalPartNumber',e.target.value)} />
                </div>
                <div style={{ flex:'1 1 80px' }}>
                  <input type="number" placeholder="Qty *" min="1" value={newItems[inv._id]?.quantity||''} onChange={e=>setItemField(inv._id,'quantity',e.target.value)} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => addItem(inv._id)} disabled={busy[inv._id]} style={{flexShrink:0}}>
                  {busy[inv._id] ? '...' : '+ Add'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
