import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import SaasPanel from './pages/SaasPanel';
import Pacientes from './pages/Pacientes';
import Citas from './pages/Citas';
import Inventario from './pages/Inventario';
import GenerarOrden from './pages/GenerarOrden';
import TrabajosLaboratorio from './pages/TrabajosLaboratorio';
import CRMAsistente from './pages/CRMAsistente';
import PuntoVenta from './pages/PuntoVenta';
import Contabilidad from './pages/Contabilidad';
import ConfiguracionUsuarios from './pages/ConfiguracionUsuarios';
import Facturacion from './pages/Facturacion';

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
          {/* Módulo de Citas */}
          <Route path="citas" element={<Citas />} />
          {/* Módulo de Inventario */}
          <Route path="inventario" element={<Inventario />} />
          {/* Módulos de Laboratorio y Órdenes */}
          <Route path="generar-orden" element={<GenerarOrden />} />
          <Route path="laboratorio" element={<TrabajosLaboratorio />} />
          {/* Módulo de Inteligencia Artificial (CRM) */}
          <Route path="asistente" element={<CRMAsistente />} />
          {/* Módulos Comerciales y Financieros */}
          <Route path="punto-venta" element={<PuntoVenta />} />
          <Route path="contabilidad" element={<Contabilidad />} />
          <Route path="facturacion" element={<Facturacion />} />
          {/* Configuración */}
          <Route path="configuracion" element={<ConfiguracionUsuarios />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
