import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const icons = {
  dashboard: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  plus:      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  truck:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  qc:        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  checkout:  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  users:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  logo:      <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M1 3h15v13H1z" opacity=".9"/><polygon points="16 8 20 8 23 11 23 16 16 16" opacity=".7"/><circle cx="5.5" cy="19.5" r="2" fill="white"/><circle cx="18.5" cy="19.5" r="2" fill="white"/></svg>,
  collapse:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  expand:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>,
};

const NAV = [
  { to: '/',              label: 'Dashboard',     icon: icons.dashboard, end: true },
  { to: '/gate-pass/new', label: 'New Gate Pass',  icon: icons.plus },
  { to: '/unloading',     label: 'Unloading',     icon: icons.truck },
  { to: '/qc',            label: 'QC Inspection', icon: icons.qc },
  { to: '/checkout',      label: 'Checkout',      icon: icons.checkout },
];

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }) {
  const { user } = useAuth();
  const links = user?.role === 'admin' ? [...NAV, { to: '/employees', label: 'Employees', icon: icons.users }] : NAV;
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <>
      {open && <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:99,background:'rgba(0,0,0,.4)' }} />}
      <aside className={`sidebar${open ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ flexShrink:0 }}>{icons.logo}</div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <div className="sidebar-logo-title">GatePass</div>
              <div className="sidebar-logo-sub">Warehouse System</div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {!collapsed && <div className="sidebar-section-label">Navigation</div>}
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}${collapsed ? ' nav-item-icon-only' : ''}`}
              onClick={onClose}
              title={collapsed ? link.label : undefined}
            >
              <span className="nav-item-icon" style={{ flexShrink:0 }}>{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer: avatar + collapse toggle */}
        <div className="sidebar-footer" style={{ flexDirection: collapsed ? 'column' : 'row', gap: collapsed ? '0.5rem' : '0.6rem' }}>
          {!collapsed && (
            <div className="sidebar-footer-avatar" style={{ flexShrink:0 }}>{initials}</div>
          )}
          {!collapsed && (
            <div className="sidebar-footer-info">
              <div className="sidebar-footer-name">{user?.name}</div>
              <div className="sidebar-footer-role">{user?.role}</div>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background:'rgba(255,255,255,.07)',
              border:'1px solid var(--sb-border)',
              borderRadius:'var(--radius-sm)',
              color:'var(--sb-text)',
              cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:'0.35rem',
              flexShrink: 0,
              transition:'background 150ms',
              marginLeft: collapsed ? 0 : 'auto',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.12)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.07)'}
          >
            {collapsed ? icons.expand : icons.collapse}
          </button>
        </div>
      </aside>
    </>
  );
}
