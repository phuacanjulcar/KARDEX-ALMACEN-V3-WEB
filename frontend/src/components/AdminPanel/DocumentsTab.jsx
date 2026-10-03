import React from 'react';

function DocumentsTab({ documents }) {
  return (
    <div>
      <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Bandeja de Documentos (Guías y Vales)</h3>
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
  );
}

export default DocumentsTab;
