import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import SaasPanel from './pages/SaasPanel';
import Pacientes from './pages/Pacientes';

function App() {
  return (
    <Router>
      <Routes>
        {/* Portal Principal y Registro */}
        <Route path="/auth" element={<Auth />} />
        
        {/* Rutas Protegidas del Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="saas" element={<SaasPanel />} />
          {/* Módulo de Pacientes */}
          <Route path="pacientes" element={<Pacientes />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
