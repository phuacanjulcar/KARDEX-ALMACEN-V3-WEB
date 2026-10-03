import React from 'react';

function InventoryTable({ inventory, searchTerm, setSearchTerm, selectedItem, setSelectedItem, setOperationMode }) {
  const filteredInventory = inventory.filter(item => 
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.lot_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
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
                        setOperationMode('salida');
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
  );
}

export default InventoryTable;
