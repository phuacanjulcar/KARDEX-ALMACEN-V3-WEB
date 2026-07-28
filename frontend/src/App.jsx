import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainDashboard from './pages/MainDashboard';
import KardexOperativo from './pages/KardexOperativo';
import AdminPanel from './pages/AdminPanel';
import './index.css';

function App() {
  useEffect(() => {
    const checkAuth = async () => {
      const sessionStr = sessionStorage.getItem('kardex_session');
      if (!sessionStr) return;
      try {
        const user = JSON.parse(sessionStr);
        const res = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/auth/status', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.status === 401) {
          sessionStorage.removeItem('kardex_session');
          window.location.href = '/login?expired=1';
        }
      } catch (e) {}
    };

    // Check auth on mount
    checkAuth();

    // Check auth periodically every 15 seconds
    const authInterval = setInterval(checkAuth, 15000);
    
    // Keep-alive ping silencioso cada 10 minutos
    const interval = setInterval(() => {
      fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/kardex/stats')
        .catch(() => {});
    }, 600000);
    
    return () => {
      clearInterval(authInterval);
      clearInterval(interval);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<MainDashboard />} />
        <Route path="/kardex" element={<KardexOperativo />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
