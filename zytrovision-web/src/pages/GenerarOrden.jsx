import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { FileText, Save, User, Eye, Layers } from 'lucide-react';
import '../index.css';

export default function GenerarOrden() {
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Formularios de Receta
  const [rxOD, setRxOD] = useState({ Esf: '', Cil: '', Eje: '', Add: '', AV: '' });
  const [rxOI, setRxOI] = useState({ Esf: '', Cil: '', Eje: '', Add: '', AV: '' });
  
  // Parámetros Lente
  const [parametros, setParametros] = useState({
    dip: '', altura: '', tipo_lente: 'Monofocal', material: 'CR-39', protecciones: '', observaciones: ''
  });

  // Usuario actual
  const user = JSON.parse(localStorage.getItem('zytro_user') || '{}');

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nombres, apellidos, identificacion');

      if (error) throw error;
      setPacientes(data || []);
    } catch (err) {
      console.error('Error cargando pacientes:', err.message);
    }
  };

  const handleGuardarOrden = async (e) => {
    e.preventDefault();
    if (!pacienteSeleccionado) {
      alert("Por favor, selecciona un paciente.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const paciente = pacientes.find(p => p.id === pacienteSeleccionado);
      const nombreCompleto = paciente ? `${paciente.nombres} ${paciente.apellidos}` : 'Desconocido';

      const { data: maxOrden } = await supabase.from('ordenes_trabajo').select('id').order('id', { ascending: false }).limit(1);
      const parsedMax = maxOrden && maxOrden.length > 0 ? parseInt(maxOrden[0].id) : 0;
      const maxId = isNaN(parsedMax) ? 0 : parsedMax;

      const payload = {
        id: String(maxId + 1),
        paciente_id: pacienteSeleccionado,
        paciente_nombre: nombreCompleto,
        receta_od: rxOD,
        receta_oi: rxOI,
        dip: parametros.dip,
        altura: parametros.altura,
        tipo_lente: parametros.tipo_lente,
        material: parametros.material,
        protecciones: parametros.protecciones,
        observaciones: parametros.observaciones,
        estado: 'Pendiente',
        creado_por: user.nombre || 'React App',
        creado_el: new Date().toISOString()
      };
      
      const { error } = await supabase.from('ordenes_trabajo').insert(payload);
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Limpiar
      setPacienteSeleccionado('');
      setRxOD({ Esf: '', Cil: '', Eje: '', Add: '', AV: '' });
      setRxOI({ Esf: '', Cil: '', Eje: '', Add: '', AV: '' });
      setParametros({ dip: '', altura: '', tipo_lente: 'Monofocal', material: 'CR-39', protecciones: '', observaciones: '' });
      
    } catch (err) {
      alert("Error al guardar la orden: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRxChange = (ojo, campo, valor) => {
    if (ojo === 'OD') setRxOD(prev => ({ ...prev, [campo]: valor }));
    else setRxOI(prev => ({ ...prev, [campo]: valor }));
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <FileText size={32} color="#60a5fa" />
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '5px' }}>Generar Orden de Trabajo</h1>
          <p style={{ color: 'var(--text-muted)' }}>Registro clínico y especificaciones técnicas para laboratorio.</p>
        </div>
      </div>

      {success && (
        <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', border: '1px solid #34d399', color: '#34d399', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          ¡Orden de trabajo guardada y enviada a laboratorio exitosamente!
        </div>
      )}

      <form onSubmit={handleGuardarOrden}>
        <div className="glass-panel" style={{ padding: '30px', marginBottom: '20px' }}>
          <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="#60a5fa" /> Selección de Paciente
          </h3>
          <select 
            className="input-field" 
            required 
            value={pacienteSeleccionado} 
            onChange={(e) => setPacienteSeleccionado(e.target.value)}
          >
            <option value="">-- Buscar y seleccionar paciente --</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>{p.identificacion} - {p.nombres} {p.apellidos}</option>
            ))}
          </select>
        </div>

        <div className="glass-panel" style={{ padding: '30px', marginBottom: '20px' }}>
          <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Eye size={20} color="#34d399" /> Cuadro de Medidas Visuales
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* OJO DERECHO */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
              <h4 style={{ color: '#fbbf24', textAlign: 'center', marginBottom: '15px' }}>OJO DERECHO (OD)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={{color:'var(--text-dim)', fontSize:'0.85rem'}}>Esfera</label><input className="input-field" value={rxOD.Esf} onChange={e => handleRxChange('OD', 'Esf', e.target.value)} /></div>
                <div><label style={{color:'var(--text-dim)', fontSize:'0.85rem'}}>Cilindro</label><input className="input-field" value={rxOD.Cil} onChange={e => handleRxChange('OD', 'Cil', e.target.value)} /></div>
                <div><label style={{color:'var(--text-dim)', fontSize:'0.85rem'}}>Eje</label><input className="input-field" value={rxOD.Eje} onChange={e => handleRxChange('OD', 'Eje', e.target.value)} /></div>
                <div><label style={{color:'var(--text-dim)', fontSize:'0.85rem'}}>Adición</label><input className="input-field" value={rxOD.Add} onChange={e => handleRxChange('OD', 'Add', e.target.value)} /></div>
              </div>
            </div>

            {/* OJO IZQUIERDO */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
              <h4 style={{ color: '#60a5fa', textAlign: 'center', marginBottom: '15px' }}>OJO IZQUIERDO (OI)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={{color:'var(--text-dim)', fontSize:'0.85rem'}}>Esfera</label><input className="input-field" value={rxOI.Esf} onChange={e => handleRxChange('OI', 'Esf', e.target.value)} /></div>
                <div><label style={{color:'var(--text-dim)', fontSize:'0.85rem'}}>Cilindro</label><input className="input-field" value={rxOI.Cil} onChange={e => handleRxChange('OI', 'Cil', e.target.value)} /></div>
                <div><label style={{color:'var(--text-dim)', fontSize:'0.85rem'}}>Eje</label><input className="input-field" value={rxOI.Eje} onChange={e => handleRxChange('OI', 'Eje', e.target.value)} /></div>
                <div><label style={{color:'var(--text-dim)', fontSize:'0.85rem'}}>Adición</label><input className="input-field" value={rxOI.Add} onChange={e => handleRxChange('OI', 'Add', e.target.value)} /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
          <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={20} color="#a855f7" /> Especificaciones del Lente
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>D.I.P.</label>
              <input className="input-field" value={parametros.dip} onChange={e => setParametros({...parametros, dip: e.target.value})} placeholder="Ej. 62/64" />
            </div>
            <div>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Altura Focal</label>
              <input className="input-field" value={parametros.altura} onChange={e => setParametros({...parametros, altura: e.target.value})} />
            </div>
            <div>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Diseño de Lente</label>
              <select className="input-field" value={parametros.tipo_lente} onChange={e => setParametros({...parametros, tipo_lente: e.target.value})}>
                <option value="Monofocal">Monofocal</option>
                <option value="Bifocal">Bifocal Flat Top</option>
                <option value="Progresivo">Progresivo (Multifocal)</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Material Base</label>
              <input className="input-field" value={parametros.material} onChange={e => setParametros({...parametros, material: e.target.value})} placeholder="CR-39, Policarbonato..." />
            </div>
            <div>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Filtros / Tratamientos</label>
              <input className="input-field" value={parametros.protecciones} onChange={e => setParametros({...parametros, protecciones: e.target.value})} placeholder="Antirreflejo, Filtro Azul..." />
            </div>
          </div>

          <div>
            <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Instrucciones Especiales / Observaciones</label>
            <textarea className="input-field" rows="3" value={parametros.observaciones} onChange={e => setParametros({...parametros, observaciones: e.target.value})} placeholder="Ej. Lentes para armazón ranurado..."></textarea>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Save size={20} /> {isSubmitting ? 'GUARDANDO ORDEN...' : 'GUARDAR Y ENVIAR A LABORATORIO'}
        </button>

      </form>
    </div>
  );
}
