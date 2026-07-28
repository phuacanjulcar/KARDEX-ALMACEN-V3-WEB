import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('recepcion');
  
  // Data State
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [zones, setZones] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [auditResult, setAuditResult] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [auditHistory, setAuditHistory] = useState([]);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeItems, setNewRecipeItems] = useState([]);
  const [selRecipeProduct, setSelRecipeProduct] = useState('');
  const [selRecipeQty, setSelRecipeQty] = useState('');

  // Validation States
  const [attReceive, setAttReceive] = useState(false);
  const [attTransfer, setAttTransfer] = useState(false);
  const [attProduct, setAttProduct] = useState(false);
  const [attUser, setAttUser] = useState(false);
  const [attRecipe, setAttRecipe] = useState(false);

  // Form State - Transferencias
  const [transSourceProd, setTransSourceProd] = useState('');
  const [transDestProd, setTransDestProd] = useState('');
  const [transQty, setTransQty] = useState('');

  // Form State - Recepción
  const [selProduct, setSelProduct] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [lot, setLot] = useState('');
  const [expDate, setExpDate] = useState('');
  const [concept, setConcept] = useState('Compra a Proveedor');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State - Producto
  const [editProductId, setEditProductId] = useState(null);
  const [pName, setPName] = useState('');
  const [pUnit, setPUnit] = useState('Unidades (Und)');
  const [pPrefix, setPPrefix] = useState('PAQ');
  const [pMin, setPMin] = useState('10');
  const [pMax, setPMax] = useState('100');
  const [pCat, setPCat] = useState('');
  const [pZone, setPZone] = useState('');

  // Form State - Usuario
  const [uName, setUName] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uRole, setURole] = useState('operador');

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
      const [resProd, resUsers, resCat, resZone, resDocs, resRec, resHist] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/products'),
        fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/admin/users'),
        fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/categories'),
        fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/zones'),
        fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/documents'),
        fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/recipes'),
        fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/admin/history')
      ]);
      setProducts(await resProd.json());
      setUsers(await resUsers.json());
      setCategories(await resCat.json());
      setZones(await resZone.json());
      setDocuments(await resDocs.json());
      setRecipes(await resRec.json());
      if(resHist.ok) setAuditHistory(await resHist.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    setAttReceive(true);
    if (!selProduct || !qty || !cost || !lot || !concept) {
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: selProduct,
          qty: parseFloat(qty),
          unit_cost: parseFloat(cost),
          lot_code: lot,
          expiration_date: expDate || null,
          concept: concept,
          user: user.username
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Ingreso registrado correctamente ✅");
        setSelProduct(''); setQty(''); setCost(''); setLot(''); setExpDate('');
        setAttReceive(false);
      } else {
        alert("Error: " + data.detail);
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setAttProduct(true);
    if (!pName || !pCat || !pZone || !pUnit || !pPrefix || !pMin || !pMax) return;
    setIsProcessing(true);
    try {
      const url = editProductId 
        ? `${import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com'}/admin/products/${editProductId}`
        : `${import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com'}/admin/products`;
      const method = editProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pName, unit: pUnit, prefix: pPrefix, 
          min_stock: parseFloat(pMin), max_stock: parseFloat(pMax),
          category_id: parseInt(pCat), zone_id: parseInt(pZone)
        })
      });
      if (res.ok) {
        alert(`Producto ${editProductId ? 'actualizado' : 'creado'} ✅`);
        setPName(''); setEditProductId(null); setAttProduct(false); fetchData();
      } else alert("Error al guardar producto");
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
    if (!confirm("¿Está seguro de eliminar este producto? Se eliminará de la base de datos.")) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com'}/admin/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert("Producto eliminado.");
        fetchData();
      } else alert("Error al eliminar producto");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (username) => {
    const newPwd = prompt(`Ingrese la nueva contraseña para el usuario ${username}:`);
    if (!newPwd) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com'}/admin/users/${username}/reset`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPwd })
      });
      if (res.ok) {
        alert("Contraseña restablecida con éxito.");
      } else {
        alert("Error al restablecer contraseña.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setAttUser(true);
    if (!uName || !uPassword || !uRole) return;
    setIsProcessing(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uName, password: uPassword, role: uRole })
      });
      if (res.ok) {
        alert("Usuario creado con éxito.");
        setUName(''); setUPassword(''); setAttUser(false); fetchData();
      } else alert("Error al crear usuario (puede que el usuario ya exista)");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunAudit = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/admin/audit');
      const data = await res.json();
      if (res.ok) {
        setAuditResult(data);
      } else {
        alert("Error al correr auditoría");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteRecipe = async (recipeId) => {
    const batches = prompt("¿Cuántas unidades del producto final vas a producir?");
    if (!batches || isNaN(batches)) return;
    const outProd = prompt("¿Cuál es el nombre del producto final que ingresará al Kardex?");
    if (!outProd) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com'}/recipes/${recipeId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user.username,
          batches: parseFloat(batches),
          output_product_name: outProd.trim().toUpperCase().replace(/\s+/g, '_'),
          lot_code: `PROD-${new Date().getTime()}`,
          expiration_date: ''
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Producción ejecutada! Se descontaron los insumos y se ingresó el producto final.");
        fetchData();
      } else {
        alert("Error: " + data.detail);
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateRecipe = async (e) => {
    e.preventDefault();
    setAttRecipe(true);
    if (!newRecipeName || newRecipeItems.length === 0) {
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRecipeName,
          created_by: user.username,
          items: newRecipeItems
        })
      });
      if (res.ok) {
        alert("Receta creada exitosamente");
        setNewRecipeName('');
        setNewRecipeItems([]);
        setShowRecipeForm(false);
        setAttRecipe(false);
        fetchData();
      } else {
        alert("Error al crear receta");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddRecipeItem = () => {
    if(!selRecipeProduct || !selRecipeQty) return;
    const p = products.find(x => x.id.toString() === selRecipeProduct);
    if(p) {
      setNewRecipeItems([...newRecipeItems, { product_id: p.id, name: p.name, qty: parseFloat(selRecipeQty) }]);
      setSelRecipeProduct('');
      setSelRecipeQty('');
    }
  };

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
      
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_product_name: pSrc.name,
          dest_product_name: pDst.name,
          qty: parseFloat(transQty),
          user: user.username
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Transferencia completada con éxito!");
        setTransSourceProd('');
        setTransDestProd('');
        setTransQty('');
        setAttTransfer(false);
        fetchData();
      } else {
        alert("Error: " + data.detail);
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setIsProcessing(false);
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
            📑 Historial de Guías
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
            🏷️ Zonas y Categorías
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
            <div>
              <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Auditoría Antifraude y Consistencia</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                Este módulo analiza matemáticamente todos los movimientos del Kardex y los contrasta con los saldos de lotes activos para detectar manipulaciones directas en la base de datos o descuadres lógicos.
              </p>
              
              <button className="btn-primary" onClick={handleRunAudit} disabled={isProcessing} style={{ padding: '12px 24px', fontSize: '1.1rem', marginBottom: '24px' }}>
                {isProcessing ? 'Analizando Base de Datos...' : '▶️ Ejecutar Análisis Profundo'}
              </button>

              {auditResult && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ color: auditResult.status === 'PASS' ? 'var(--primary)' : 'var(--danger)' }}>
                    Resultado: {auditResult.status === 'PASS' ? '✅ SIN ANOMALÍAS' : '❌ ANOMALÍAS DETECTADAS'}
                  </h4>
                  
                  {auditResult.alerts.length > 0 && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {auditResult.alerts.map((alert, idx) => (
                        <div key={idx} style={{ 
                          padding: '16px', 
                          borderLeft: `4px solid ${alert.type === 'CRITICAL' ? 'var(--danger)' : '#f59e0b'}`,
                          background: alert.type === 'CRITICAL' ? 'rgba(255,59,48,0.1)' : 'rgba(245,158,11,0.1)',
                          borderRadius: '4px'
                        }}>
                          <strong>[{alert.type}] {alert.product}:</strong> {alert.message}
                        </div>
                      ))}
                    </div>
                  )}
                  {auditResult.alerts.length === 0 && (
                    <div style={{ padding: '16px', background: 'rgba(52,199,89,0.1)', borderLeft: '4px solid var(--primary)', borderRadius: '4px', marginTop: '16px' }}>
                      Todos los cálculos matemáticos (Ingresos - Salidas = Stock Físico) son consistentes y no hay stock negativo.
                    </div>
                  )}
                </div>
              )}

              <h3 style={{ marginTop: '40px', marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Historial Detallado de Movimientos</h3>
              <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.05)', textAlign: 'left' }}>
                      <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>ID</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Fecha</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Tipo</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Documento</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Usuario</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditHistory.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay historial</td></tr>
                    ) : (
                      auditHistory.map(row => (
                        <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px' }}>{row.id}</td>
                          <td style={{ padding: '12px' }}>{row.date}</td>
                          <td style={{ padding: '12px', color: row.type === 'E' ? 'var(--primary)' : 'var(--danger)', fontWeight: 'bold' }}>{row.type === 'E' ? 'ENTRADA' : 'SALIDA'}</td>
                          <td style={{ padding: '12px' }}>{row.doc_number}</td>
                          <td style={{ padding: '12px' }}>{row.username}</td>
                          <td style={{ padding: '12px' }}>
                            <a href={`${import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com'}/documents/${row.id}/pdf`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                              Ver PDF
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'recetas' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>Módulo de Producción (Recetas)</h3>
                <button className="btn-primary" onClick={() => setShowRecipeForm(!showRecipeForm)}>
                  {showRecipeForm ? 'Cancelar' : '+ Nueva Receta'}
                </button>
              </div>

              {showRecipeForm && (
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid var(--primary)' }}>
                  <h4>Crear Nueva Receta</h4>
                  <form onSubmit={handleCreateRecipe} style={{ marginTop: '16px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nombre de la Receta (Kit/Combo)</label>
                      <input type="text" className="input-premium" value={newRecipeName} onChange={e => {
                        let val = e.target.value.toUpperCase();
                        val = val.replace(/\s+/g, '_');
                        setNewRecipeName(val);
                      }} />
                      {attRecipe && !newRecipeName && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
                    </div>
                    
                    <div style={{ padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', marginBottom: '16px' }}>
                      <h5 style={{ margin: '0 0 12px 0' }}>Insumos requeridos:</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', marginBottom: '12px' }}>
                        <div style={{ flex: '1 1 200px' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Insumo</label>
                          <select className="input-premium" value={selRecipeProduct} onChange={e => setSelRecipeProduct(e.target.value)}>
                            <option value="">-- Seleccionar --</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div style={{ width: '120px' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Cant.</label>
                          <input type="number" step="0.01" className="input-premium" value={selRecipeQty} onChange={e => setSelRecipeQty(e.target.value)} />
                        </div>
                        <button type="button" className="btn-primary" onClick={handleAddRecipeItem} style={{ padding: '14px', height: 'fit-content' }}>Añadir</button>
                      </div>
                      
                      {newRecipeItems.length > 0 && (
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                          {newRecipeItems.map((it, idx) => (
                            <li key={idx}><strong>{it.qty}</strong> de {it.name}</li>
                          ))}
                        </ul>
                      )}
                      {attRecipe && newRecipeItems.length === 0 && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '8px', display: 'block' }}>Agregue al menos un insumo.</span>}
                    </div>
                    
                    <button type="submit" className="btn-primary" disabled={isProcessing} style={{ width: '100%', padding: '14px' }}>
                      {isProcessing ? 'Guardando...' : 'Guardar Receta'}
                    </button>
                  </form>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {recipes.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No hay recetas creadas.</p>
                ) : (
                  recipes.map(recipe => (
                    <div key={recipe.id} style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>{recipe.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Insumos requeridos por lote:</p>
                      <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', marginBottom: '16px' }}>
                        {recipe.items.map((item, idx) => (
                          <li key={idx}><strong>{item.qty} {item.unit}</strong> de {item.product_name}</li>
                        ))}
                      </ul>
                      <button className="btn-primary" onClick={() => handleExecuteRecipe(recipe.id)} disabled={isProcessing} style={{ width: '100%' }}>
                        🚀 Ejecutar Producción
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'zonas' && (
            <div>
              <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Gestor de Zonas y Categorías</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <h4>Nueva Categoría</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const name = prompt("Nombre de la nueva categoría:");
                    if (!name) return;
                    await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/categories', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name})});
                    fetchData();
                  }} style={{ marginTop: '16px' }}>
                    <button type="submit" className="btn-primary">Crear Categoría</button>
                  </form>
                  <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
                    {categories.map(c => <li key={c.id}>{c.name}</li>)}
                  </ul>
                </div>
                
                <div>
                  <h4>Nueva Zona de Almacén</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const name = prompt("Nombre de la nueva zona:");
                    if (!name) return;
                    await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/zones', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, description: ''})});
                    fetchData();
                  }} style={{ marginTop: '16px' }}>
                    <button type="submit" className="btn-primary">Crear Zona</button>
                  </form>
                  <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
                    {zones.map(z => <li key={z.id}>{z.name}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recepcion' && (
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
          )}

          {activeTab === 'transferencias' && (
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
          )}

          {activeTab === 'guias' && (
            <div>
              <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Historial de Guías Inmutable</h3>
              <div className="table-container" style={{ maxHeight: '500px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: 'rgba(0,0,0,0.02)', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Tipo</th>
                      <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Documento</th>
                      <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Fecha</th>
                      <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Operario</th>
                      <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay guías registradas.</td></tr>
                    ) : (
                      documents.map(doc => (
                        <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: doc.type === 'INGRESO' ? 'var(--primary)' : 'var(--danger)' }}>{doc.type}</td>
                          <td style={{ padding: '12px' }}>{doc.doc_number}</td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{doc.date}</td>
                          <td style={{ padding: '12px' }}>{doc.user}</td>
                          <td style={{ padding: '12px' }}>
                            <a href={`${import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com'}/documents/${doc.id}/pdf`} target="_blank" rel="noreferrer" 
                               style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem' }}>
                              Ver PDF
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'productos' && (
            <div>
              <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>
                {editProductId ? '✏️ Editar Producto' : '📦 Crear Nuevo Producto'}
              </h3>
              <form onSubmit={handleSaveProduct} className="form-grid">
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nombre del Producto</label>
                  <input type="text" className="input-premium" value={pName} onChange={(e) => {
                    let val = e.target.value.toUpperCase();
                    // Al usuario le gusta que los espacios se vuelvan guiones en vivo. 
                    // El backend se encarga de recortar (.strip) antes de guardarlo en la DB
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
          )}

          {activeTab === 'usuarios' && (
            <div>
              <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Gestión de Usuarios</h3>
              <div className="form-grid">
                <div>
                  <h4>Nuevo Usuario</h4>
                  <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nombre de Usuario</label>
                      <input type="text" className="input-premium" value={uName} onChange={(e) => setUName(e.target.value)} />
                      {attUser && !uName && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Contraseña</label>
                      <input type="password" className="input-premium" value={uPassword} onChange={(e) => setUPassword(e.target.value)} />
                      {attUser && !uPassword && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Rol</label>
                      <select className="input-premium" value={uRole} onChange={(e) => setURole(e.target.value)}>
                        <option value="operador">Operador (Sólo salidas)</option>
                        <option value="admin">Administrador (Control total)</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-primary" disabled={isProcessing}>Crear Usuario</button>
                  </form>
                </div>
                
                <div>
                  <h4>Usuarios Existentes</h4>
                  <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.05)' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Usuario</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Rol</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px' }}>{u.username}</td>
                          <td style={{ padding: '8px' }}>{u.role === 'admin' ? '⚙️ Admin' : '👤 Operador'}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button onClick={() => handleResetPassword(u.username)} style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                              🔑 Resetear Clave
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default AdminPanel;
