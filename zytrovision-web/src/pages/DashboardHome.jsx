import React from 'react';
import '../index.css';

export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Bienvenido, Clínica Visión</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Aquí tienes el resumen operativo de tu centro óptico de hoy.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px' }}>Pacientes Atendidos</h4>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>12</p>
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px' }}>Ingresos Hoy</h4>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: '#34d399' }}>$450.00</p>
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px' }}>Órdenes en Laboratorio</h4>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: '#fbbf24' }}>5</p>
        </div>
      </div>
    </div>
  );
}
