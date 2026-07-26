import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Global Fetch Interceptor para inyectar JWT automáticamente en todas las peticiones
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  // Cambiar URL de localhost a Producción si existe la variable de entorno
  const API_URL = import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com';
  if (typeof resource === 'string' && resource.startsWith('https://kardex-api-backend.onrender.com')) {
    resource = resource.replace('https://kardex-api-backend.onrender.com', API_URL);
  }
  
  const sessionStr = localStorage.getItem('user');
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (session.token) {
        config = config || {};
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${session.token}`
        };
      }
    } catch (e) {
      // Ignorar error de parseo
    }
  }
  
  const response = await originalFetch(resource, config);
  
  // Interceptar 401 Unauthorized para cerrar sesión
  if (response.status === 401 && resource !== 'https://kardex-api-backend.onrender.com/login') {
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  
  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
