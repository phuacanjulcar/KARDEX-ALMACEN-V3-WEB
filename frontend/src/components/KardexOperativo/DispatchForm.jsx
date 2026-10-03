import React, { useState } from 'react';
import { apiService } from '../../services/api';

function DispatchForm({ user, selectedItem, setSelectedItem, destinations, onSuccess }) {
  const [dispatchQty, setDispatchQty] = useState('');
  const [dispatchDest, setDispatchDest] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDispatch = async () => {
    if (!selectedItem || !dispatchQty || dispatchQty <= 0) return;
    
    setIsProcessing(true);
    try {
      await apiService.dispatchProduct({
        product_name: selectedItem.product_name,
        qty: parseFloat(dispatchQty),
        user: user.username,
        destination: dispatchDest
      });
      alert("Despacho registrado correctamente ✅");
      setSelectedItem(null);
      setDispatchQty('');
      setDispatchDest('');
      onSuccess();
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <h4 style={{ marginBottom: '16px', color: 'var(--danger)' }}>Salida de Almacén</h4>
      
      {!selectedItem ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px', fontStyle: 'italic' }}>
          Seleccione un producto de la tabla a la izquierda para despachar.
        </div>
      ) : (
        <div style={{ padding: '12px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px', marginBottom: '16px' }}>
          <strong>Producto:</strong> {selectedItem.product_name} <br/>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lote: {selectedItem.lot_code} (Stock actual: {selectedItem.qty})</span>
        </div>
      )}
      
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Destino Predeterminado (Opcional)</label>
      <select className="input-premium" value={dispatchDest} onChange={(e) => setDispatchDest(e.target.value)} style={{ marginBottom: '16px' }}>
        <option value="">-- Seleccionar Destino --</option>
        {destinations.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
      </select>

      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Cantidad a Despachar</label>
      <input 
        type="number" 
        className="input-premium" 
        placeholder="0" 
        min="0"
        value={dispatchQty}
        onChange={(e) => setDispatchQty(e.target.value)}
        disabled={!selectedItem || isProcessing}
        style={{ marginBottom: '16px' }} 
      />

      <button 
        className="btn-primary" 
        disabled={!selectedItem || !dispatchQty || dispatchQty <= 0 || isProcessing} 
        style={{ width: '100%', background: 'var(--danger)', opacity: (!selectedItem || !dispatchQty || dispatchQty <= 0) ? 0.5 : 1, cursor: (!selectedItem || !dispatchQty || dispatchQty <= 0) ? 'not-allowed' : 'pointer' }}
        onClick={handleDispatch}
      >
        {isProcessing ? "Procesando..." : "Confirmar Salida"}
      </button>
    </div>
  );
}

export default DispatchForm;
