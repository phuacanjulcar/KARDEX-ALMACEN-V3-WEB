import React, { useState } from 'react';
import { apiService } from '../../services/api';

function AuditTab({ auditResult, setAuditResult, auditHistory, systemAudit }) {
  const [auditType, setAuditType] = useState('inventory');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunAudit = async () => {
    setIsProcessing(true);
    try {
      const data = await apiService.runAudit();
      setAuditResult(data);
    } catch (e) {
      alert("Error al correr auditoría: " + e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          className="btn-primary" 
          style={{ background: auditType === 'inventory' ? 'var(--primary)' : 'transparent', color: auditType === 'inventory' ? 'white' : 'var(--text-main)', border: auditType === 'inventory' ? 'none' : '1px solid var(--border)' }}
          onClick={() => setAuditType('inventory')}
        >
          📦 Auditoría de Inventario
        </button>
        <button 
          className="btn-primary" 
          style={{ background: auditType === 'system' ? 'var(--danger)' : 'transparent', color: auditType === 'system' ? 'white' : 'var(--text-main)', border: auditType === 'system' ? 'none' : '1px solid var(--border)' }}
          onClick={() => setAuditType('system')}
        >
          🛡️ Auditoría del Sistema (Antifraude)
        </button>
      </div>

      {auditType === 'inventory' && (
        <>
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
        </>
      )}

      {auditType === 'system' && (
        <>
          <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px', color: 'var(--danger)' }}>Auditoría Administrativa</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Esta bitácora es de sólo lectura y registra todos los cambios de configuración hechos por administradores (creación de usuarios, modificación de contraseñas, edición de productos). <strong>Ningún administrador puede borrar o alterar este registro.</strong>
          </p>
          <div className="table-container" style={{ borderLeft: '4px solid var(--danger)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,59,48,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border)', color: 'var(--danger)' }}>ID</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border)', color: 'var(--danger)' }}>Fecha/Hora</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border)', color: 'var(--danger)' }}>Admin Responsable</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border)', color: 'var(--danger)' }}>Acción</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border)', color: 'var(--danger)' }}>Objetivo</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid var(--border)', color: 'var(--danger)' }}>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {systemAudit.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay cambios recientes</td></tr>
                ) : (
                  systemAudit.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>{row.id}</td>
                      <td style={{ padding: '12px' }}>{row.timestamp}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{row.admin_username}</td>
                      <td style={{ padding: '12px' }}><span style={{ background: 'var(--danger)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{row.action}</span></td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{row.target}</td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{row.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default AuditTab;
