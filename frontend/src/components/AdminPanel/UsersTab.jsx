import React, { useState } from 'react';
import { apiService } from '../../services/api';

function UsersTab({ users, onSuccess }) {
  const [uName, setUName] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uRole, setURole] = useState('operador');
  const [attUser, setAttUser] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResetPassword = async (username) => {
    const newPwd = prompt(`Ingrese la nueva contraseña para el usuario ${username}:`);
    if (!newPwd) return;
    setIsProcessing(true);
    try {
      await apiService.resetUserPassword(username, newPwd);
      alert("Contraseña restablecida con éxito.");
    } catch (e) {
      alert("Error al restablecer contraseña: " + e);
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
      await apiService.createUser({ username: uName, password: uPassword, role: uRole });
      alert("Usuario creado con éxito.");
      setUName(''); setUPassword(''); setAttUser(false); onSuccess();
    } catch (e) {
      alert("Error al crear usuario: " + e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
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
  );
}

export default UsersTab;
