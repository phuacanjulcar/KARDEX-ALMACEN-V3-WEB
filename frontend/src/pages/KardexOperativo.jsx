import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

function KardexOperativo() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [zones, setZones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Operation Mode
  const [operationMode, setOperationMode] = useState('salida'); // 'salida' | 'ingreso'

  // Dispatch State (Salida)
  const [selectedItem, setSelectedItem] = useState(null);
  const [dispatchQty, setDispatchQty] = useState('');
  const [dispatchDest, setDispatchDest] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Receive State (Ingreso)
  const [attReceive, setAttReceive] = useState(false);
  const [selProduct, setSelProduct] = useState('');
  const [receiveQty, setReceiveQty] = useState('');
  const [receiveCost, setReceiveCost] = useState('');
  const [receiveLot, setReceiveLot] = useState('');
  const [receiveExpDate, setReceiveExpDate] = useState('');
  const [receiveType, setReceiveType] = useState('Compra');
  const [receiveConcept, setReceiveConcept] = useState('Ingreso Operativo');

  useEffect(() => {
    // Validate session
    const sessionStr = localStorage.getItem('user');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(sessionStr));
    fetchInventory();
    fetchProducts();
    fetchDestinations();
    fetchZones();
  }, [navigate]);

  const fetchInventory = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/inventory');
      const data = await res.json();
      if (res.ok) {
        setInventory(data);
      }
    } catch (error) {
      console.error("Error fetching inventory", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/products');
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (error) {
      console.error("Error fetching products", error);
    }
  };

  const fetchDestinations = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/destinations');
      if (res.ok) {
        setDestinations(await res.json());
      }
    } catch (error) {
      console.error("Error fetching destinations", error);
    }
  };

  const fetchZones = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/zones');
      if (res.ok) {
        setZones(await res.json());
      }
    } catch (error) {
      console.error("Error fetching zones", error);
    }
  };

  const handleDispatch = async () => {
    if (!selectedItem || !dispatchQty || dispatchQty <= 0) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: selectedItem.product_name,
          qty: parseFloat(dispatchQty),
          user: user.username,
          destination: dispatchDest
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Despacho registrado correctamente ✅");
        setSelectedItem(null);
        setDispatchQty('');
        setDispatchDest('');
        fetchInventory(); // Refresh table
      } else {
        alert("Error: " + data.detail);
      }
    } catch (error) {
      alert("Error de conexión con el servidor");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    setAttReceive(true);
    if (!selProduct || !receiveQty || !receiveCost || !receiveLot || !receiveConcept || !receiveExpDate) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: selProduct,
          qty: parseFloat(receiveQty),
          unit_cost: parseFloat(receiveCost),
          lot_code: receiveLot,
          expiration_date: receiveExpDate,
          concept: receiveConcept,
          user: user.username
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Ingreso registrado correctamente ✅");
        setSelProduct(''); setReceiveQty(''); setReceiveCost(''); setReceiveLot(''); setReceiveExpDate('');
        setAttReceive(false);
        fetchInventory(); // Refresh table
      } else {
        alert("Error: " + data.detail);
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  const filteredInventory = inventory.filter(item => 
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.lot_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', margin: 0 }}>Terminal Operativa</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Usuario actual: <strong>{user.username}</strong> ({user.role})</p>
        </div>
        <button 
          className="btn-primary" 
          style={{ background: 'var(--danger)', padding: '8px 16px', fontSize: '0.9rem' }}
          onClick={() => {
            localStorage.removeItem('user');
            navigate('/login');
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Main workspace */}
      <div className="operativo-layout">
        
        <div className="glass-panel" style={{ padding: '24px', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <h3>Inventario Disponible</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Busque lotes activos (para Salidas).</p>
          
          <input 
            type="text" 
            className="input-premium" 
            placeholder="🔎 Buscar por nombre o código de lote..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginTop: '16px', marginBottom: '16px' }}
          />
          
          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Producto</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Lote</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron productos en stock.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => {
                    const isSelected = selectedItem?.lot_id === item.lot_id;
                    return (
                      <tr key={item.lot_id} 
                          onClick={() => {
                            if(operationMode !== 'salida') setOperationMode('salida');
                            setSelectedItem(item);
                          }}
                          style={{ 
                            borderBottom: '1px solid var(--border)', 
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                            borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent'
                          }}
                          onMouseOver={(e) => { if(!isSelected) e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)' }}
                          onMouseOut={(e) => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}>
                        <td style={{ padding: '12px', fontWeight: '500' }}>{item.product_name}</td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.lot_code}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>{item.qty} {item.unit}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button 
                style={{ flex: 1, padding: '10px', fontWeight: 'bold', cursor: 'pointer', background: operationMode === 'salida' ? 'var(--danger)' : 'transparent', color: operationMode === 'salida' ? 'white' : 'var(--text-main)', border: '1px solid var(--danger)', borderRadius: '6px' }}
                onClick={() => setOperationMode('salida')}
              >
                ➖ Registrar Salida
              </button>
              <button 
                style={{ flex: 1, padding: '10px', fontWeight: 'bold', cursor: 'pointer', background: operationMode === 'ingreso' ? 'var(--primary)' : 'transparent', color: operationMode === 'ingreso' ? 'white' : 'var(--text-main)', border: '1px solid var(--primary)', borderRadius: '6px' }}
                onClick={() => setOperationMode('ingreso')}
              >
                ➕ Registrar Ingreso
              </button>
            </div>

            {operationMode === 'salida' ? (
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
            ) : (
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
            )}

          </div>
          
          {user.role === 'admin' && (
            <button 
              className="btn-primary" 
              style={{ width: '100%', background: 'var(--text-muted)' }}
              onClick={() => navigate('/dashboard')}
            >
              ⬅ Volver al Dashboard Master
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default KardexOperativo;
