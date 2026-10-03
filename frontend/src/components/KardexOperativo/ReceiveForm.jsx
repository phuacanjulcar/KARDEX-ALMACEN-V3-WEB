import React, { useState } from 'react';
import { apiService } from '../../services/api';

function ReceiveForm({ user, products, zones, onSuccess }) {
  const [attReceive, setAttReceive] = useState(false);
  const [selProduct, setSelProduct] = useState('');
  const [receiveQty, setReceiveQty] = useState('');
  const [receiveCost, setReceiveCost] = useState('');
  const [receiveLot, setReceiveLot] = useState('');
  const [receiveExpDate, setReceiveExpDate] = useState('');
  const [receiveType, setReceiveType] = useState('Compra');
  const [receiveConcept, setReceiveConcept] = useState('Ingreso Operativo');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReceive = async (e) => {
    e.preventDefault();
    setAttReceive(true);
    if (!selProduct || !receiveQty || !receiveCost || !receiveLot || !receiveConcept || !receiveExpDate) return;
    
    setIsProcessing(true);
    try {
      await apiService.receiveProduct({
        product_name: selProduct,
        qty: parseFloat(receiveQty),
        unit_cost: parseFloat(receiveCost),
        lot_code: receiveLot,
        expiration_date: receiveExpDate,
        concept: receiveConcept,
        user: user.username
      });
      alert("Ingreso registrado correctamente ✅");
      setSelProduct(''); setReceiveQty(''); setReceiveCost(''); setReceiveLot(''); setReceiveExpDate('');
      setAttReceive(false);
      onSuccess();
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleReceive}>
      <h4 style={{ marginBottom: '16px', color: 'var(--primary)' }}>Ingreso de Almacén</h4>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Tipo de Ingreso</label>
        <select className="input-premium" value={receiveType} onChange={(e) => {
          const val = e.target.value;
          setReceiveType(val);
          if(val === 'Transferencia' && !receiveLot.startsWith('TRF-')) {
            setReceiveLot('TRF-' + receiveLot);
          } else if (val !== 'Transferencia' && receiveLot.startsWith('TRF-')) {
            setReceiveLot(receiveLot.replace('TRF-', ''));
          }
          
          if (val === 'Transferencia' || val === 'Donacion' || val === 'Ajuste') {
            setReceiveCost('0');
          }
          
          if (val === 'Transferencia') {
            setReceiveConcept('');
          } else {
            setReceiveConcept('Ingreso Operativo');
          }
        }}>
          <option value="Compra">Compra</option>
          <option value="Transferencia">Transferencia Interna</option>
          <option value="Donacion">Donación</option>
          <option value="Ajuste">Ajuste de Inventario</option>
        </select>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Producto</label>
        <select className="input-premium" value={selProduct} onChange={(e) => setSelProduct(e.target.value)}>
          <option value="">-- Seleccione un producto --</option>
          {products.map(p => (
            <option key={p.id} value={p.name}>{p.name} ({p.unit})</option>
          ))}
        </select>
        {attReceive && !selProduct && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Cantidad</label>
          <input type="number" min="0" className="input-premium" step="0.01" value={receiveQty} onChange={(e) => setReceiveQty(e.target.value)} />
          {attReceive && !receiveQty && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>Obligatorio.</span>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Costo Unit (S/.)</label>
          <input type="number" min="0" className="input-premium" step="0.01" value={receiveCost} onChange={(e) => setReceiveCost(e.target.value)} disabled={['Transferencia', 'Donacion', 'Ajuste'].includes(receiveType)} />
          {attReceive && !receiveCost && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>Obligatorio.</span>}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Código de Lote</label>
        <input type="text" className="input-premium" placeholder="Ej: LOTE-123" value={receiveLot} onChange={(e) => setReceiveLot(e.target.value)} />
        {attReceive && !receiveLot && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Vencimiento</label>
        <input type="date" className="input-premium" value={receiveExpDate} onChange={(e) => setReceiveExpDate(e.target.value)} />
        {attReceive && !receiveExpDate && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>{receiveType === 'Transferencia' ? 'Zona de Origen' : 'Concepto / Proveedor'}</label>
        {receiveType === 'Transferencia' ? (
          <select className="input-premium" value={receiveConcept} onChange={(e) => setReceiveConcept(e.target.value)}>
            <option value="">-- Seleccione la Zona de Origen --</option>
            {zones.map(z => (
              <option key={z.id} value={`Transferencia desde: ${z.name}`}>{z.name}</option>
            ))}
          </select>
        ) : (
          <input type="text" className="input-premium" value={receiveConcept} onChange={(e) => setReceiveConcept(e.target.value)} />
        )}
        {attReceive && !receiveConcept && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
      </div>

      <button 
        type="submit"
        className="btn-primary" 
        disabled={isProcessing} 
        style={{ width: '100%' }}
      >
        {isProcessing ? "Procesando..." : "Confirmar Ingreso"}
      </button>
    </form>
  );
}

export default ReceiveForm;
