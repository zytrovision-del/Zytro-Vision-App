import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Eye, Package, Receipt, Lock, Plus } from 'lucide-react';
import '../index.css';

export default function Auth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [optica, setOptica] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', email);
        
      if (error) throw error;
      
      if (users && users.length > 0 && users[0].password === password) {
        setSuccessMsg('Autenticación exitosa. Cargando entorno...');
        localStorage.setItem('zytro_user', JSON.stringify(users[0]));
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        setErrorMsg('Credenciales inválidas o cuenta inexistente.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const empresaId = crypto.randomUUID();
      
      const newUser = {
        username: email.toLowerCase(),
        password: password,
        nombre: nombre,
        role: 'Administrador',
        cargo: 'Optometrista',
        telefono: telefono,
        empresa_id: empresaId,
        accesos: ["Pacientes", "Generar Orden", "Trabajos", "Ventas", "Inventario", "Contabilidad", "Usuarios", "Configuracion", "Inicio"]
      };

      const { error: userError } = await supabase
        .from('usuarios')
        .insert(newUser);

      if (userError) throw userError;

      const fechaPrueba = new Date();
      fechaPrueba.setDate(fechaPrueba.getDate() + 15);
      
      const { error: subError } = await supabase
        .from('suscripciones')
        .insert({
          empresa_id: empresaId,
          estado_pago: 'Prueba',
          fecha_vencimiento: fechaPrueba.toISOString().split('T')[0],
          fecha_actualizacion: new Date().toISOString()
        });

      if (subError) throw subError;

      setSuccessMsg('Cuenta aprovisionada exitosamente. Bienvenido a ZytroVision.');
      localStorage.setItem('zytro_user', JSON.stringify(newUser));
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err) {
      setErrorMsg(err.message || 'Error al aprovisionar el entorno.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* HEADER MINIMALISTA */}
      <div style={{ textAlign: 'center', marginBottom: '80px', maxWidth: '800px' }}>
        <img 
          src="/logo.png" 
          alt="ZytroVision Logo" 
          style={{ 
            width: '400px', 
            height: '100px', 
            objectFit: 'cover', 
            objectPosition: 'center', 
            filter: 'brightness(0) invert(1)', 
            marginBottom: '24px',
            borderRadius: '8px'
          }} 
        />
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 300, lineHeight: 1.6 }}>
          La plataforma definitiva para la gestión óptica. Precisión, velocidad y control absoluto de tu negocio en la nube.
        </p>
      </div>

      {/* CONTENIDO PRINCIPAL: Layout dividido */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', width: '100%', justifyContent: 'center' }}>
        
        {/* LADO IZQUIERDO: Tarjetas de Características */}
        <div style={{ flex: '1 1 400px', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="feature-card">
            <img src="https://images.unsplash.com/photo-1576091160550-2173ff9e5eb3?auto=format&fit=crop&w=600&q=80" alt="Gestión Médica" className="feature-card-image" />
            <div className="feature-card-content">
              <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Eye size={20} color="#ffffff" /> <span>Gestión Clínica Avanzada</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Historias clínicas electrónicas, control de optometría detallado y agendamiento inteligente.
              </p>
            </div>
          </div>
          <div className="feature-card">
            <img src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80" alt="Óptica" className="feature-card-image" />
            <div className="feature-card-content">
              <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Package size={20} color="#ffffff" /> <span>Inventario Inteligente</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Monitoreo en tiempo real de armazones, lentes de contacto y tracking de órdenes de laboratorio.
              </p>
            </div>
          </div>
          <div className="feature-card">
            <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80" alt="Facturación" className="feature-card-image" />
            <div className="feature-card-content">
              <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Receipt size={20} color="#ffffff" /> <span>Facturación Integrada</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Punto de venta (POS) de alta velocidad, cuadres de caja diarios y exportación contable.
              </p>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: Formulario Glassmorphism */}
        <div style={{ flex: '1 1 400px', maxWidth: '450px' }}>
          <div className="glass-panel" style={{ padding: '40px' }}>
            
            <div className="tabs-container">
              <button 
                className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Ingresar
              </button>
              <button 
                className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Crear Entorno
              </button>
            </div>

            {errorMsg && <div style={{ backgroundColor: 'rgba(255, 50, 50, 0.1)', color: '#ff6b6b', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontSize: '0.9rem', border: '1px solid rgba(255, 50, 50, 0.2)' }}>{errorMsg}</div>}
            {successMsg && <div style={{ backgroundColor: 'rgba(50, 255, 100, 0.1)', color: '#69db7c', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontSize: '0.9rem', border: '1px solid rgba(50, 255, 100, 0.2)' }}>{successMsg}</div>}

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <label className="input-label">Email de Acceso</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@clinica.com" 
                    required 
                  />
                </div>
                <div className="input-group" style={{ marginBottom: '32px' }}>
                  <label className="input-label">Contraseña</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Autenticando...' : 'Iniciar Sesión'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                  Aprovisionamiento instantáneo. 15 días de acceso total gratuito.
                </p>

                <div className="input-group">
                  <label className="input-label">Nombre de la Óptica</label>
                  <input type="text" className="input-field" placeholder="Ej. Óptica Visión Clara" value={optica} onChange={(e)=>setOptica(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Administrador Principal</label>
                  <input type="text" className="input-field" placeholder="Nombre completo" value={nombre} onChange={(e)=>setNombre(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Correo Electrónico</label>
                  <input type="email" className="input-field" placeholder="usuario@clinica.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Contraseña</label>
                  <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                </div>
                <div className="input-group" style={{ marginBottom: '32px' }}>
                  <label className="input-label">Confirmar Contraseña</label>
                  <input type="password" className="input-field" placeholder="••••••••" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required />
                </div>
                
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Aprovisionando Entorno...' : 'Crear Entorno'}
                </button>
              </form>
            )}
          </div>
        </div>
        
      </div>
      
      <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '60px' }}>
        ZytroVision © {new Date().getFullYear()} · Infraestructura de Gestión de Nivel Empresarial
      </p>

    </div>
  );
}
