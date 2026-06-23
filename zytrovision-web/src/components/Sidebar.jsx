import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Box, LogOut, Shield } from 'lucide-react';
import '../index.css';

export default function Sidebar() {
  const isSuperAdmin = true; // Por ahora lo forzamos a true para mostrar la pestaña SaaS
  
  const navStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
    borderRight: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
    textDecoration: 'none',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ width: '260px', backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Logo Header */}
      <div style={{ padding: '30px 20px', borderBottom: '1px solid var(--border-light)', textAlign: 'center' }}>
        <img src="/logo.png" alt="Logo" style={{ maxHeight: '40px', filter: 'brightness(0) invert(1)', objectFit: 'contain' }} />
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <NavLink to="/dashboard" style={navStyle} end>
          <LayoutDashboard size={20} /> Dashboard Clínico
        </NavLink>
        <NavLink to="/dashboard/pacientes" style={navStyle}>
          <Users size={20} /> Pacientes
        </NavLink>
        <NavLink to="/dashboard/citas" style={navStyle}>
          <Calendar size={20} /> Citas
        </NavLink>
        <NavLink to="/dashboard/inventario" style={navStyle}>
          <Box size={20} /> Inventario
        </NavLink>
        
        {isSuperAdmin && (
          <>
            <div style={{ margin: '20px 0', borderTop: '1px solid var(--border-light)' }}></div>
            <p style={{ padding: '0 20px', fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              Administración Global
            </p>
            <NavLink to="/dashboard/saas" style={navStyle}>
              <Shield size={20} color="#fbbf24" /> <span style={{ color: '#fbbf24' }}>Panel SaaS Maestro</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer / Logout */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)' }}>
        <button 
          onClick={() => window.location.href = '/auth'}
          style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#ff4444'; e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.3)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>

    </div>
  );
}
