import React from 'react';
import { apiService } from '../../services/api';

function ZonesTab({ categories, zones, destinations, onSuccess }) {
  return (
    <div>
      <h3 style={{ marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>Gestor de Zonas, Categorías y Destinos</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <h4>Nueva Categoría</h4>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const name = prompt("Nombre de la nueva categoría:");
            if (!name) return;
            try {
              await apiService.createCategory(name);
              onSuccess();
            } catch (err) {
              alert(err);
            }
          }} style={{ marginTop: '16px' }}>
            <button type="submit" className="btn-primary">Crear Categoría</button>
          </form>
          <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
            {categories.map(c => <li key={c.id}>{c.name}</li>)}
          </ul>
        </div>
        
        <div>
          <h4>Nueva Zona de Almacén (Origen Físico)</h4>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const name = prompt("Nombre de la nueva zona:");
            if (!name) return;
            try {
              await apiService.createZone(name);
              onSuccess();
            } catch (err) {
              alert(err);
            }
          }} style={{ marginTop: '16px' }}>
            <button type="submit" className="btn-primary">Crear Zona</button>
          </form>
          <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
            {zones.map(z => <li key={z.id}>{z.name}</li>)}
          </ul>
        </div>

        <div>
          <h4>Nuevos Destinos Predeterminados</h4>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const name = prompt("Nombre del nuevo destino:");
            if (!name) return;
            try {
              await apiService.createDestination(name);
              onSuccess();
            } catch (err) {
              alert(err);
            }
          }} style={{ marginTop: '16px' }}>
            <button type="submit" className="btn-primary">Crear Destino</button>
          </form>
          <ul style={{ marginTop: '16px', paddingLeft: '20px' }}>
            {destinations.map(d => (
              <li key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '300px', marginBottom: '8px' }}>
                <span>{d.name}</span>
                <button onClick={async () => {
                  if(!window.confirm(`¿Eliminar destino ${d.name}?`)) return;
                  try {
                    await apiService.deleteDestination(d.id);
                    onSuccess();
                  } catch (err) {
                    alert(err);
                  }
                }} style={{ background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ZonesTab;
