import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Settings, Image as ImageIcon, CheckCircle, Users, MapPin, User as UserIcon, Plus, Trash2, Edit } from 'lucide-react';
import '../index.css';

export default function ConfiguracionUsuarios() {
  const [activeTab, setActiveTab] = useState('perfil'); // perfil, usuarios, sedes
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Perfil state
  const [userFirma, setUserFirma] = useState(null);
  
  // Usuarios state
  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  
  // Form states
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormData, setUserFormData] = useState({ username: '', password: '', nombre: '', role: 'Optometrista', sucursales_asignadas: ['Matriz'], accesos: ['Pacientes', 'Trabajos', 'Ventas'] });
  
  const [showSucursalForm, setShowSucursalForm] = useState(false);
  const [sucursalFormData, setSucursalFormData] = useState({ nombre: '', ciudad: '', direccion: '', telefono: '' });

  const currentUser = JSON.parse(localStorage.getItem('zytro_user') || '{}');
  const isAdmin = currentUser.role === 'Administrador';

  useEffect(() => {
    const savedLogo = localStorage.getItem('zytro_logo');
    if (savedLogo) {
      setLogoPreview(savedLogo);
    }
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar Sucursales
      const { data: dataSucs } = await supabase.from('sucursales').select('*');
      if (dataSucs) setSucursales(dataSucs);
      
      // Cargar Usuarios
      const { data: dataUsers } = await supabase.from('usuarios').select('*');
      if (dataUsers) setUsuarios(dataUsers);
      
      // Cargar firma personal
      if (currentUser.username && dataUsers) {
        const myUser = dataUsers.find(u => u.username === currentUser.username);
        if (myUser && myUser.firma_base64) {
          setUserFirma(`data:image/png;base64,${myUser.firma_base64}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        localStorage.setItem('zytro_logo', reader.result);
        window.dispatchEvent(new Event('zytro_logo_updated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFirmaUpload = async (e) => {
    const file = e.target.files[0];
    if (file && currentUser.username) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result.replace('data:image/png;base64,', '').replace('data:image/jpeg;base64,', '');
        setUserFirma(reader.result);
        await supabase.from('usuarios').update({ firma_base64: base64String }).eq('username', currentUser.username);
        alert('Firma guardada exitosamente.');
      };
      reader.readAsDataURL(file);
    }
  };

  // --- CRUD USUARIOS ---
  const saveUsuario = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('usuarios').upsert({
        ...userFormData,
      });
      if (error) throw error;
      setShowUserForm(false);
      setUserFormData({ username: '', password: '', nombre: '', role: 'Optometrista', sucursales_asignadas: ['Matriz'], accesos: ['Pacientes'] });
      cargarDatos();
    } catch (err) {
      alert("Error al guardar usuario: " + err.message);
    }
  };

  const eliminarUsuario = async (username) => {
    if(!window.confirm("¿Eliminar usuario?")) return;
    try {
      await supabase.from('usuarios').delete().eq('username', username);
      cargarDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- CRUD SUCURSALES ---
  const saveSucursal = async (e) => {
    e.preventDefault();
    try {
      const maxId = sucursales.length > 0 ? Math.max(...sucursales.map(s => parseInt(s.id) || 0)) : 0;
      const payload = {
        ...sucursalFormData,
        id: sucursalFormData.id ? sucursalFormData.id : String(maxId + 1)
      };
      const { error } = await supabase.from('sucursales').upsert(payload);
      if (error) throw error;
      setShowSucursalForm(false);
      setSucursalFormData({ nombre: '', ciudad: '', direccion: '', telefono: '' });
      cargarDatos();
    } catch (err) {
      alert("Error al guardar sucursal: " + err.message);
    }
  };

  const eliminarSucursal = async (id) => {
    if(!window.confirm("¿Eliminar sucursal?")) return;
    try {
      await supabase.from('sucursales').delete().eq('id', id);
      cargarDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <Settings size={36} color="var(--accent-primary)" />
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Configuración del Sistema</h1>
          <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Administra usuarios, sucursales y preferencias personales.</p>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}>Mi Perfil & Óptica</button>
        {isAdmin && <button className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')}>Gestión de Usuarios</button>}
        {isAdmin && <button className={`tab-btn ${activeTab === 'sedes' ? 'active' : ''}`} onClick={() => setActiveTab('sedes')}>Sucursales y Sedes</button>}
      </div>

      {/* TAB PERFIL Y OPTICA */}
      {activeTab === 'perfil' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Tarjeta de Logo */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ImageIcon size={20} color="#60a5fa" /> Logo de la Óptica
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Este logo aparecerá en el menú y PDFs.</p>
            <div style={{ 
              width: '100%', 
              height: '150px', 
              border: '2px dashed var(--border-light)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.02)',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <ImageIcon size={40} color="var(--text-dim)" />
              )}
            </div>
            <label className="btn-secondary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
              Subir Nuevo Logo
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            </label>
          </div>

          {/* Tarjeta de Firma */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserIcon size={20} color="#34d399" /> Mi Firma Digital
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Aparecerá en tus certificados visuales.</p>
            <div style={{ 
              width: '100%', 
              height: '150px', 
              border: '2px dashed var(--border-light)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.02)',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              {userFirma ? (
                <img src={userFirma} alt="Firma" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ color: 'var(--text-dim)' }}>Sin firma registrada</span>
              )}
            </div>
            <label className="btn-secondary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
              Subir Firma (PNG transparente)
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFirmaUpload} />
            </label>
          </div>
        </div>
      )}

      {/* TAB USUARIOS */}
      {activeTab === 'usuarios' && isAdmin && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={20} color="#a855f7" /> Gestión de Usuarios</h3>
            <button onClick={() => { setUserFormData({ username: '', password: '', nombre: '', role: 'Optometrista', sucursales_asignadas: ['Matriz'], accesos: ['Pacientes'] }); setShowUserForm(true); }} className="btn-primary" style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Nuevo Usuario
            </button>
          </div>

          {showUserForm && (
            <form onSubmit={saveUsuario} style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label className="input-label">Nombre de Usuario (Login)</label>
                  <input className="input-field" required value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} disabled={!!usuarios.find(u => u.username === userFormData.username)} />
                </div>
                <div>
                  <label className="input-label">Contraseña</label>
                  <input className="input-field" type="password" required={!usuarios.find(u => u.username === userFormData.username)} value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} placeholder={usuarios.find(u => u.username === userFormData.username) ? "(Mantener vacía si no cambia)" : ""} />
                </div>
                <div>
                  <label className="input-label">Nombre Completo</label>
                  <input className="input-field" required value={userFormData.nombre} onChange={e => setUserFormData({...userFormData, nombre: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Rol</label>
                  <select className="input-field" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value})}>
                    <option value="Optometrista">Optometrista</option>
                    <option value="Vendedor">Vendedor</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar Usuario</button>
                <button type="button" onClick={() => setShowUserForm(false)} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-light)' }}>Cancelar</button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {usuarios.map(u => (
              <div key={u.username} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div>
                  <h4 style={{ color: 'white', margin: '0 0 5px 0' }}>{u.nombre} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'normal' }}>({u.username})</span></h4>
                  <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', background: u.role === 'Administrador' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(96, 165, 250, 0.2)', color: u.role === 'Administrador' ? '#c084fc' : '#93c5fd' }}>{u.role}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setUserFormData({...u, password: ''}); setShowUserForm(true); }} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer' }}><Edit size={18} /></button>
                  {u.username !== 'admin' && <button onClick={() => eliminarUsuario(u.username)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB SEDES */}
      {activeTab === 'sedes' && isAdmin && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><MapPin size={20} color="#fbbf24" /> Gestión de Sucursales</h3>
            <button onClick={() => { setSucursalFormData({ nombre: '', ciudad: '', direccion: '', telefono: '' }); setShowSucursalForm(true); }} className="btn-primary" style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Nueva Sucursal
            </button>
          </div>

          {showSucursalForm && (
            <form onSubmit={saveSucursal} style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label className="input-label">Nombre de la Sede</label>
                  <input className="input-field" required value={sucursalFormData.nombre} onChange={e => setSucursalFormData({...sucursalFormData, nombre: e.target.value})} placeholder="Ej. Matriz" />
                </div>
                <div>
                  <label className="input-label">Ciudad</label>
                  <input className="input-field" value={sucursalFormData.ciudad} onChange={e => setSucursalFormData({...sucursalFormData, ciudad: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Dirección</label>
                  <input className="input-field" value={sucursalFormData.direccion} onChange={e => setSucursalFormData({...sucursalFormData, direccion: e.target.value})} />
                </div>
                <div>
                  <label className="input-label">Teléfono</label>
                  <input className="input-field" value={sucursalFormData.telefono} onChange={e => setSucursalFormData({...sucursalFormData, telefono: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar Sucursal</button>
                <button type="button" onClick={() => setShowSucursalForm(false)} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-light)' }}>Cancelar</button>
              </div>
            </form>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {sucursales.map(s => (
              <div key={s.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <h4 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.2rem' }}>{s.nombre}</h4>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 5px 0', fontSize: '0.9rem' }}>📍 {s.direccion} - {s.ciudad}</p>
                <p style={{ color: 'var(--text-dim)', margin: '0 0 15px 0', fontSize: '0.85rem' }}>📞 {s.telefono}</p>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setSucursalFormData(s); setShowSucursalForm(true); }} className="btn-primary" style={{ padding: '8px', fontSize: '0.85rem', flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }}>Editar</button>
                  <button onClick={() => eliminarSucursal(s.id)} className="btn-primary" style={{ padding: '8px', fontSize: '0.85rem', flex: 1, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
