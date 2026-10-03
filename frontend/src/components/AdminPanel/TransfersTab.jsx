import React, { useState } from 'react';
import { apiService } from '../../services/api';

function TransfersTab({ user, products, onSuccess }) {
  const [attTransfer, setAttTransfer] = useState(false);
  const [transSourceProd, setTransSourceProd] = useState('');
  const [transDestProd, setTransDestProd] = useState('');
  const [transQty, setTransQty] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setAttTransfer(true);
    if (!transSourceProd || !transDestProd || !transQty) {
      return;
    }
    if (transSourceProd === transDestProd) {
      alert("El producto origen y destino no pueden ser el mismo");
      return;
    }
    setIsProcessing(true);
    try {
      const pSrc = products.find(p => p.id.toString() === transSourceProd);
      const pDst = products.find(p => p.id.toString() === transDestProd);
      
      await apiService.transferProduct({
        source_product_name: pSrc.name,
        dest_product_name: pDst.name,
        qty: parseFloat(transQty),
        user: user.username
      });
      alert("Transferencia completada con éxito!");
      setTransSourceProd('');
      setTransDestProd('');
      setTransQty('');
      setAttTransfer(false);
      onSuccess();
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Transferencias entre Locales/Zonas</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
        Traslada stock de un producto hacia otro restando del origen y sumando al destino automáticamente.
      </p>
      <form onSubmit={handleTransfer} className="form-grid">
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Producto Origen (Sale)</label>
          <select className="input-premium" value={transSourceProd} onChange={(e) => setTransSourceProd(e.target.value)}>
            <option value="">-- Seleccione origen --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
            ))}
          </select>
          {attTransfer && !transSourceProd && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Producto Destino (Entra)</label>
          <select className="input-premium" value={transDestProd} onChange={(e) => setTransDestProd(e.target.value)}>
            <option value="">-- Seleccione destino --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
            ))}
          </select>
          {attTransfer && !transDestProd && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Cantidad a Transferir</label>
          <input type="number" className="input-premium" step="0.01" value={transQty} onChange={(e) => setTransQty(e.target.value)} />
          {attTransfer && !transQty && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
        </div>

        <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
          <button type="submit" className="btn-primary" disabled={isProcessing} style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
            {isProcessing ? 'Procesando Transferencia...' : '🚀 Ejecutar Transferencia'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TransfersTab;
