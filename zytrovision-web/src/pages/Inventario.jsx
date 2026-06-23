import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Package, Plus, Search, Edit2, Trash2, Tag, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import '../index.css';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    categoria: 'Monturas',
    marca: '',
    stock: 0,
    precio_compra: 0,
    precio_venta: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Usuario actual
  const user = JSON.parse(localStorage.getItem('zytro_user') || '{}');

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (err) {
      console.error('Error cargando inventario:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarProducto = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Calculate maxId safely avoiding NaN
      const maxId = inventario.length > 0 
        ? Math.max(...inventario.map(i => {
            const parsed = parseInt(i.id);
            return isNaN(parsed) ? 0 : parsed;
          })) 
        : 0;

      const payload = {
        ...formData,
        id: formData.id ? formData.id : String(maxId + 1)
      };
      
      const { error } = await supabase.from('inventario').upsert(payload);
      if (error) throw error;
      
      setShowModal(false);
      setFormData({ codigo: '', descripcion: '', categoria: 'Monturas', marca: '', stock: 0, precio_compra: 0, precio_venta: 0 });
      cargarInventario();
    } catch (err) {
      alert("Error al guardar producto: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto del stock?")) return;
    try {
      const { error } = await supabase.from('inventario').delete().eq('id', id);
      if (error) throw error;
      cargarInventario();
    } catch (err) {
      alert("Error eliminando: " + err.message);
    }
  };

  const productosFiltrados = productos.filter(p => 
    (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.marca || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Package size={32} color="#a855f7" />
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '5px' }}>Inventario Óptico</h1>
            <p style={{ color: 'var(--text-muted)' }}>Control de stock de monturas, lunas y accesorios.</p>
          </div>
        </div>
        
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#a855f7' }}>
          <Plus size={18} /> Añadir Producto
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Search color="var(--text-dim)" size={20} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar por código, descripción o marca..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ margin: 0 }}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando stock...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Código</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Descripción y Marca</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Categoría</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'right' }}>Precio</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' }}>Stock</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 500 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map(prod => (
                  <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 20px', color: 'var(--text-dim)' }}>
                      <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {prod.codigo || `INV-${prod.id}`}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'white', fontWeight: 500 }}>
                      {prod.descripcion} <br/>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 400 }}>{prod.marca || 'Sin marca'}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                        <Tag size={12} /> {prod.categoria}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#34d399', fontWeight: 600, textAlign: 'right' }}>
                      ${parseFloat(prod.precio_venta || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      {prod.stock > 0 ? (
                        <span style={{ color: 'white', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowUpCircle size={14} color="#34d399" /> {prod.stock}
                        </span>
                      ) : (
                        <span style={{ color: '#f87171', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowDownCircle size={14} color="#f87171" /> 0
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', display: 'flex', gap: '10px' }}>
                      <button style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer' }} title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => eliminarProducto(prod.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }} title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {productosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      No se encontraron productos en el inventario.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Producto */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Registrar Producto</h2>
            <form onSubmit={handleGuardarProducto}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Código SKU</label>
                  <input className="input-field" required value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} placeholder="Ej. LUN-001" />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Categoría</label>
                  <select className="input-field" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                    <option value="Monturas">Monturas</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Lentes de Contacto">Lentes de Contacto</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Descripción</label>
                <input className="input-field" required value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="Ej. Montura de acetato negra" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Marca</label>
                  <input className="input-field" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Stock</label>
                  <input type="number" min="0" className="input-field" required value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Costo Compra</label>
                  <input type="number" step="0.01" min="0" className="input-field" required value={formData.precio_compra} onChange={e => setFormData({...formData, precio_compra: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Precio Venta</label>
                  <input type="number" step="0.01" min="0" className="input-field" required value={formData.precio_venta} onChange={e => setFormData({...formData, precio_venta: parseFloat(e.target.value)})} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, backgroundColor: '#a855f7', border: 'none' }}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
