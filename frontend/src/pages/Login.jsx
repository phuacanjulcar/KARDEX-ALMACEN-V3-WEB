import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../index.css'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('expired') === '1') {
      setError("⚠️ Sesión cerrada: Alguien más inició sesión en otro dispositivo con tu cuenta. Si no fuiste tú, contacta al supervisor de inmediato por posible robo de contraseña.")
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com') + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        const userData = {
          username: data.username,
          role: data.role,
          token: data.token
        }
        localStorage.setItem('user', JSON.stringify(userData))
        sessionStorage.setItem('kardex_session', JSON.stringify(userData))
        
        if (data.role === 'admin') {
          navigate('/dashboard')
        } else {
          navigate('/kardex')
        }
      } else {
        setError(data.detail || data.message || 'Credenciales incorrectas')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    } finally {
      
    }
  }

  return (
    <div className="login-container">
      <div className="login-card glass-panel animate-entrance">
        
        <div className="login-logos">
          <img src="/logo_ciudad.png" alt="Ciudad Logo" className="logo-main" />
          <h2 style={{ color: 'var(--primary)', marginTop: '8px' }}>Almacén Inmaculada</h2>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', textAlign: 'center', fontWeight: '500', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Usuario
            </label>
            <input 
              type="text" 
              className="input-premium"
              placeholder="Ingrese su nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Contraseña
            </label>
            <input 
              type="password" 
              className="input-premium"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ letterSpacing: '0.2em', fontSize: '1.2rem', textAlign: 'center' }}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
            Ingresar al Sistema
          </button>
        </form>

        <div className="login-footer">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem' }}>Con el respaldo académico de:</span>
            <img src="/logo_uni.png" alt="UNI Logo" className="logo-uni" />
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>FIIS - UNI</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
