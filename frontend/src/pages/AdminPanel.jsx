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

  // Form State - Recepción
  const [selProduct, setSelProduct] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [lot, setLot] = useState('');
  const [expDate, setExpDate] = useState('');
  const [concept, setConcept] = useState('Compra a Proveedor');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State - Producto
  const [pName, setPName] = useState('');
  const [pUnit, setPUnit] = useState('Unds');
  const [pPrefix, setPPrefix] = useState('PAQ');
  const [pMin, setPMin] = useState('10');
  const [pMax, setPMax] = useState('100');
  const [pCat, setPCat] = useState('');
  const [pZone, setPZone] = useState('');

  // Form State - Usuario
  const [uName, setUName] = useState('');
  const [uPin, setUPin] = useState('');
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
      const [resProd, resUsers, resCat, resZone, resDocs, resRec] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/products'),
        fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/admin/users'),
        fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/categories'),
        fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/zones'),
        fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/documents'),
        fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/recipes')
      ]);
      setProducts(await resProd.json());
      setUsers(await resUsers.json());
      setCategories(await resCat.json());
      setZones(await resZone.json());
      setDocuments(await resDocs.json());
      setRecipes(await resRec.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    if (!selProduct || !qty || !cost || !lot) {
      alert("Por favor complete todos los campos obligatorios.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/receive', {
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
      } else {
        alert("Error: " + data.detail);
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pName, unit: pUnit, prefix: pPrefix, 
          min_stock: parseFloat(pMin), max_stock: parseFloat(pMax),
          category_id: parseInt(pCat), zone_id: parseInt(pZone)
        })
      });
      if (res.ok) {
        alert("Producto creado ✅");
        setPName(''); fetchData();
      } else alert("Error al crear producto");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uName, pin: uPin, role: uRole })
      });
      if (res.ok) {
        alert("Usuario creado ✅");
        setUName(''); setUPin(''); fetchData();
      } else alert("Error al crear usuario (puede que el usuario ya exista)");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunAudit = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/admin/audit');
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/recipes/${recipeId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user.username,
          batches: parseFloat(batches),
          output_product_name: outProd,
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

      <div style={{ display: 'flex', gap: '24px' }}>
        
        {/* Sidebar Tabs */}
        <div className="glass-panel" style={{ width: '250px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            style={{ padding: '12px', textAlign: 'left', background: activeTab === 'recepcion' ? 'var(--primary)' : 'transparent', color: activeTab === 'recepcion' ? 'white' : 'var(--text-main)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setActiveTab('recepcion')}
          >
            📥 Recepción (Ingresos)
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
            </div>
          )}

          {activeTab === 'recetas' && (
            <div>
              <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Módulo de Producción (Recetas)</h3>
              
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div>
                  <h4>Nueva Categoría</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const name = prompt("Nombre de la nueva categoría:");
                    if (!name) return;
                    await fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/categories', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name})});
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
                    await fetch((import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}') + '/zones', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, description: ''})});
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
              
              <form onSubmit={handleReceive} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Producto *</label>
                  <select className="input-premium" value={selProduct} onChange={(e) => setSelProduct(e.target.value)} required>
                    <option value="">-- Seleccione un producto --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({p.unit})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Cantidad *</label>
                  <input type="number" className="input-premium" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} required />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Costo Unitario (S/.) *</label>
                  <input type="number" className="input-premium" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} required />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Código de Lote *</label>
                  <input type="text" className="input-premium" placeholder="Ej: LOTE-123" value={lot} onChange={(e) => setLot(e.target.value)} required />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Fecha Vencimiento (Opcional)</label>
                  <input type="date" className="input-premium" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Concepto</label>
                  <input type="text" className="input-premium" value={concept} onChange={(e) => setConcept(e.target.value)} required />
                </div>
                
                <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                  <button type="submit" className="btn-primary" disabled={isProcessing} style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
                    {isProcessing ? 'Procesando...' : 'Guardar Ingreso'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'guias' && (
            <div>
              <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Historial de Guías Inmutable</h3>
              <div style={{ overflowY: 'auto', maxHeight: '500px', border: '1px solid var(--border)', borderRadius: '12px' }}>
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
                            <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/documents/${doc.id}/pdf`} target="_blank" rel="noreferrer" 
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
              <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Crear Nuevo Producto</h3>
              <form onSubmit={handleCreateProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nombre del Producto *</label>
                  <input type="text" className="input-premium" value={pName} onChange={(e) => setPName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Categoría *</label>
                  <select className="input-premium" value={pCat} onChange={(e) => setPCat(e.target.value)} required>
                    <option value="">-- Seleccione Categoría --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Zona/Ubicación *</label>
                  <select className="input-premium" value={pZone} onChange={(e) => setPZone(e.target.value)} required>
                    <option value="">-- Seleccione Zona --</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Unidad de Medida</label>
                  <input type="text" className="input-premium" value={pUnit} onChange={(e) => setPUnit(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Prefijo Lote</label>
                  <input type="text" className="input-premium" value={pPrefix} onChange={(e) => setPPrefix(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Stock Mínimo</label>
                  <input type="number" className="input-premium" value={pMin} onChange={(e) => setPMin(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Stock Máximo</label>
                  <input type="number" className="input-premium" value={pMax} onChange={(e) => setPMax(e.target.value)} required />
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                  <button type="submit" className="btn-primary" disabled={isProcessing} style={{ width: '100%' }}>Crear Producto</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'usuarios' && (
            <div>
              <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Gestión de Usuarios</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div>
                  <h4>Nuevo Usuario</h4>
                  <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nombre de Usuario *</label>
                      <input type="text" className="input-premium" value={uName} onChange={(e) => setUName(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>PIN (4 dígitos) *</label>
                      <input type="password" maxLength={4} className="input-premium" value={uPin} onChange={(e) => setUPin(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Rol *</label>
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
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px' }}>{u.username}</td>
                          <td style={{ padding: '8px' }}>{u.role === 'admin' ? '⚙️ Admin' : '👤 Operador'}</td>
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
