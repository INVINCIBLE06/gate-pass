import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../hooks/useApi.js';
import { useToast } from '../context/ToastContext.jsx';

const VEHICLE_TYPES = ['Truck','Tempo','Container','Mini Truck','Trailer','Others'];

const emptyForm = {
  vehicleNumber:'', vehicleType:'Truck',
  driverName:'', driverPhone:'', driverLicense:'',
  poNumber:'', transporterName:'', fromCity:'',
  numberOfPackages:'', grossWeightKg:'', sealNumber:'', remarks:'',
};

export default function GatePassFormModal({ onClose, onCreated }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [invoiceMeta, setInvoiceMeta] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState(1); // 1=vehicle+driver, 2=shipment, 3=invoices
  const fileRef = useRef();

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.vehicleNumber.trim()) e.vehicleNumber = 'Required';
    if (!form.driverName.trim())    e.driverName    = 'Required';
    if (!form.poNumber.trim())      e.poNumber      = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles).filter(f => ['application/pdf','image/jpeg','image/png'].includes(f.type));
    setFiles(prev => [...prev, ...arr]);
    setInvoiceMeta(prev => [...prev, ...arr.map(() => ({ supplierName:'', invoiceNumber:'', invoiceDate:'' }))]);
  };

  const removeFile = (i) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setInvoiceMeta(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateMeta = (i, key, val) =>
    setInvoiceMeta(prev => prev.map((m, idx) => idx === i ? { ...m, [key]: val } : m));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { showToast('Please fill all required fields.', 'error'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('files', f));
      fd.append('invoices', JSON.stringify(invoiceMeta));
      const gp = await apiFetch('/gate-passes', { method:'POST', body: fd });
      showToast(`Gate pass ${gp.gatePassCode} created!`, 'success', 'Created');
      onCreated?.(gp);
      onClose();
      navigate(`/gate-pass/${gp.gatePassCode}/label`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setLoading(false); }
  };

  const Field = ({ label, name, required, children, hint }) => (
    <div className="form-group" style={{ marginBottom:0 }}>
      <label className="form-label">{label}{required && <span style={{color:'var(--danger)'}}>*</span>}</label>
      {children}
      {hint && <div className="form-hint">{hint}</div>}
      {errors[name] && <div className="form-error">⚠ {errors[name]}</div>}
    </div>
  );

  const STEPS = ['Vehicle & Driver', 'Shipment Details', 'Invoices'];

  return (
    <div className="modal-overlay" style={{ alignItems:'flex-start', paddingTop:'2rem', overflowY:'auto' }}>
      <div className="modal" style={{ maxWidth:680, width:'100%', maxHeight:'calc(100vh - 4rem)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div className="modal-header" style={{ flexShrink:0 }}>
          <div>
            <div className="modal-title">New Gate Pass</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>
              Register an incoming vehicle
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Step tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(i+1)}
              style={{
                flex:1, padding:'0.65rem 0.5rem', border:'none', borderBottom: step===i+1 ? '2px solid var(--primary)' : '2px solid transparent',
                background:'transparent', color: step===i+1 ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: step===i+1 ? 700 : 500, fontSize:'0.8rem', cursor:'pointer',
                transition:'color 150ms, border-color 150ms',
              }}
            >
              <span style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem' }}>
                <span style={{ width:18, height:18, borderRadius:'50%', background: step>i ? 'var(--primary)' : step===i+1 ? 'var(--primary)' : 'var(--border)', color:'white', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700 }}>
                  {i+1}
                </span>
                {s}
              </span>
            </button>
          ))}
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} style={{ flex:1, overflowY:'auto', padding:'1.25rem' }}>

          {/* Step 1 — Vehicle & Driver */}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ padding:'0.7rem', background:'var(--surface2)', borderRadius:'var(--radius-sm)', fontSize:'0.78rem', color:'var(--text-muted)' }}>
                🚛 Fields marked <span style={{color:'var(--danger)'}}>*</span> are required
              </div>
              <div className="form-row">
                <Field label="Vehicle Number" name="vehicleNumber" required>
                  <input value={form.vehicleNumber} onChange={e => set('vehicleNumber', e.target.value.toUpperCase())} placeholder="e.g. MH12AB1234" autoFocus />
                </Field>
                <Field label="Vehicle Type" name="vehicleType">
                  <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)}>
                    {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
              <div className="form-row">
                <Field label="Driver Name" name="driverName" required>
                  <input value={form.driverName} onChange={e => set('driverName', e.target.value)} placeholder="Full name" />
                </Field>
                <Field label="Driver Phone" name="driverPhone">
                  <input value={form.driverPhone} onChange={e => set('driverPhone', e.target.value)} placeholder="+91 98765 43210 (optional)" type="tel" />
                </Field>
                <Field label="Driver License No." name="driverLicense">
                  <input value={form.driverLicense} onChange={e => set('driverLicense', e.target.value)} placeholder="Optional" />
                </Field>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:'0.5rem' }}>
                <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>Next: Shipment Details →</button>
              </div>
            </div>
          )}

          {/* Step 2 — Shipment */}
          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="form-row">
                <Field label="PO Number" name="poNumber" required>
                  <input value={form.poNumber} onChange={e => set('poNumber', e.target.value)} placeholder="PO-2024-0001" />
                </Field>
                <Field label="From City / Origin" name="fromCity">
                  <input value={form.fromCity} onChange={e => set('fromCity', e.target.value)} placeholder="e.g. Mumbai (optional)" />
                </Field>
                <Field label="Transporter / Logistics" name="transporterName">
                  <input value={form.transporterName} onChange={e => set('transporterName', e.target.value)} placeholder="Optional" />
                </Field>
              </div>
              <div className="form-row">
                <Field label="Number of Packages" name="numberOfPackages">
                  <input type="number" min="1" value={form.numberOfPackages} onChange={e => set('numberOfPackages', e.target.value)} placeholder="Optional" />
                </Field>
                <Field label="Gross Weight (kg)" name="grossWeightKg">
                  <input type="number" min="0" step="0.1" value={form.grossWeightKg} onChange={e => set('grossWeightKg', e.target.value)} placeholder="Optional" />
                </Field>
                <Field label="Seal Number" name="sealNumber">
                  <input value={form.sealNumber} onChange={e => set('sealNumber', e.target.value)} placeholder="Optional" />
                </Field>
              </div>
              <Field label="Remarks / Notes" name="remarks">
                <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Any additional notes..." rows={2} />
              </Field>
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>Next: Invoices →</button>
              </div>
            </div>
          )}

          {/* Step 3 — Invoices */}
          {step === 3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div
                className={`dropzone${dragging ? ' dragging' : ''}`}
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
              >
                <div className="dropzone-icon">📎</div>
                <div className="dropzone-title">Drop invoice files here or click to browse</div>
                <div className="dropzone-sub">PDF, JPG, PNG · Max 20MB · Optional</div>
                {files.length > 0 && (
                  <div className="dropzone-files">
                    {files.map((f, i) => (
                      <span key={i} className="dropzone-file-chip">
                        📄 {f.name}
                        <button type="button" onClick={ev => { ev.stopPropagation(); removeFile(i); }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => addFiles(e.target.files)} />

              {files.map((f, i) => (
                <div key={i} style={{ padding:'0.85rem', background:'var(--surface2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
                  <div style={{ fontWeight:600, fontSize:'0.82rem', marginBottom:'0.6rem' }}>📄 {f.name}</div>
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom:0 }}>
                      <label className="form-label">Supplier Name</label>
                      <input value={invoiceMeta[i]?.supplierName||''} onChange={e => updateMeta(i,'supplierName',e.target.value)} placeholder="Supplier" />
                    </div>
                    <div className="form-group" style={{ marginBottom:0 }}>
                      <label className="form-label">Invoice Number</label>
                      <input value={invoiceMeta[i]?.invoiceNumber||''} onChange={e => updateMeta(i,'invoiceNumber',e.target.value)} placeholder="INV-001" />
                    </div>
                    <div className="form-group" style={{ marginBottom:0 }}>
                      <label className="form-label">Invoice Date</label>
                      <input type="date" value={invoiceMeta[i]?.invoiceDate||''} onChange={e => updateMeta(i,'invoiceDate',e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? <><span className="spinner" style={{width:'1rem',height:'1rem'}} />Creating...</> : '✓ Create Gate Pass'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
