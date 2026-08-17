import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiFetch } from '../hooks/useApi.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function GatePassLabelPage() {
  const { code } = useParams();
  const [gp, setGp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/gate-passes/${code}`).then(setGp).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="loading-center"><span className="spinner" /></div>;
  if (error)   return <div className="alert alert-error">{error}</div>;
  if (!gp)     return null;

  const infoRows = [
    { label:'Vehicle', value: gp.vehicleNumber },
    { label:'Type',    value: gp.vehicleType },
    { label:'PO No.',  value: gp.poNumber },
    { label:'Driver',  value: gp.driverName || '—' },
    { label:'Phone',   value: gp.driverPhone || '—' },
    { label:'License', value: gp.driverLicense || '—' },
    { label:'From',    value: gp.fromCity || '—' },
    { label:'Transporter', value: gp.transporterName || '—' },
    { label:'Packages',value: gp.numberOfPackages != null ? gp.numberOfPackages : '—' },
    { label:'Weight',  value: gp.grossWeightKg != null ? `${gp.grossWeightKg} kg` : '—' },
    { label:'Seal No.',value: gp.sealNumber || '—' },
  ];

  return (
    <div style={{ maxWidth: 580 }}>
      <div className="no-print page-header">
        <h1 className="page-title" />
        <div className="page-actions">
          <button onClick={() => window.print()} className="btn btn-primary">🖨 Print Label</button>
          <Link to="/gate-pass/new" className="btn btn-ghost">+ New Gate Pass</Link>
          <Link to={`/unloading/${code}`} className="btn btn-ghost">Unloading →</Link>
        </div>
      </div>

      <div className="card">
        {/* Header */}
        <div style={{ textAlign:'center', padding:'0.5rem 0 1.5rem' }}>
          <div style={{ fontSize:'2.2rem', fontWeight:900, letterSpacing:'.05em', color:'var(--primary)', fontFamily:'monospace' }}>
            {gp.gatePassCode}
          </div>
          <div style={{ marginTop:'0.5rem', display:'flex', justifyContent:'center', gap:'0.5rem', alignItems:'center' }}>
            <StatusBadge status={gp.status} />
            <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
              {new Date(gp.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        <hr className="divider" />

        {/* QR + Info two-col */}
        <div style={{ display:'flex', gap:'1.5rem', alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
            <div style={{ border:'4px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'0.6rem', background:'white' }}>
              <QRCodeSVG value={gp.gatePassCode} size={160} />
            </div>
            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontFamily:'monospace' }}>Scan to look up</span>
          </div>

          <div style={{ flex:1, minWidth:200 }}>
            <div className="info-grid" style={{ gridTemplateColumns:'repeat(2,1fr)' }}>
              {infoRows.map(r => r.value !== '—' && (
                <div key={r.label} className="info-item">
                  <div className="info-label">{r.label}</div>
                  <div className="info-value">{r.value}</div>
                </div>
              ))}
            </div>
            {gp.remarks && (
              <div style={{ marginTop:'0.75rem', padding:'0.65rem', background:'var(--surface2)', borderRadius:'var(--radius-sm)', fontSize:'0.82rem', color:'var(--text-2)', borderLeft:'3px solid var(--primary)' }}>
                <span style={{ fontWeight:700, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'.06em', color:'var(--text-muted)' }}>Remarks: </span>
                {gp.remarks}
              </div>
            )}
          </div>
        </div>

        {/* Invoices */}
        {gp.invoices?.length > 0 && (
          <>
            <hr className="divider" />
            <div className="card-title">Invoices ({gp.invoices.length})</div>
            {gp.invoices.map(inv => (
              <div key={inv._id} style={{ padding:'0.65rem 0.85rem', background:'var(--surface2)', borderRadius:'var(--radius-sm)', marginBottom:'0.4rem', fontSize:'0.85rem', display:'flex', justifyContent:'space-between' }}>
                <span><strong>{inv.supplierName}</strong> · {inv.invoiceNumber}</span>
                <span style={{ color:'var(--text-muted)' }}>{inv.items?.length || 0} items</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
