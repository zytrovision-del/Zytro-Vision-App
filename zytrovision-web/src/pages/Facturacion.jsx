import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Receipt, FileText, CheckCircle, Search, DollarSign } from 'lucide-react';
import '../index.css';

export default function Facturacion() {
  const [activeTab, setActiveTab] = useState('emitir'); // emitir, historial
  const [ventas, setVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState('');
  
  const [formData, setFormData] = useState({
    razon_social: '',
    identificacion: '',
    direccion: '',
    telefono: '',
    email: '',
    tipo_comprobante: 'Factura',
    establecimiento: '001-001',
    secuencial: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [claveAcceso, setClaveAcceso] = useState('');

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = async () => {
    try {
      const { data, error } = await supabase
        .from('finanzas')
        .select('*')
        .eq('tipo', 'Ingreso')
        .order('fecha', { ascending: false })
        .limit(50);
        
      if (!error && data) {
        setVentas(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVentaSelect = (e) => {
    const val = e.target.value;
    setVentaSeleccionada(val);
    
    if (val) {
      const v = ventas.find(x => String(x.id) === val);
      if (v) {
        // Extraer nombre del concepto si es posible (Ej: Venta Mostrador: Juan Perez - ...)
        let clienteExtracted = "";
        if (v.concepto && v.concepto.includes(':')) {
          clienteExtracted = v.concepto.split(':')[1].split('-')[0].trim();
        }
        
        setFormData(prev => ({
          ...prev,
          razon_social: clienteExtracted || 'Consumidor Final',
          identificacion: clienteExtracted ? '' : '9999999999999'
        }));
      }
    }
  };

  const handleEmitir = (e) => {
    e.preventDefault();
    if (!ventaSeleccionada) {
      alert("Selecciona una venta interna para facturar.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulación de conexión SRI / Firma XML
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      const randomClave = Array.from({length: 49}, () => Math.floor(Math.random() * 10)).join('');
      setClaveAcceso(randomClave);
      
      // Opcional: Podríamos guardar la factura en una tabla 'facturas_sri'
      
    }, 2000);
  };

  const vSeleccionadaObj = ventas.find(x => String(x.id) === ventaSeleccionada);
  const montoFacturar = vSeleccionadaObj ? parseFloat(vSeleccionadaObj.monto).toFixed(2) : "0.00";

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <Receipt size={36} color="#0ea5e9" />
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Facturación Electrónica</h1>
          <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Emisión de comprobantes legales SRI</p>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'emitir' ? 'active' : ''}`} onClick={() => setActiveTab('emitir')}>Emitir Comprobante</button>
        <button className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>Historial de Emisiones</button>
      </div>

      {activeTab === 'emitir' && (
        <>
          {success ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', border: '1px solid #34d399', background: 'rgba(52, 211, 153, 0.05)' }}>
              <CheckCircle size={60} color="#34d399" style={{ margin: '0 auto 20px' }} />
              <h2 style={{ color: 'white', marginBottom: '10px' }}>¡Factura Autorizada por el SRI!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Clave de Acceso: <br/><strong style={{ color: '#60a5fa', wordBreak: 'break-all' }}>{claveAcceso}</strong></p>
              
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button className="btn-secondary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18}/> Descargar RIDE (PDF)</button>
                <button className="btn-secondary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>Descargar XML</button>
              </div>
              
              <button 
                onClick={() => { setSuccess(false); setVentaSeleccionada(''); setClaveAcceso(''); }} 
                className="btn-primary" 
                style={{ marginTop: '30px', width: 'auto', padding: '10px 30px' }}
              >
                Emitir Otra Factura
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmitir}>
              {/* Vinculación */}
              <div className="glass-panel" style={{ padding: '25px', marginBottom: '20px', borderLeft: '4px solid #0ea5e9' }}>
                <h3 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}><DollarSign size={20} color="#0ea5e9"/> Vincular con Venta Interna</h3>
                <select className="input-field" value={ventaSeleccionada} onChange={handleVentaSelect} required>
                  <option value="">-- Seleccionar registro de venta / ingreso --</option>
                  {ventas.map(v => (
                    <option key={v.id} value={v.id}>Venta #{v.id} | {v.fecha.substring(0,10)} | {v.concepto} | ${v.monto}</option>
                  ))}
                </select>
              </div>

              {/* Datos Cliente */}
              <div className="glass-panel" style={{ padding: '25px', marginBottom: '20px' }}>
                <h3 style={{ color: 'white', marginBottom: '20px' }}>Datos del Adquirente</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label className="input-label">Razón Social / Nombres *</label>
                    <input className="input-field" required value={formData.razon_social} onChange={e => setFormData({...formData, razon_social: e.target.value})} />
                  </div>
                  <div>
                    <label className="input-label">RUC / CI / Pasaporte *</label>
                    <input className="input-field" required value={formData.identificacion} onChange={e => setFormData({...formData, identificacion: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label className="input-label">Dirección Fiscal</label>
                    <input className="input-field" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
                  </div>
                  <div>
                    <label className="input-label">Teléfono</label>
                    <input className="input-field" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                  </div>
                  <div>
                    <label className="input-label">Correo (Para PDF/XML)</label>
                    <input className="input-field" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Vista Previa */}
              <div style={{ background: 'white', padding: '30px', borderRadius: '12px', marginBottom: '25px', color: '#0f172a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '15px' }}>
                  <div>
                    <h2 style={{ margin: 0, color: '#1e40af' }}>ZYTRO VISION</h2>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>RUC: 1700000000001<br/>Matriz Principal</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0, color: '#ef4444' }}>FACTURA</h3>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>001-001-{formData.secuencial || '000000001'}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '14px' }}>
                  <div>
                    <strong>CLIENTE:</strong> {formData.razon_social || '---'}<br/>
                    <strong>RUC/CI:</strong> {formData.identificacion || '---'}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>FECHA:</strong> {new Date().toLocaleDateString()}
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Descripción</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>Servicios Optométricos / Lentes</td>
                      <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>${montoFacturar}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px', fontSize: '15px' }}>
                  <div style={{ width: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span>Subtotal:</span> <span>${montoFacturar}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span>IVA 15%:</span> <span>$0.00</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1e40af', paddingTop: '5px', fontWeight: 'bold', fontSize: '18px' }}>
                      <span>TOTAL:</span> <span>${montoFacturar}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
                {isSubmitting ? 'FIRMANDO Y ENVIANDO AL SRI...' : '🚀 EMITIR FACTURA ELECTRÓNICA'}
              </button>

            </form>
          )}
        </>
      )}

      {activeTab === 'historial' && (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <Search size={40} color="var(--text-dim)" style={{ margin: '0 auto 15px' }} />
          <h3 style={{ color: 'white', marginBottom: '10px' }}>Historial de Facturación</h3>
          <p style={{ color: 'var(--text-muted)' }}>No hay comprobantes emitidos recientemente.</p>
        </div>
      )}

    </div>
  );
}
