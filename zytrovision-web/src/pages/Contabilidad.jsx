import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import '../index.css';

export default function Contabilidad() {
  const [finanzas, setFinanzas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Usuario actual
  const user = JSON.parse(localStorage.getItem('zytro_user') || '{}');

  useEffect(() => {
    cargarFinanzas();
  }, []);

  const cargarFinanzas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('finanzas')
        .select('*')
        .order('fecha', { ascending: false });
        
      // Si la tabla se llama distinto o no existe, no rompemos, solo mostramos vacío
      if (error) {
        console.warn("Tabla finanzas no encontrada o error:", error.message);
        setFinanzas([]);
      } else {
        setFinanzas(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalIngresos = finanzas.filter(f => f.tipo === 'Ingreso').reduce((sum, f) => sum + parseFloat(f.monto || 0), 0);
  const totalEgresos = finanzas.filter(f => f.tipo === 'Egreso').reduce((sum, f) => sum + parseFloat(f.monto || 0), 0);
  const balance = totalIngresos - totalEgresos;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <DollarSign size={36} color="#34d399" />
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Contabilidad y Cierres</h1>
          <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Estado de resultados y registro de transacciones financieras.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Ingresos</span>
            <TrendingUp size={20} color="#34d399" />
          </div>
          <span style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>${totalIngresos.toFixed(2)}</span>
        </div>

        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Egresos</span>
            <TrendingDown size={20} color="#f87171" />
          </div>
          <span style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>${totalEgresos.toFixed(2)}</span>
        </div>

        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '10px', background: balance >= 0 ? 'rgba(52, 211, 153, 0.05)' : 'rgba(248, 113, 113, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Balance Neto</span>
            <DollarSign size={20} color={balance >= 0 ? "#34d399" : "#f87171"} />
          </div>
          <span style={{ color: balance >= 0 ? '#34d399' : '#f87171', fontSize: '2rem', fontWeight: 'bold' }}>${balance.toFixed(2)}</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} /> Historial de Movimientos
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando finanzas...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Fecha</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Concepto</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Método</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {finanzas.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 20px', color: 'var(--text-dim)' }}>
                      {new Date(f.fecha || f.creado_el).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'white' }}>
                      {f.concepto}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-dim)' }}>
                      {f.metodo_pago || '-'}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 'bold', color: f.tipo === 'Ingreso' ? '#34d399' : '#f87171' }}>
                      {f.tipo === 'Ingreso' ? '+' : '-'}${parseFloat(f.monto).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {finanzas.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      No hay transacciones financieras registradas.
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
