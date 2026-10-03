import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';
import { apiService } from '../services/api';
import InventoryTable from '../components/KardexOperativo/InventoryTable';
import DispatchForm from '../components/KardexOperativo/DispatchForm';
import ReceiveForm from '../components/KardexOperativo/ReceiveForm';
import GuideModal from '../components/KardexOperativo/GuideModal';

function KardexOperativo() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [zones, setZones] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [operationMode, setOperationMode] = useState('salida'); // 'salida' | 'ingreso'
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    // Validate session
    const sessionStr = localStorage.getItem('user');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(sessionStr));
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setInventory(await apiService.getInventory());
      setProducts(await apiService.getProducts());
      setDestinations(await apiService.getDestinations());
      setZones(await apiService.getZones());
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const handleSuccess = () => {
    setInventory([]);
    apiService.getInventory().then(setInventory);
  };

  if (!user) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ color: 'var(--primary)', margin: 0 }}>Terminal Operativa</h2>
          <button 
            className="btn-primary" 
            style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '50px', background: 'var(--secondary)' }}
            onClick={() => setShowGuide(true)}
          >
            ❓ Guía Rápida
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Usuario actual: <strong>{user.username}</strong> ({user.role})</p>
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
      </div>

      <div className="operativo-layout">
        <InventoryTable 
          inventory={inventory} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          selectedItem={selectedItem} 
          setSelectedItem={setSelectedItem} 
          setOperationMode={setOperationMode} 
        />

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
              <DispatchForm 
                user={user} 
                selectedItem={selectedItem} 
                setSelectedItem={setSelectedItem} 
                destinations={destinations} 
                onSuccess={handleSuccess} 
              />
            ) : (
              <ReceiveForm 
                user={user} 
                products={products} 
                zones={zones} 
                onSuccess={handleSuccess} 
              />
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

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}

export default KardexOperativo;
