import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/'); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex',
      background:'linear-gradient(135deg, #0f172a 0%, #1e2a4a 50%, #0f172a 100%)',
    }}>
      {/* Left brand panel */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'3rem', color:'white',
        display: window.innerWidth < 768 ? 'none' : 'flex'
      }}>
        <div style={{ maxWidth:420 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'2.5rem' }}>
            <div style={{ width:44, height:44, background:'#4f63d2', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(79,99,210,.5)' }}>
              <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M1 3h15v13H1z" opacity=".9"/><polygon points="16 8 20 8 23 11 23 16 16 16" opacity=".7"/><circle cx="5.5" cy="19.5" r="2" fill="white"/><circle cx="18.5" cy="19.5" r="2" fill="white"/></svg>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:'1.2rem' }}>GatePass System</div>
              <div style={{ fontSize:'0.72rem', opacity:.6, textTransform:'uppercase', letterSpacing:'.08em' }}>Warehouse Management</div>
            </div>
          </div>
          <h1 style={{ fontSize:'2.2rem', fontWeight:800, lineHeight:1.2, marginBottom:'1rem' }}>
            Manage your<br/>warehouse gate<br/>with confidence.
          </h1>
          <p style={{ opacity:.6, fontSize:'0.95rem', lineHeight:1.7 }}>
            Track incoming vehicles, manage unloading, QC inspections, and checkout — all in one place.
          </p>
          <div style={{ marginTop:'2rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {['Real-time dashboard with live updates', 'Complete invoice & item tracking', 'QC routing with full audit trail'].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:'0.6rem', opacity:.75, fontSize:'0.875rem' }}>
                <span style={{ color:'#4ade80', fontWeight:700 }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div style={{ width:'100%', maxWidth:420, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', background:'var(--bg)' }}>
        <div style={{ width:'100%' }}>
          <div style={{ marginBottom:'2rem' }}>
            <h2 style={{ fontSize:'1.6rem', fontWeight:'800', marginBottom:'0.4rem' }}>Welcome back</h2>
            <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address <span>*</span></label>
              <input
                type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@example.com" required autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password <span>*</span></label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••" required
                  style={{ paddingRight:'2.75rem' }}
                />
                <button
                  type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', fontSize:'0.8rem', cursor:'pointer' }}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%', marginTop:'0.5rem' }} disabled={loading}>
              {loading ? <><span className="spinner" style={{width:'1rem',height:'1rem'}} />Signing in...</> : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.78rem', color:'var(--text-muted)' }}>
            Access is granted by your administrator only.
          </p>
        </div>
      </div>
    </div>
  );
}
