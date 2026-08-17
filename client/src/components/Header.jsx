import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const PAGE_META = {
  '/':              { title: 'Dashboard',      sub: 'Live gate pass overview' },
  '/gate-pass/new': { title: 'New Gate Pass',  sub: 'Register an incoming vehicle' },
  '/unloading':     { title: 'Unloading',      sub: 'Manage vehicle unloading' },
  '/qc':            { title: 'QC Inspection',  sub: 'Quality control & item routing' },
  '/checkout':      { title: 'Checkout',       sub: 'Final status & gate exit' },
  '/employees':     { title: 'Employees',      sub: 'Manage team access' },
};

function getMeta(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  if (pathname.includes('/label'))      return { title: 'Gate Pass Label', sub: 'Printable pass & QR code' };
  if (pathname.includes('/unloading/')) return { title: 'Unloading',       sub: 'Manage vehicle unloading' };
  if (pathname.includes('/qc/'))        return { title: 'QC Inspection',   sub: 'Quality control & item routing' };
  if (pathname.includes('/checkout/'))  return { title: 'Checkout',        sub: 'Final status & gate exit' };
  return { title: 'Gate Pass', sub: '' };
}

const SunIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const MoonIcon = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const MenuIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const LogoutIcon = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const meta = getMeta(location.pathname);

  const handleLogout = async () => {
    await logout();
    showToast('You have been signed out.', 'info', 'Signed Out');
    navigate('/login');
  };

  return (
    <header className="header">
      <button className="btn-icon hamburger" onClick={onMenuClick}><MenuIcon /></button>
      <div className="header-breadcrumb">
        <div className="header-page-title">{meta.title}</div>
        {meta.sub && <div className="header-page-sub">{meta.sub}</div>}
      </div>
      <div className="header-actions">
        {user && <span className="role-badge">{user.role}</span>}
        <button className="btn-icon" onClick={toggle} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          <LogoutIcon /> Logout
        </button>
      </div>
    </header>
  );
}
