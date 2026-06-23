import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import '../index.css';

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    identificacion: '',
    nombres: '',
    apellidos: '',
    genero: 'Masculino',
    fecha_nacimiento: '',
    telefono: '',
    correo: '',
    direccion: '',
    ocupacion: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Usuario actual
  const user = JSON.parse(localStorage.getItem('zytro_user') || '{}');

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setPacientes(data || []);
    } catch (err) {
      console.error('Error cargando pacientes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarPaciente = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      
      // Calculate age from fecha_nacimiento
      let edadStr = '';
      if (formData.fecha_nacimiento) {
        const diffMs = Date.now() - new Date(formData.fecha_nacimiento).getTime();
        const ageDt = new Date(diffMs);
        edadStr = Math.abs(ageDt.getUTCFullYear() - 1970).toString();
      }

      // Calculate maxId safely avoiding NaN
      const maxId = pacientes.length > 0 
        ? Math.max(...pacientes.map(p => {
            const parsed = parseInt(p.id);
            return isNaN(parsed) ? 0 : parsed;
          })) 
        : 0;

      const payload = {
        ...formData,
        id: formData.id ? formData.id : String(maxId + 1),
        nombre: formData.nombres + ' ' + formData.apellidos,
        edad: edadStr
      };
      
      const { error } = await supabase.from('pacientes').upsert(payload);
      if (error) throw error;
      
      setShowModal(false);
      setFormData({ identificacion: '', nombres: '', apellidos: '', genero: 'Masculino', fecha_nacimiento: '', telefono: '', correo: '', direccion: '', ocupacion: '' });
      cargarPacientes();
    } catch (err) {
      alert("Error al guardar paciente: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarPaciente = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este paciente?")) return;
    try {
      const { error } = await supabase.from('pacientes').delete().eq('id', id);
      if (error) throw error;
      cargarPacientes();
    } catch (err) {
      alert("Error eliminando: " + err.message);
    }
  };

  const pacientesFiltrados = pacientes.filter(p => 
    (p.nombres + ' ' + p.apellidos).toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.identificacion || '').includes(busqueda)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Users size={32} color="var(--accent-blue)" />
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '5px' }}>Directorio de Pacientes</h1>
            <p style={{ color: 'var(--text-muted)' }}>Gestiona historias clínicas, recetas e información de contacto.</p>
          </div>
        </div>
        
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Nuevo Paciente
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Search color="var(--text-dim)" size={20} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar por nombre o cédula..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ margin: 0 }}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando registros...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Identificación</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Nombres y Apellidos</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Teléfono</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.map(pac => (
                  <tr key={pac.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 20px', color: 'var(--text-dim)' }}>{pac.id}</td>
                    <td style={{ padding: '16px 20px', color: 'white' }}>{pac.identificacion || '-'}</td>
                    <td style={{ padding: '16px 20px', color: 'white', fontWeight: 500 }}>{pac.nombres} {pac.apellidos}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-dim)' }}>{pac.telefono || '-'}</td>
                    <td style={{ padding: '16px 20px', display: 'flex', gap: '10px' }}>
                      <button style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer' }} title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => eliminarPaciente(pac.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }} title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {pacientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      No se encontraron pacientes para tu óptica.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Paciente */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Registrar Paciente</h2>
            <form onSubmit={handleGuardarPaciente}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Cédula / ID</label>
                <input className="input-field" required value={formData.identificacion} onChange={e => setFormData({...formData, identificacion: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Nombres</label>
                  <input className="input-field" required value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Apellidos</label>
                  <input className="input-field" required value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Género</label>
                  <select className="input-field" value={formData.genero} onChange={e => setFormData({...formData, genero: e.target.value})}>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Fecha de Nacimiento</label>
                  <input type="date" className="input-field" value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Teléfono</label>
                  <input className="input-field" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Correo</label>
                  <input type="email" className="input-field" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Dirección</label>
                  <input className="input-field" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Ocupación</label>
                  <input className="input-field" value={formData.ocupacion} onChange={e => setFormData({...formData, ocupacion: e.target.value})} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1 }}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
