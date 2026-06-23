import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';

function App() {
  return (
    <Router>
      <Routes>
        {/* Portal Principal y Registro */}
        <Route path="/auth" element={<Auth />} />
        
        {/* Rutas Protegidas del Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          {/* Aquí irán las rutas futuras como pacientes, citas, saas, etc. */}
          <Route path="pacientes" element={<div style={{color:'white'}}>Módulo de Pacientes en construcción...</div>} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
