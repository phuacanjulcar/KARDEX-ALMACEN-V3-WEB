import React from 'react';

function GuideModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="glass-panel" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: 'var(--primary)' }}>📖 Guía Rápida del Sistema</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
        </div>
        
        <div style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
          <h4 style={{ color: 'var(--text-main)', marginTop: '0' }}>1. Tipos de Ingreso</h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li><strong>🛒 Compra:</strong> Ingreso de mercadería comprada. Requiere costo real (Prefijo PAQ-).</li>
            <li><strong>🏢 Transferencia:</strong> Mercadería que llega desde otra sede. Costo 0 (Prefijo TRF-).</li>
            <li><strong>🎁 Donación:</strong> Bienes recibidos gratis. Costo 0 (Prefijo DON-).</li>
            <li><strong>⚖️ Ajuste:</strong> Para cuadrar stock sobrante físico. Costo 0 (Prefijo AJU-).</li>
          </ul>

          <h4 style={{ color: 'var(--text-main)' }}>2. Lotes y Vencimientos</h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li><strong>FEFO (Primero en vencer, primero en salir):</strong> El sistema ordena automáticamente los lotes y te sugiere gastar siempre lo que está más próximo a caducar.</li>
            <li><strong>FIFO (Primero en entrar, primero en salir):</strong> Si dos productos no tienen fecha de vencimiento, o vencen el mismo día, el sistema sugerirá gastar el que ingresó hace más tiempo.</li>
          </ul>

          <h4 style={{ color: 'var(--text-main)' }}>3. Salidas y Destinos</h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Stock Estricto:</strong> Nunca puedes sacar más cantidad de la que existe en un lote específico.</li>
            <li><strong>Destino:</strong> Siempre debes indicar hacia dónde va la mercadería (Ej: Cocina, Comedor) para la auditoría.</li>
          </ul>

          <h4 style={{ color: 'var(--text-main)' }}>4. Seguridad</h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
            <li><strong>Sesión Única:</strong> Si la pantalla te bota repentinamente, alguien más ingresó con tu usuario en otro dispositivo.</li>
            <li><strong>Antifraude:</strong> La fecha y hora de todos los movimientos son automáticas basadas en el reloj del servidor central.</li>
          </ul>
        </div>
        
        <button className="btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}

export default GuideModal;
