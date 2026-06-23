import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, Plus, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import '../index.css';

export default function Citas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('Pendiente');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '',
    paciente_nombre: '',
    motivo: '',
    telefono: '',
    correo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Usuario actual
  const user = JSON.parse(localStorage.getItem('zytro_user') || '{}');

  useEffect(() => {
    cargarCitas();
  }, [filtroEstado]);

  const cargarCitas = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('citas')
        .select('*')
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });
        
      if (filtroEstado !== 'Todas') {
        query = query.eq('estado', filtroEstado);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setCitas(data || []);
    } catch (err) {
      console.error('Error cargando citas:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarCita = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Calculate maxId safely avoiding NaN
      const maxId = citas.length > 0 
        ? Math.max(...citas.map(c => {
            const parsed = parseInt(c.id);
            return isNaN(parsed) ? 0 : parsed;
          })) 
        : 0;

      const payload = {
        ...formData,
        id: formData.id ? formData.id : String(maxId + 1),
        estado: 'Pendiente',
        optometrista: user.nombre || 'N/A'
      };
      
      const { error } = await supabase.from('citas').upsert(payload);
      if (error) throw error;
      
      setShowModal(false);
      setFormData({ fecha: '', hora: '', paciente_nombre: '', motivo: '', telefono: '', correo: '' });
      cargarCitas();
    } catch (err) {
      alert("Error al agendar cita: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('citas')
        .update({ estado: nuevoEstado })
        .eq('id', id);
        
      if (error) throw error;
      cargarCitas();
    } catch (err) {
      alert("Error actualizando cita: " + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Calendar size={32} color="#f472b6" />
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '5px' }}>Agenda Clínica</h1>
            <p style={{ color: 'var(--text-muted)' }}>Programa y controla los turnos de optometría.</p>
          </div>
        </div>
        
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ec4899' }}>
          <Plus size={18} /> Nueva Cita
        </button>
      </div>

      <div className="tabs-container" style={{ borderBottom: '1px solid var(--border-light)', marginBottom: '30px', paddingBottom: '0' }}>
        {['Pendiente', 'Atendido', 'Cancelado', 'Todas'].map(estado => (
          <button 
            key={estado}
            className={`tab-btn ${filtroEstado === estado ? 'active' : ''}`}
            onClick={() => setFiltroEstado(estado)}
          >
            {estado}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando agenda...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          
          {citas.map(cita => {
            const isPendiente = cita.estado === 'Pendiente';
            const isAtendido = cita.estado === 'Atendido';
            
            return (
              <div key={cita.id} className="feature-card" style={{ padding: '24px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                  {isPendiente && <Clock size={20} color="#fbbf24" />}
                  {isAtendido && <CheckCircle size={20} color="#34d399" />}
                  {cita.estado === 'Cancelado' && <XCircle size={20} color="#f87171" />}
                </div>
                
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} color="var(--text-muted)" /> {cita.paciente_nombre}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>
                  <strong>{cita.fecha}</strong> a las <strong>{cita.hora}</strong>
                </p>
                
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                  <p style={{ color: 'var(--text-dim)', marginBottom: '5px' }}>Motivo:</p>
                  <p style={{ color: 'var(--text-main)' }}>{cita.motivo || 'No especificado'}</p>
                </div>
                
                {isPendiente && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => cambiarEstado(cita.id, 'Atendido')}
                      style={{ flex: 1, padding: '10px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.1)'}
                    >
                      Marcar Atendido
                    </button>
                    <button 
                      onClick={() => cambiarEstado(cita.id, 'Cancelado')}
                      style={{ flex: 1, padding: '10px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', color: '#f87171', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          
          {citas.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px dashed var(--border-light)', borderRadius: '12px' }}>
              <Calendar size={48} color="var(--text-dim)" style={{ marginBottom: '15px' }} />
              <h3 style={{ color: 'white', marginBottom: '10px' }}>No hay citas agendadas</h3>
              <p style={{ color: 'var(--text-muted)' }}>Aún no tienes citas con el estado: {filtroEstado}.</p>
            </div>
          )}
          
        </div>
      )}

      {/* Modal Nueva Cita */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Agendar Nueva Cita</h2>
            <form onSubmit={handleGuardarCita}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Nombre del Paciente</label>
                <input className="input-field" required value={formData.paciente_nombre} onChange={e => setFormData({...formData, paciente_nombre: e.target.value})} placeholder="Ej. Juan Pérez" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Fecha</label>
                  <input type="date" className="input-field" required value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Hora</label>
                  <input type="time" className="input-field" required value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Motivo</label>
                <input className="input-field" required value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} placeholder="Ej. Examen visual, Retiro de lentes..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Teléfono (Opcional)</label>
                  <input className="input-field" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Correo (Opcional)</label>
                  <input type="email" className="input-field" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, backgroundColor: '#ec4899', border: 'none' }}>
                  {isSubmitting ? 'Agendando...' : 'Agendar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
