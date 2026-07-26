import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

function MainDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [showInbox, setShowInbox] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem('user');
    if (!sessionStr) {
      navigate('/login');
    } else {
      setUser(JSON.parse(sessionStr));
      fetchAlerts();
    }
  }, [navigate]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/alerts');
      if (res.ok) setAlerts(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

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
          <h3 style={{ color: 'var(--danger)', marginBottom: '16px' }}>⚠️ Alertas de Stock Crítico</h3>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Card 1: Admin Panel */}
        <div className="glass-panel" style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s' }} 
             onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
             onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
             onClick={() => navigate('/admin')}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚙️</div>
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

        {/* Card 3: Reportes */}
        <div className="glass-panel" style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s' }}
             onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
             onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📊</div>
          <h3>Reportes de Cierre</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
            Generar PDFs e historial de movimientos.
          </p>
        </div>

      </div>
    </div>
  );
}

export default MainDashboard;
