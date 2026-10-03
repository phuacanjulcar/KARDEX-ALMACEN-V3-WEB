import React, { useState } from 'react';
import { apiService } from '../../services/api';

function ProductsTab({ products, categories, zones, onSuccess }) {
  const [editProductId, setEditProductId] = useState(null);
  const [pName, setPName] = useState('');
  const [pUnit, setPUnit] = useState('Unidades (Und)');
  const [pPrefix, setPPrefix] = useState('PAQ');
  const [pMin, setPMin] = useState('10');
  const [pMax, setPMax] = useState('100');
  const [pCat, setPCat] = useState('');
  const [pZone, setPZone] = useState('');
  const [attProduct, setAttProduct] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setAttProduct(true);
    if (!pName || !pCat || !pZone || !pUnit || !pPrefix || !pMin || !pMax) return;
    setIsProcessing(true);
    try {
      const data = {
        name: pName, unit: pUnit, prefix: pPrefix, 
        min_stock: parseFloat(pMin), max_stock: parseFloat(pMax),
        category_id: parseInt(pCat), zone_id: parseInt(pZone)
      };
      
      if (editProductId) {
        await apiService.updateProduct(editProductId, data);
        alert('Producto actualizado ✅');
      } else {
        await apiService.createProduct(data);
        alert('Producto creado ✅');
      }
      setPName(''); setEditProductId(null); setAttProduct(false); onSuccess();
    } catch (err) {
      alert("Error al guardar producto: " + err);
    } finally {
      setIsProcessing(false);
    }
  };

  const startEditProduct = (p) => {
    setEditProductId(p.id);
    setPName(p.name);
    setPCat(p.category_id || '');
    setPZone(p.zone_id || '');
    setPUnit(p.unit);
    setPPrefix(p.prefix || 'PAQ');
    setPMin(p.min_stock || 10);
    setPMax(p.max_stock || 100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este producto? Se eliminará de la base de datos.")) return;
    setIsProcessing(true);
    try {
      await apiService.deleteProduct(id);
      alert("Producto eliminado.");
      onSuccess();
    } catch (err) {
      alert("Error al eliminar producto: " + err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>
        {editProductId ? '✏️ Editar Producto' : '📦 Crear Nuevo Producto'}
      </h3>
      <form onSubmit={handleSaveProduct} className="form-grid">
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nombre del Producto</label>
          <input type="text" className="input-premium" value={pName} onChange={(e) => {
            let val = e.target.value.toUpperCase();
            val = val.replace(/\s+/g, '_');
            setPName(val);
          }} />
          {attProduct && !pName && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Categoría</label>
          <select className="input-premium" value={pCat} onChange={(e) => setPCat(e.target.value)}>
            <option value="">-- Seleccione Categoría --</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {attProduct && !pCat && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Zona/Ubicación</label>
          <select className="input-premium" value={pZone} onChange={(e) => setPZone(e.target.value)}>
            <option value="">-- Seleccione Zona --</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          {attProduct && !pZone && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Unidad de Medida</label>
          <select className="input-premium" value={pUnit} onChange={(e) => setPUnit(e.target.value)}>
            <option value="Kilogramos (Kg)">Kilogramos (Kg)</option>
            <option value="Gramos (g)">Gramos (g)</option>
            <option value="Litros (L)">Litros (L)</option>
            <option value="Unidades (Und)">Unidades (Und)</option>
            <option value="Cajas">Cajas</option>
            <option value="Sacos">Sacos</option>
          </select>
          {attProduct && !pUnit && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Prefijo Lote</label>
          <input type="text" className="input-premium" value={pPrefix} onChange={(e) => setPPrefix(e.target.value)} />
          {attProduct && !pPrefix && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Stock Mínimo</label>
          <input type="number" className="input-premium" value={pMin} onChange={(e) => setPMin(e.target.value)} />
          {attProduct && !pMin && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Stock Máximo</label>
          <input type="number" className="input-premium" value={pMax} onChange={(e) => setPMax(e.target.value)} />
          {attProduct && !pMax && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>
        <div style={{ gridColumn: 'span 2', marginTop: '16px', display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn-primary" disabled={isProcessing} style={{ flex: 1 }}>
            {editProductId ? '💾 Actualizar Producto' : '➕ Crear Producto'}
          </button>
          {editProductId && (
            <button type="button" className="btn-primary" style={{ background: 'var(--text-muted)', flex: 1 }} onClick={() => {
              setEditProductId(null);
              setPName('');
            }}>
              ❌ Cancelar Edición
            </button>
          )}
        </div>
      </form>

      <h4 style={{ marginTop: '40px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Inventario Maestro</h4>
      <div className="table-container" style={{ maxHeight: '400px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-main)' }}>
            <tr style={{ background: 'rgba(0,0,0,0.05)', textAlign: 'left' }}>
              <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Producto</th>
              <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Unidad</th>
              <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Zona</th>
              <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.name}</td>
                <td style={{ padding: '12px' }}>{p.unit}</td>
                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.zone_name || 'Sin Asignar'}</td>
                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => startEditProduct(p)} style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Editar</button>
                  <button onClick={() => handleDeleteProduct(p.id)} style={{ padding: '6px 12px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductsTab;
