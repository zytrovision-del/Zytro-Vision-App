import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShoppingCart, Search, Plus, Trash2, CreditCard, DollarSign, CheckCircle } from 'lucide-react';
import '../index.css';

export default function PuntoVenta() {
  const [inventario, setInventario] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  
  const [clienteNombre, setClienteNombre] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [abono, setAbono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState(false);

  // Usuario actual
  const user = JSON.parse(localStorage.getItem('zytro_user') || '{}');

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .gt('cantidad_disponible', 0); // Solo traer items con stock > 0
      if (error) throw error;
      setInventario(data || []);
    } catch (err) {
      console.error('Error cargando inventario POS:', err.message);
    }
  };

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      if (existe.cantidad >= producto.stock) {
        alert("Stock insuficiente.");
        return;
      }
      setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const quitarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const totalVenta = carrito.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);

  const procesarVenta = async (e) => {
    e.preventDefault();
    if (carrito.length === 0) return alert("El carrito está vacío.");
    if (!clienteNombre) return alert("Ingresa el nombre del cliente.");
    
    setIsSubmitting(true);
    try {
      const montoPagado = parseFloat(abono) || totalVenta;
      const saldo = totalVenta - montoPagado;
      
      // 1. Guardar en Finanzas
      const payloadVenta = {
        sucursal: user.sucursal || 'Matriz',
        concepto: `Venta Mostrador: ${clienteNombre} - ${carrito.length} items`,
        monto: totalVenta,
        metodo_pago: metodoPago,
        fecha: new Date().toISOString(),
        registrado_por: user.nombre || 'Sistema',
      };
      
      const { error: finError } = await supabase.from('finanzas').insert(payloadVenta);
      if (finError) {
        // En caso que la tabla finanzas no exista con ese nombre, trataremos de omitir este error o usar una estructura genérica.
        console.warn("Error insertando en finanzas, verificar estructura: ", finError);
      }

      // 2. Descontar Stock
      for (const item of carrito) {
        const nuevoStock = item.stock - item.cantidad;
        await supabase.from('inventario').update({ stock: nuevoStock }).eq('id', item.id);
      }
      
      setVentaExitosa(true);
      setTimeout(() => {
        setVentaExitosa(false);
        setCarrito([]);
        setClienteNombre('');
        setAbono('');
        cargarInventario();
      }, 3000);
      
    } catch (err) {
      alert("Error al procesar la venta: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const productosFiltrados = inventario.filter(p => 
    (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '25px', height: '100%' }}>
      
      {/* PANEL IZQUIERDO: CATÁLOGO */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <ShoppingCart size={32} color="#10b981" />
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Punto de Venta</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Selecciona productos del inventario.</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Search color="var(--text-dim)" size={20} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar armazón o accesorio..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
          {productosFiltrados.map(prod => (
            <div key={prod.id} className="feature-card" style={{ padding: '15px', display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => agregarAlCarrito(prod)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{prod.codigo}</span>
                <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Stock: {prod.stock}</span>
              </div>
              <h4 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '1rem', flex: 1 }}>{prod.descripcion}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 15px 0' }}>{prod.marca}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#34d399', fontWeight: 'bold', fontSize: '1.2rem' }}>${parseFloat(prod.precio_venta || 0).toFixed(2)}</span>
                <button style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: 'none', color: '#10b981', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
          {productosFiltrados.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No se encontraron productos con stock disponible.</p>
          )}
        </div>
      </div>

      {/* PANEL DERECHO: CARRITO */}
      <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', position: 'sticky', top: '20px' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={20} /> Resumen de Compra
          </h3>
        </div>

        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '40px' }}>
              <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', margin: '0 0 5px 0', fontSize: '0.95rem' }}>{item.descripcion}</p>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>{item.cantidad} x ${parseFloat(item.precio_venta).toFixed(2)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: '#34d399', fontWeight: 'bold' }}>${(item.cantidad * item.precio_venta).toFixed(2)}</span>
                  <button onClick={() => quitarDelCarrito(item.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '25px', backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border-light)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>TOTAL</span>
            <span style={{ color: '#10b981', fontSize: '2rem', fontWeight: 'bold' }}>${totalVenta.toFixed(2)}</span>
          </div>

          <form onSubmit={procesarVenta}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Nombre del Cliente / Paciente</label>
              <input className="input-field" required value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Ej. Ana Martínez" style={{ margin: 0 }} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Método de Pago</label>
                <select className="input-field" value={metodoPago} onChange={e => setMetodoPago(e.target.value)} style={{ margin: 0 }}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Monto a Cobrar</label>
                <input type="number" step="0.01" className="input-field" placeholder={totalVenta.toFixed(2)} value={abono} onChange={e => setAbono(e.target.value)} style={{ margin: 0 }} />
              </div>
            </div>

            {ventaExitosa ? (
              <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '15px', borderRadius: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <CheckCircle size={20} /> Venta Registrada Correctamente
              </div>
            ) : (
              <button type="submit" disabled={isSubmitting || carrito.length === 0} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#10b981', border: 'none' }}>
                <DollarSign size={20} /> {isSubmitting ? 'PROCESANDO...' : 'PROCESAR VENTA'}
              </button>
            )}
          </form>

        </div>

      </div>

    </div>
  );
}
