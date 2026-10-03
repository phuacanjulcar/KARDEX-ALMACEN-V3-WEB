import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';
import { apiService } from '../services/api';

import AuditTab from '../components/AdminPanel/AuditTab';
import RecipesTab from '../components/AdminPanel/RecipesTab';
import ZonesTab from '../components/AdminPanel/ZonesTab';
import ReceiveAdminTab from '../components/AdminPanel/ReceiveAdminTab';
import TransfersTab from '../components/AdminPanel/TransfersTab';
import DocumentsTab from '../components/AdminPanel/DocumentsTab';
import ProductsTab from '../components/AdminPanel/ProductsTab';
import UsersTab from '../components/AdminPanel/UsersTab';

function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('recepcion');
  
  // Data State
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [zones, setZones] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [auditResult, setAuditResult] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [auditHistory, setAuditHistory] = useState([]);
  const [systemAudit, setSystemAudit] = useState([]);

  useEffect(() => {
    const sessionStr = localStorage.getItem('user');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    const u = JSON.parse(sessionStr);
    if (u.role !== 'admin') {
      navigate('/login');
      return;
    }
    setUser(u);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [resProd, resUsers, resCat, resZone, resDocs, resRec, resHist, resDest, resSysAud] = await Promise.all([
        apiService.getProducts().catch(() => []),
        apiService.getUsers().catch(() => []),
        apiService.getCategories().catch(() => []),
        apiService.getZones().catch(() => []),
        apiService.getDocuments().catch(() => []),
        apiService.getRecipes().catch(() => []),
        apiService.getAuditHistory().catch(() => []),
        apiService.getDestinations().catch(() => []),
        apiService.getSystemAudit().catch(() => [])
      ]);
      setProducts(resProd);
      setUsers(resUsers);
      setCategories(resCat);
      setZones(resZone);
      setDocuments(resDocs);
      setRecipes(resRec);
      setAuditHistory(resHist);
      setDestinations(resDest);
      setSystemAudit(resSysAud);
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', margin: 0 }}>Panel de Administrador</h2>
        </div>
        <button className="btn-primary" style={{ background: 'var(--text-muted)' }} onClick={() => navigate('/dashboard')}>
          Volver al Dashboard
        </button>
      </div>

      <div className="dashboard-layout">
        
        {/* Sidebar Tabs */}
        <div className="glass-panel sidebar">
          <button 
            style={{ padding: '12px', textAlign: 'left', background: activeTab === 'recepcion' ? 'var(--primary)' : 'transparent', color: activeTab === 'recepcion' ? 'white' : 'var(--text-main)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setActiveTab('recepcion')}
          >
            📥 Recepción (Ingresos)
          </button>
          <button 
            style={{ padding: '12px', textAlign: 'left', background: activeTab === 'transferencias' ? 'var(--primary)' : 'transparent', color: activeTab === 'transferencias' ? 'white' : 'var(--text-main)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setActiveTab('transferencias')}
          >
            🔄 Transferencias
          </button>
          <button 
            style={{ padding: '12px', textAlign: 'left', background: activeTab === 'guias' ? 'var(--primary)' : 'transparent', color: activeTab === 'guias' ? 'white' : 'var(--text-main)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setActiveTab('guias')}
          >
            📑 Bandeja de Documentos
          </button>
          <button 
            style={{ padding: '12px', textAlign: 'left', background: activeTab === 'auditoria' ? 'var(--primary)' : 'transparent', color: activeTab === 'auditoria' ? 'white' : 'var(--text-main)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setActiveTab('auditoria')}
          >
            🛡️ Auditoría
          </button>
          <button 
            style={{ padding: '12px', textAlign: 'left', background: activeTab === 'recetas' ? 'var(--primary)' : 'transparent', color: activeTab === 'recetas' ? 'white' : 'var(--text-main)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setActiveTab('recetas')}
          >
            🍳 Producción (Recetas)
          </button>
          <button 
            style={{ padding: '12px', textAlign: 'left', background: activeTab === 'zonas' ? 'var(--primary)' : 'transparent', color: activeTab === 'zonas' ? 'white' : 'var(--text-main)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setActiveTab('zonas')}
          >
            🏷️ Zonas y Destinos
          </button>
          <button 
            style={{ padding: '12px', textAlign: 'left', background: activeTab === 'productos' ? 'var(--primary)' : 'transparent', color: activeTab === 'productos' ? 'white' : 'var(--text-main)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setActiveTab('productos')}
          >
            📦 Maestro Productos
          </button>
          <button 
            style={{ padding: '12px', textAlign: 'left', background: activeTab === 'usuarios' ? 'var(--primary)' : 'transparent', color: activeTab === 'usuarios' ? 'white' : 'var(--text-main)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setActiveTab('usuarios')}
          >
            👥 Usuarios
          </button>
        </div>

        {/* Content Area */}
        <div className="glass-panel" style={{ flex: 1, padding: '32px' }}>
          {activeTab === 'auditoria' && (
            <AuditTab 
              auditResult={auditResult} 
              setAuditResult={setAuditResult} 
              auditHistory={auditHistory} 
              systemAudit={systemAudit} 
            />
          )}

          {activeTab === 'recetas' && (
            <RecipesTab 
              user={user} 
              products={products} 
              recipes={recipes} 
              onSuccess={fetchData} 
            />
          )}

          {activeTab === 'zonas' && (
            <ZonesTab 
              categories={categories} 
              zones={zones} 
              destinations={destinations} 
              onSuccess={fetchData} 
            />
          )}

          {activeTab === 'recepcion' && (
            <ReceiveAdminTab 
              user={user} 
              products={products} 
            />
          )}

          {activeTab === 'transferencias' && (
            <TransfersTab 
              user={user} 
              products={products} 
              onSuccess={fetchData} 
            />
          )}

          {activeTab === 'guias' && (
            <DocumentsTab 
              documents={documents} 
            />
          )}

          {activeTab === 'productos' && (
            <ProductsTab 
              products={products} 
              categories={categories} 
              zones={zones} 
              onSuccess={fetchData} 
            />
          )}

          {activeTab === 'usuarios' && (
            <UsersTab 
              users={users} 
              onSuccess={fetchData} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
