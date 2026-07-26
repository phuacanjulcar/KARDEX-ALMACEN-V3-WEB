import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

function KardexOperativo() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dispatch State
  const [selectedItem, setSelectedItem] = useState(null);
  const [dispatchQty, setDispatchQty] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Validate session
    const sessionStr = localStorage.getItem('user');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(sessionStr));
    fetchInventory();
  }, [navigate]);

  const fetchInventory = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/inventory');
      const data = await res.json();
      if (res.ok) {
        setInventory(data);
      }
    } catch (error) {
      console.error("Error fetching inventory", error);
    }
  };

  const handleDispatch = async () => {
    if (!selectedItem || !dispatchQty || dispatchQty <= 0) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: selectedItem.product_name,
          qty: parseFloat(dispatchQty),
          user: user.username
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Despacho registrado correctamente ✅");
        setSelectedItem(null);
        setDispatchQty('');
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        
        <div className="glass-panel" style={{ padding: '24px', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <h3>Inventario Disponible</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Busque productos para registrar salidas.</p>
          
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
                      No se encontraron productos.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => {
                    const isSelected = selectedItem?.lot_id === item.lot_id;
                    return (
                      <tr key={item.lot_id} 
                          onClick={() => setSelectedItem(item)}
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
            <h4 style={{ marginBottom: '16px', color: 'var(--danger)' }}>Registrar Salida</h4>
            
            {!selectedItem ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px', fontStyle: 'italic' }}>
                Seleccione un producto de la tabla a la izquierda para despachar.
              </div>
            ) : (
              <div style={{ padding: '12px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px', marginBottom: '16px' }}>
                <strong>Producto:</strong> {selectedItem.product_name} <br/>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lote: {selectedItem.lot_code} (Stock: {selectedItem.qty})</span>
              </div>
            )}
            
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Cantidad a Despachar</label>
            <input 
              type="number" 
              className="input-premium" 
              placeholder="0" 
              value={dispatchQty}
              onChange={(e) => setDispatchQty(e.target.value)}
              disabled={!selectedItem || isProcessing}
              style={{ marginBottom: '16px' }} 
            />

            <button 
              className="btn-primary" 
              disabled={!selectedItem || !dispatchQty || dispatchQty <= 0 || isProcessing} 
              style={{ width: '100%', opacity: (!selectedItem || !dispatchQty || dispatchQty <= 0) ? 0.5 : 1, cursor: (!selectedItem || !dispatchQty || dispatchQty <= 0) ? 'not-allowed' : 'pointer' }}
              onClick={handleDispatch}
            >
              {isProcessing ? "Procesando..." : "Confirmar Salida"}
            </button>
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
