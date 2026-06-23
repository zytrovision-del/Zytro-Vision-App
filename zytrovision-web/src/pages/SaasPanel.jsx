import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Shield, TrendingUp, Users, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import '../index.css';

export default function SaasPanel() {
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ mrr: 0, activas: 0, total: 0 });

  useEffect(() => {
    cargarSuscripciones();
  }, []);

  const cargarSuscripciones = async () => {
    try {
      setLoading(true);
      // Query global para superadmin: obtener todas las suscripciones y la info del usuario/óptica asociado
      // Nota: asume que 'usuarios' tiene una relación con 'suscripciones' a través de empresa_id
      const { data, error } = await supabase
        .from('suscripciones')
        .select(`
          *,
          usuarios!inner(nombre, username)
        `);

      if (error) throw error;
      
      const subs = data || [];
      setSuscripciones(subs);
      
      // Calcular métricas
      const activas = subs.filter(s => s.estado_pago === 'Activo').length;
      const pruebas = subs.filter(s => s.estado_pago === 'Prueba').length;
      setStats({
        mrr: activas * 50, // $50 por suscripción activa
        activas,
        pruebas,
        total: subs.length
      });

    } catch (error) {
      console.error('Error cargando suscripciones globales:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renovarSuscripcion = async (id, dias = 30) => {
    try {
      const nuevaFecha = new Date();
      nuevaFecha.setDate(nuevaFecha.getDate() + dias);
      
      const { error } = await supabase
        .from('suscripciones')
        .update({ 
          estado_pago: 'Activo', 
          fecha_vencimiento: nuevaFecha.toISOString().split('T')[0],
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      cargarSuscripciones();
    } catch (err) {
      alert("Error al renovar: " + err.message);
    }
  };

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Cargando Panel Maestro...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <Shield size={36} color="#fbbf24" />
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '5px' }}>Centro de Mando SaaS</h1>
          <p style={{ color: 'var(--text-muted)' }}>Panel exclusivo de súper administración. Monitoreo global de inquilinos y finanzas.</p>
        </div>
      </div>

      {/* MÉTRICAS FINANCIERAS (MRR) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '24px', borderTop: '2px solid #fbbf24' }}>
          <h4 style={{ color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#fbbf24" /> MRR (Ingreso Mensual Recurrente)
          </h4>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fbbf24' }}>${stats.mrr.toFixed(2)}</p>
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#34d399" /> Clínicas Activas
          </h4>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#34d399' }}>{stats.activas}</p>
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#60a5fa" /> En Prueba (15 Días)
          </h4>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#60a5fa' }}>{stats.pruebas}</p>
        </div>
      </div>

      {/* TABLA DE INQUILINOS */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h3 style={{ marginBottom: '20px', color: 'white' }}>Gestión de Inquilinos (Tenants)</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '15px 10px', color: 'var(--text-muted)' }}>Empresa / Administrador</th>
                <th style={{ padding: '15px 10px', color: 'var(--text-muted)' }}>Usuario (Email)</th>
                <th style={{ padding: '15px 10px', color: 'var(--text-muted)' }}>Estado</th>
                <th style={{ padding: '15px 10px', color: 'var(--text-muted)' }}>Vencimiento</th>
                <th style={{ padding: '15px 10px', color: 'var(--text-muted)', textAlign: 'right' }}>Acciones Maestras</th>
              </tr>
            </thead>
            <tbody>
              {suscripciones.map((sub) => {
                const isActivo = sub.estado_pago === 'Activo';
                const isPrueba = sub.estado_pago === 'Prueba';
                
                return (
                  <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '15px 10px', color: 'white', fontWeight: 500 }}>
                      {sub.usuarios[0]?.nombre || 'Sin Nombre'}
                    </td>
                    <td style={{ padding: '15px 10px', color: 'var(--text-dim)' }}>
                      {sub.usuarios[0]?.username || 'N/A'}
                    </td>
                    <td style={{ padding: '15px 10px' }}>
                      {isActivo ? (
                        <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Activo
                        </span>
                      ) : isPrueba ? (
                        <span style={{ backgroundColor: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={14} /> Prueba
                        </span>
                      ) : (
                        <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={14} /> Vencido
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '15px 10px', color: 'var(--text-dim)' }}>
                      {sub.fecha_vencimiento}
                    </td>
                    <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                      <button 
                        onClick={() => renovarSuscripcion(sub.id)}
                        style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)' }}
                        onMouseOut={(e) => { e.target.style.background = 'transparent' }}
                      >
                        Forzar +30 Días
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {suscripciones.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay inquilinos registrados en la base de datos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
