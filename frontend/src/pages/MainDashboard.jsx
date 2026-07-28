import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import '../index.css';

function MainDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ movements: [], top_products: [] });
  const [showInbox, setShowInbox] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem('user');
    if (!sessionStr) {
      navigate('/login');
    } else {
      setUser(JSON.parse(sessionStr));
      fetchAlerts();
      fetchStats();
    }
  }, [navigate]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/alerts');
      if (res.ok) setAlerts(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/kardex/stats');
      if (res.ok) {
        const data = await res.json();
        
        // Transform movements for recharts (Group by date)
        const dateMap = {};
        data.movements.forEach(m => {
          const date = m.d;
          if (!dateMap[date]) dateMap[date] = { name: date, Entradas: 0, Salidas: 0 };
          if (m.type === 'E') dateMap[date].Entradas += m.total;
          if (m.type === 'S') dateMap[date].Salidas += m.total;
        });
        
        setStats({
          movements: Object.values(dateMap).sort((a,b) => a.name.localeCompare(b.name)),
          top_products: data.top_products.map(p => ({ name: p.name, stock: p.stock }))
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ color: 'var(--primary)', marginBottom: '8px' }}>Bienvenido, {user.username}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Rol actual: <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{user.role}</span></p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn-primary" style={{ background: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowInbox(!showInbox)}>
            🔔 Notificaciones {alerts.length > 0 && <span style={{ background: 'white', color: 'var(--danger)', borderRadius: '50%', padding: '2px 8px', fontSize: '0.8rem' }}>{alerts.length}</span>}
          </button>
          <button className="btn-primary" style={{ background: 'var(--text-muted)' }} onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {showInbox && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '40px', borderLeft: '4px solid var(--danger)' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '16px' }}>🚨 Alertas de Stock Crítico</h3>
          {alerts.length === 0 ? (
            <p>Todo en orden, no hay stock bajo.</p>
          ) : (
            <ul style={{ paddingLeft: '20px' }}>
              {alerts.map((a, i) => (
                <li key={i} style={{ marginBottom: '8px' }}>
                  El producto <strong>{a.name}</strong> tiene stock <strong>{a.actual_stock}</strong> (Mínimo requerido: {a.min_stock})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tarjetas de Navegación Rápida */}
      <div className="form-grid" style={{ marginBottom: "40px" }}>
        {/* Card 1: Admin Panel */}
        <div className="glass-panel" style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s' }} 
             onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
             onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
             onClick={() => navigate('/admin')}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🛠️</div>
          <h3>Panel de Administrador</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
            Gestionar usuarios, auditar kardex y configurar el sistema.
          </p>
        </div>

        {/* Card 2: Kardex Operativo */}
        <div className="glass-panel" style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s' }}
             onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
             onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
             onClick={() => navigate('/kardex')}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📦</div>
          <h3>Kardex Operativo</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
            Registrar ingresos, salidas y visualizar stock.
          </p>
        </div>
      </div>

      {/* Gráficos de Datos (Recharts) */}
      <div className="chart-grid">
        
        {/* Gráfico Tendencia 7 días */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>📊 Entradas vs Salidas (Últimos 7 días)</h3>
          <div style={{ height: '300px' }}>
            {stats.movements.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.movements} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="Entradas" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="Salidas" stroke="var(--danger)" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No hay movimientos recientes
              </div>
            )}
          </div>
        </div>

        {/* Gráfico Top 5 Productos */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>🏆 Top 5 Productos con más Stock</h3>
          <div style={{ height: '300px' }}>
            {stats.top_products.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.top_products} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="stock" label>
                    {stats.top_products.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No hay productos en inventario
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

export default MainDashboard;
