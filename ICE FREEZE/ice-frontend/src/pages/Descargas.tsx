import { Download, HardDrive, Smartphone, FileUp, MousePointerClick, Power, Clock, Cpu, Zap } from 'lucide-react';

export default function Descargas() {
  return (
    <div className="page-wrapper">
      <div className="toolbar">
        <h3>Descargas e Instaladores</h3>
      </div>
      <div className="grid-container" style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '8px' }}>
              <Download size={32} />
            </div>
            <div>
              <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Ice Client - Versión 1.6.4</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Última actualización: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <HardDrive size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Congelamiento (UWF)</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Protege el disco revirtiendo cambios en cada reinicio.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <MousePointerClick size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Control Remoto HD</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Control total (ratón y teclado) y streaming fluido.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <FileUp size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Envío de Archivos</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Transfiere documentos instantáneamente al destino.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Smartphone size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Multiplataforma</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Administra comandos desde tu PC, laptop o celular.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Power size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Apagado y Reinicio</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Control de energía remoto de manera instantánea.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Clock size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Tiempo Prendido Real</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Mide con exactitud el tiempo de actividad de la PC.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Cpu size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Información Detallada del Sistema</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Extrae automáticamente datos de Hardware (RAM, Disco Duro, Marca, Modelo, N° de Serie), tipo de conexión (Cable/WiFi) y versión del Sistema Operativo Windows.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Zap size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Monitoreo de Energía Inteligente</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Control y análisis de ahorro de energía mediante estadísticas e historiales diarios de tiempo encendido por sede y grupo.</span>
              </div>
            </div>
          </div>



          <div style={{ display: 'flex', gap: '1rem' }}>
            <a 
              href="https://github.com/jhony20251102/ice-frontend/releases/download/v1.6.4/Ice.Client.Setup.1.6.4.exe" 
              target="_blank"
              rel="noopener noreferrer"
              className="btn" 
              style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={20} />
              Descargar Instalador (Windows)
            </a>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-hover)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>Instrucciones de Instalación:</strong>
            <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem' }}>
              <li>Descarga el archivo <code>Ice.Client.Setup.1.6.4.exe</code>.</li>
              <li>Cópialo al equipo destino.</li>
              <li>Ejecútalo como Administrador.</li>
              <li>Acepta los términos y sigue los pasos del instalador. El equipo se registrará automáticamente en esta consola.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
