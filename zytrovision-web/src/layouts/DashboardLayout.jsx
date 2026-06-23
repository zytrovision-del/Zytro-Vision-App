import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../index.css';

export default function DashboardLayout() {
  // En un entorno real, verificaríamos el usuario autenticado aquí
  // Si no está logueado, redirigir a /auth
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-pure)' }}>
      {/* Sidebar a la izquierda */}
      <Sidebar />
      
      {/* Contenido Principal a la derecha */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
