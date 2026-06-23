import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import '../index.css';

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Usuario actual
  const user = JSON.parse(localStorage.getItem('zytro_user') || '{}');

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    if (!user.empresa_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('id', { ascending: false });

      if (error) throw error;
      setPacientes(data || []);
    } catch (err) {
      console.error('Error cargando pacientes:', err.message);
    } finally {
      setLoading(false);
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
        
        <button className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      <button style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }} title="Eliminar">
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

    </div>
  );
}
