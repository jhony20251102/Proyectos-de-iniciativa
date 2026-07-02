import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Laptop, Cpu, HardDrive, Wifi, Activity, AlertTriangle, Monitor, Tag, Hash, Building2, Layers, ShieldCheck, Database } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const API_URL = `${SOCKET_URL}/api`;

type ExtendedInfo = {
  os_version: string;
  ram_total: string;
  cpu_model: string;
  brand: string;
  model: string;
  serial_number: string;
  disk_capacity: string;
  disk_used: string;
  disk_type?: string;
  boot_time?: number;
};

type ClientDetail = {
  id: string;
  hostname: string;
  ip: string;
  version: string;
  directiva: string;
  grupo: string;
  etiquetas: string;
  is_frozen: boolean;
  status: 'online' | 'offline';
  last_seen: string;
  network_type: string;
  extended?: ExtendedInfo;
};

export default function EquipoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`${API_URL}/clients/${id}`);
        if (res.ok) {
          const data = await res.json();
          setClient(data);
        } else {
          console.error('Client not found');
        }
      } catch (e) {
        console.error("Error fetching client details", e);
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id]);

  if (loading) {
    return <div className="page-wrapper" style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><h2 style={{ color: 'var(--text-muted)' }}>Cargando detalles del equipo...</h2></div>;
  }

  if (!client) {
    return (
      <div className="page-wrapper" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Equipo no encontrado</h2>
        <button className="btn btn-primary" onClick={() => navigate('/equipos')}>Volver a la lista</button>
      </div>
    );
  }

  const ex = client.extended || {} as ExtendedInfo;
  
  
  const lastSeenDate = new Date(client.last_seen);
  const timeAgo = Math.round((new Date().getTime() - lastSeenDate.getTime()) / 60000);
  const timeAgoText = timeAgo < 1 ? 'Hace un momento' : timeAgo < 60 ? `Hace ${timeAgo} minutos` : `Hace ${Math.round(timeAgo/60)} horas`;

  
  let diskUsedPercentage = 0;
  if (ex.disk_capacity && ex.disk_used) {
    const capStr = ex.disk_capacity.replace(/[^0-9.]/g, '');
    const usedStr = ex.disk_used.replace(/[^0-9.]/g, '');
    const cap = parseFloat(capStr);
    const used = parseFloat(usedStr);
    if (!isNaN(cap) && !isNaN(used) && cap > 0) {
      // If units are mixed (e.g. GB vs MB), this needs to be smarter, but usually both are GB from sysinfo
      diskUsedPercentage = Math.min(100, Math.round((used / cap) * 100));
    }
  }

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', padding: '2rem', background: 'var(--bg-main)', color: 'var(--text-main)', transition: 'all 0.3s' }}>
      
      {}
      <button 
        onClick={() => navigate('/equipos')} 
        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '1rem', padding: 0, fontWeight: 500 }}
      >
        <ArrowLeft size={20} />
        Volver a la lista de equipos
      </button>

      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.05))', pointerEvents: 'none' }}></div>
          
          <div style={{ background: client.status === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)', width: '100px', height: '100px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${client.status === 'online' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)'}` }}>
            <Laptop size={54} color={client.status === 'online' ? '#10b981' : '#64748b'} />
          </div>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.2rem', color: 'var(--text-main)', fontWeight: 700, letterSpacing: '-0.5px' }}>{client.hostname}</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.1rem' }}>
                    {ex.brand && ex.brand !== 'Unknown' ? `${ex.brand} ${ex.model}` : 'PC Genérica'}
                  </h3>
                  <div style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'var(--bg-hover)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', border: '1px solid var(--border-color)' }}>
                    Agente v{client.version || '1.0.0'}
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-hover)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: client.status === 'online' ? '#10b981' : '#ef4444', boxShadow: client.status === 'online' ? '0 0 10px #10b981' : 'none' }}></div>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{client.status === 'online' ? 'Conectado Ahora' : 'Desconectado'}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: client.is_frozen ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: client.is_frozen ? '#38bdf8' : '#ef4444', padding: '0.5rem 1rem', borderRadius: '12px', border: `1px solid ${client.is_frozen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                  {client.is_frozen ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                  <span style={{ fontWeight: 600 }}>{client.is_frozen ? 'Sistema Congelado (Protegido)' : 'Sistema Descongelado (Vulnerable)'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          
          {}
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Hash size={20} color="var(--primary)" /> Identificación de Red
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Dirección IP</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{client.ip}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Dirección MAC</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>{client.id}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Tipo de Red</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'capitalize' }}>
                  <Wifi size={18} color="var(--info)" /> {client.network_type || 'Ethernet'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Último Reporte</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} color="var(--success)" /> {client.status === 'online' ? 'En vivo' : timeAgoText}
                </div>
              </div>
            </div>
          </div>

          {}
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={20} color="var(--primary)" /> Especificaciones de Hardware
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              
              <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <Cpu size={24} color="var(--primary)" />
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Procesador (CPU)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{ex.cpu_model || 'Información no disponible'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, background: 'var(--bg-hover)', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <HardDrive size={24} color="var(--info)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Almacenamiento ({ex.disk_type || 'HDD'})</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{ex.disk_used || '0GB'} / {ex.disk_capacity || '0GB'}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${diskUsedPercentage}%`, height: '100%', background: diskUsedPercentage > 85 ? 'var(--danger)' : diskUsedPercentage > 70 ? 'var(--warning)' : 'var(--primary)', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, background: 'var(--bg-hover)', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <Monitor size={24} color="var(--warning)" />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Memoria RAM</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>{ex.ram_total || 'N/A'}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {}
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={20} color="var(--primary)" /> Sistema y Ubicación
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  <Building2 size={16} />
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sede Asignada</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>{client.directiva || 'Sin Asignar'}</div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  <Database size={16} />
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grupo / Ambiente</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>{client.grupo || 'Sin Asignar'}</div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  <Monitor size={16} />
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sistema Operativo</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {ex.os_version ? `Windows ${ex.os_version.startsWith('10.0.2') ? '11' : '10'}` : 'Windows OS'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Build: {ex.os_version || 'N/A'}</div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                  <Tag size={16} />
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Etiquetas</span>
                </div>
                {client.etiquetas ? (
                  <div style={{ display: 'inline-block', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--primary)' }}>
                    {client.etiquetas}
                  </div>
                ) : (
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin etiquetas</div>
                )}
              </div>

            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Hash size={16} />
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Número de Serie:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{ex.serial_number || 'N/A'}</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
