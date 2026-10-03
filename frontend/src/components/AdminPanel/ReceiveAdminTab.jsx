import React, { useState } from 'react';
import { apiService } from '../../services/api';

function ReceiveAdminTab({ user, products }) {
  const [attReceive, setAttReceive] = useState(false);
  const [selProduct, setSelProduct] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [lot, setLot] = useState('');
  const [expDate, setExpDate] = useState('');
  const [concept, setConcept] = useState('Compra a Proveedor');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReceive = async (e) => {
    e.preventDefault();
    setAttReceive(true);
    if (!selProduct || !qty || !cost || !lot || !concept) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await apiService.receiveProduct({
        product_name: selProduct,
        qty: parseFloat(qty),
        unit_cost: parseFloat(cost),
        lot_code: lot,
        expiration_date: expDate || null,
        concept: concept,
        user: user.username
      });
      alert("Ingreso registrado correctamente ✅");
      setSelProduct(''); setQty(''); setCost(''); setLot(''); setExpDate('');
      setAttReceive(false);
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Registrar Ingreso de Mercadería</h3>
      
      <form onSubmit={handleReceive} className="form-grid">
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Producto</label>
          <select className="input-premium" value={selProduct} onChange={(e) => setSelProduct(e.target.value)}>
            <option value="">-- Seleccione un producto --</option>
            {products.map(p => (
              <option key={p.id} value={p.name}>{p.name} ({p.unit})</option>
            ))}
          </select>
          {attReceive && !selProduct && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Cantidad</label>
          <input type="number" className="input-premium" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} />
          {attReceive && !qty && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Costo Unitario (S/.)</label>
          <input type="number" className="input-premium" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
          {attReceive && !cost && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Código de Lote</label>
          <input type="text" className="input-premium" placeholder="Ej: LOTE-123" value={lot} onChange={(e) => setLot(e.target.value)} />
          {attReceive && !lot && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Fecha Vencimiento (Opcional)</label>
          <input type="date" className="input-premium" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Concepto</label>
          <input type="text" className="input-premium" value={concept} onChange={(e) => setConcept(e.target.value)} />
          {attReceive && !concept && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>
        
        <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
          <button type="submit" className="btn-primary" disabled={isProcessing} style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
            {isProcessing ? 'Procesando...' : 'Guardar Ingreso'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReceiveAdminTab;
