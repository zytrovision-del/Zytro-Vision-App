import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Beaker, Eye, CheckCircle, Package, Search, Printer, ArrowRight, Download, X } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../index.css';

export default function TrabajosLaboratorio() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Modal Preview PDF
  const [ordenAImprimir, setOrdenAImprimir] = useState(null);
  
  // Usuario actual
  const user = JSON.parse(localStorage.getItem('zytro_user') || '{}');

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .select('*')
        .order('creado_el', { ascending: false });

      if (error) throw error;
      setOrdenes(data || []);
    } catch (err) {
      console.error('Error cargando órdenes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('ordenes_trabajo')
        .update({ estado: nuevoEstado })
        .eq('id', id);
        
      if (error) throw error;
      cargarOrdenes();
    } catch (err) {
      alert("Error actualizando estado: " + err.message);
    }
  };

  const generarPDF = (orden) => {
    const doc = new jsPDF();
    
    // Header
    const logoData = localStorage.getItem('zytro_logo');
    if (logoData) {
      try {
        // Extract the format from the base64 string
        const format = logoData.substring("data:image/".length, logoData.indexOf(";base64"));
        doc.addImage(logoData, format.toUpperCase(), 15, 10, 35, 20, undefined, 'FAST');
      } catch (e) {
        console.error("Error al añadir logo al PDF", e);
      }
    }
    
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Blue
    doc.text(`ZytroVision - Orden de Laboratorio`, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Óptica: ${user.nombre || 'Mi Óptica'}`, 105, 28, { align: 'center' });
    doc.text(`Orden #: ORD-${orden.id}`, 105, 34, { align: 'center' });
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 40, 195, 40);
    
    // Patient Info
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Paciente: ${orden.paciente_nombre}`, 20, 50);
    doc.text(`Fecha: ${new Date(orden.creado_el).toLocaleDateString()}`, 130, 50);
    
    // Table Receta
    const rxOD = typeof orden.receta_od === 'string' ? JSON.parse(orden.receta_od) : orden.receta_od;
    const rxOI = typeof orden.receta_oi === 'string' ? JSON.parse(orden.receta_oi) : orden.receta_oi;
    
    doc.autoTable({
      startY: 60,
      head: [['Ojo', 'Esfera', 'Cilindro', 'Eje', 'Adición', 'A.V.']],
      body: [
        ['DERECHO (OD)', rxOD?.Esf || '-', rxOD?.Cil || '-', rxOD?.Eje || '-', rxOD?.Add || '-', rxOD?.AV || '-'],
        ['IZQUIERDO (OI)', rxOI?.Esf || '-', rxOI?.Cil || '-', rxOI?.Eje || '-', rxOI?.Add || '-', rxOI?.AV || '-'],
      ],
      headStyles: { fillColor: [59, 130, 246] },
      theme: 'grid'
    });
    
    // Specifics
    let finalY = doc.lastAutoTable.finalY || 80;
    
    doc.autoTable({
      startY: finalY + 10,
      head: [['D.I.P.', 'Altura', 'Diseño', 'Material', 'Tratamientos']],
      body: [
        [orden.dip || '-', orden.altura || '-', orden.tipo_lente || '-', orden.material || '-', orden.protecciones || '-']
      ],
      headStyles: { fillColor: [139, 92, 246] },
      theme: 'grid'
    });
    
    finalY = doc.lastAutoTable.finalY;
    
    // Observaciones
    if (orden.observaciones) {
      doc.setFontSize(11);
      doc.text("Observaciones:", 20, finalY + 15);
      doc.setFont('helvetica', 'italic');
      doc.text(orden.observaciones, 20, finalY + 22, { maxWidth: 170 });
    }
    
    // Save
    doc.save(`Orden_${orden.id}_${orden.paciente_nombre}.pdf`);
  };

  const ordenesFiltradas = ordenes.filter(o => 
    (o.paciente_nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    o.id.toString().includes(busqueda)
  );

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Pendiente': return <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>Pendiente</span>;
      case 'En Laboratorio': return <span style={{ backgroundColor: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>En Laboratorio</span>;
      case 'Listo / Recibido': return <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>Recibido</span>;
      case 'Entregado': return <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>Entregado</span>;
      default: return <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{estado}</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Beaker size={32} color="#34d399" />
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '5px' }}>Laboratorio y Trabajos</h1>
            <p style={{ color: 'var(--text-muted)' }}>Seguimiento de órdenes, recetas y entregas a pacientes.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Search color="var(--text-dim)" size={20} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar por nombre de paciente o número de orden..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ margin: 0 }}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando órdenes de laboratorio...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Orden #</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Paciente</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Fecha Creación</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Diseño Lente</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado Actual</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' }}>Flujo de Trabajo</th>
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.map(orden => (
                  <tr key={orden.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 20px', color: '#60a5fa', fontWeight: 600 }}>ORD-{orden.id}</td>
                    <td style={{ padding: '16px 20px', color: 'white', fontWeight: 500 }}>{orden.paciente_nombre}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-dim)' }}>
                      {new Date(orden.creado_el).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-dim)' }}>
                      {orden.tipo_lente} <br/> <span style={{fontSize: '0.8rem'}}>{orden.material}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {getEstadoBadge(orden.estado)}
                    </td>
                    <td style={{ padding: '16px 20px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      
                      <button onClick={() => setOrdenAImprimir(orden)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background='transparent'} title="Vista Previa de Impresión">
                        <Printer size={16} />
                      </button>
                      
                      {orden.estado === 'Pendiente' && (
                        <button onClick={() => cambiarEstado(orden.id, 'En Laboratorio')} style={{ background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.3)', color: '#60a5fa', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          A Laboratorio <ArrowRight size={14} />
                        </button>
                      )}
                      
                      {orden.estado === 'En Laboratorio' && (
                        <button onClick={() => cambiarEstado(orden.id, 'Listo / Recibido')} style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          Recibir en Óptica <CheckCircle size={14} />
                        </button>
                      )}
                      
                      {orden.estado === 'Listo / Recibido' && (
                        <button onClick={() => cambiarEstado(orden.id, 'Entregado')} style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#a855f7', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          Entregar Paciente <Package size={14} />
                        </button>
                      )}

                    </td>
                  </tr>
                ))}
                {ordenesFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      No se encontraron órdenes de laboratorio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Vista Previa Impresión */}
      {ordenAImprimir && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', backgroundColor: '#ffffff', color: '#111827', padding: '0', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            {/* Toolbar */}
            <div style={{ backgroundColor: '#1f2937', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <h3 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Printer size={18} /> Vista Previa de Receta
              </h3>
              <button onClick={() => setOrdenAImprimir(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            {/* Hoja A4 Simulada */}
            <div style={{ padding: '40px', overflowY: 'auto', flex: 1 }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', color: '#1e3a8a', margin: '0 0 5px 0' }}>ORDEN DE TRABAJO LABORATORIO</h1>
                <p style={{ margin: 0, color: '#4b5563', fontSize: '14px' }}>Óptica: {user.nombre || 'Mi Óptica'}</p>
                <p style={{ margin: 0, color: '#4b5563', fontSize: '14px' }}>Orden #: <strong>ORD-{ordenAImprimir.id}</strong></p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Paciente:</strong> {ordenAImprimir.paciente_nombre}</p>
                  <p style={{ margin: 0, fontSize: '14px' }}><strong>Fecha:</strong> {new Date(ordenAImprimir.creado_el).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Estado:</strong> {ordenAImprimir.estado}</p>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '15px' }}>Prescripción Óptica</h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#eff6ff' }}>
                    <th style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'left' }}>Ojo</th>
                    <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Esfera</th>
                    <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Cilindro</th>
                    <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Eje</th>
                    <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>Adición</th>
                    <th style={{ padding: '10px', border: '1px solid #d1d5db' }}>A.V.</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rxOD = typeof ordenAImprimir.receta_od === 'string' ? JSON.parse(ordenAImprimir.receta_od) : ordenAImprimir.receta_od;
                    const rxOI = typeof ordenAImprimir.receta_oi === 'string' ? JSON.parse(ordenAImprimir.receta_oi) : ordenAImprimir.receta_oi;
                    return (
                      <>
                        <tr>
                          <td style={{ padding: '10px', border: '1px solid #d1d5db', fontWeight: 'bold' }}>DERECHO (OD)</td>
                          <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{rxOD?.Esf || '-'}</td>
                          <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{rxOD?.Cil || '-'}</td>
                          <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{rxOD?.Eje || '-'}</td>
                          <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{rxOD?.Add || '-'}</td>
                          <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{rxOD?.AV || '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '10px', border: '1px solid #d1d5db', fontWeight: 'bold' }}>IZQUIERDO (OI)</td>
                          <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{rxOI?.Esf || '-'}</td>
                          <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{rxOI?.Cil || '-'}</td>
                          <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{rxOI?.Eje || '-'}</td>
                          <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{rxOI?.Add || '-'}</td>
                          <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{rxOI?.AV || '-'}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>

              <h3 style={{ fontSize: '16px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '15px' }}>Especificaciones de Lente</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px', fontSize: '14px' }}>
                <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px' }}>Diseño de Lente</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{ordenAImprimir.tipo_lente}</p>
                </div>
                <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px' }}>Material Base</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{ordenAImprimir.material}</p>
                </div>
                <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px' }}>Filtros / Tratamientos</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{ordenAImprimir.protecciones}</p>
                </div>
                <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px' }}>D.I.P.</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{ordenAImprimir.dip || '-'}</p>
                </div>
                <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '12px' }}>Altura Focal</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{ordenAImprimir.altura || '-'}</p>
                </div>
              </div>

              {ordenAImprimir.observaciones && (
                <div>
                  <h3 style={{ fontSize: '16px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '15px' }}>Observaciones</h3>
                  <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '6px', border: '1px solid #fde68a', color: '#92400e', fontSize: '14px' }}>
                    {ordenAImprimir.observaciones}
                  </div>
                </div>
              )}
              
            </div>

            {/* Footer con el botón de DESCARGA PDF */}
            <div style={{ padding: '20px 25px', backgroundColor: '#f3f4f6', borderTop: '1px solid #e5e7eb', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button onClick={() => setOrdenAImprimir(null)} style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                Cerrar
              </button>
              <button onClick={() => generarPDF(ordenAImprimir)} style={{ padding: '10px 20px', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
                <Download size={18} /> Descargar Archivo PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
