import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Monitor, Wifi, Network, AlertCircle, Power, RefreshCw, Upload, CheckCircle, 
  MousePointer2, Cpu, HardDrive, User as UserIcon, LayoutGrid, List, Search, Lock, Activity, Clock, Info, X, MapPin 
} from 'lucide-react';
import type { User } from 'firebase/auth';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const socket = io(SOCKET_URL, { transports: ['websocket'] });
const API_URL = `${SOCKET_URL}/api`;

type Client = {
  id: string;
  hostname: string;
  ip?: string;
  directiva: string;
  grupo: string;
  network_type: string;
  status: 'online' | 'offline';
  metrics?: { cpu: number; ram: number; user: string; uptimeHours: number; locked?: boolean; wifiSignal?: number };
  extended?: any;
  _mock?: any; 
};

interface RemotoProps {
  user?: User;
}

const formatUptime = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

export default function Remoto({ user }: RemotoProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [streamData, setStreamData] = useState<{ clientId: string; image: string; loading: boolean } | null>(null);
  const [fileSending, setFileSending] = useState(false);
  const [fileSent, setFileSent] = useState<string | null>(null);
  const [controlMode, setControlMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSidebar, setShowSidebar] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const streamClientIdRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  
  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState({
    directiva: '', grupo: '', status: ''
  });

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_URL}/clients`);
      const data = await res.json();
      // Agregar mock data
      setClients(data);
    } catch (e) {
      console.error("Error fetching clients", e);
    }
  };

  const sendCommand = async (id: string, command: string) => {
    if (!confirm(`⚠️ ¿Estás seguro de que quieres ejecutar este comando en el equipo remoto?`)) return;
    try {
      await fetch(`${API_URL}/clients/${id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, userEmail: user?.email || 'Admin' })
      });
      alert('Comando enviado correctamente.');
    } catch (e) {
      console.error("Error sending command", e);
      alert('Error al enviar comando.');
    }
  };

  useEffect(() => {
    fetchClients();

    socket.on('client_updated', (updatedClient: Client) => {
      setClients(prev => {
        const index = prev.findIndex(c => c.id === updatedClient.id);
        if (index >= 0) {
          const newClients = [...prev];
          newClients[index] = updatedClient;
          return newClients;
        }
        return [...prev, updatedClient];
      });
    });

    socket.on('stream_frame', (data: { image: string }) => {
      setStreamData(prev => prev ? { ...prev, image: data.image, loading: false } : null);
    });

    socket.on('stream_error', (data: { error: string }) => {
      alert(data.error);
      setStreamData(null);
    });

    socket.on('file_received', (data: { fileName: string; success: boolean }) => {
      setFileSending(false);
      setFileSent(data.fileName);
      setTimeout(() => setFileSent(null), 4000);
    });

    socket.on('file_error', (data: { error: string }) => {
      setFileSending(false);
      alert(`❌ Error: ${data.error}`);
    });

    socket.on('webrtc_answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      } catch (e) {
        console.error('Error al configurar remote description:', e);
      }
    });

    socket.on('webrtc_ice_candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      try {
        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (e) {
        console.error('Error al agregar ICE candidate:', e);
      }
    });

    return () => {
      socket.off('client_updated');
      socket.off('stream_frame');
      socket.off('stream_error');
      socket.off('file_received');
      socket.off('file_error');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      if (streamClientIdRef.current) {
        socket.emit('stop_stream', { clientId: streamClientIdRef.current });
      }
    };
  }, []);

  useEffect(() => {
    streamClientIdRef.current = streamData?.clientId || null;
  }, [streamData]);

  const openStream = async (client: Client) => {
    if (client.status !== 'online') return;
    setStreamData({ clientId: client.id, image: '', loading: true });
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('webrtc_ice_candidate', {
          clientId: client.id,
          candidate: e.candidate.toJSON()
        });
      }
    };

    pc.ontrack = (e) => {
      if (videoRef.current) {
        videoRef.current.srcObject = e.streams[0];
        setStreamData(prev => prev ? { ...prev, loading: false } : null);
      }
    };

    try {
      const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: false });
      await pc.setLocalDescription(offer);

      socket.emit('webrtc_offer', { 
        clientId: client.id,
        offer: offer
      });
    } catch (err) {
      console.error('Error al crear oferta WebRTC', err);
      alert('Error iniciando WebRTC');
    }
  };

  const closeStream = () => {
    if (streamData) {
      socket.emit('stop_stream', { clientId: streamData.clientId });
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamData(null);
    setControlMode(false);
    setShowSidebar(false);
    if (isFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(e => console.error(e));
    }
    setIsFullscreen(false);
  };

  const handleSendFile = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !streamData) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 25MB.');
      e.target.value = '';
      return;
    }

    setFileSending(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      socket.emit('send_file', {
        clientId: streamData.clientId,
        fileName: file.name,
        fileData: base64,
        userEmail: user?.email || 'Admin'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; 
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Teclado
  useEffect(() => {
    if (!controlMode || !streamData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Tab', 'Alt', 'Control', 'Shift'].includes(e.key)) e.preventDefault();
      socket.emit('remote_key_press', { clientId: streamData.clientId, key: e.key });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controlMode, streamData]);

  
  const getCoordinatesPercent = (element: HTMLElement, clientX: number, clientY: number) => {
    const rect = element.getBoundingClientRect();
    let streamW = 1280;
    let streamH = 720;
    
    
    if (element instanceof HTMLVideoElement && element.videoWidth) {
      streamW = element.videoWidth;
      streamH = element.videoHeight;
    }

    const streamRatio = streamW / streamH;
    const imgRatio = rect.width / rect.height;
    
    let actualW, actualH, offsetX, offsetY;
    if (imgRatio > streamRatio) {
      actualH = rect.height;
      actualW = actualH * streamRatio;
      offsetX = (rect.width - actualW) / 2;
      offsetY = 0;
    } else {
      actualW = rect.width;
      actualH = actualW / streamRatio;
      offsetX = 0;
      offsetY = (rect.height - actualH) / 2;
    }
    
    const mouseX = clientX - rect.left - offsetX;
    const mouseY = clientY - rect.top - offsetY;
    if (mouseX < 0 || mouseX > actualW || mouseY < 0 || mouseY > actualH) return null;
    return { xPercent: mouseX / actualW, yPercent: mouseY / actualH };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!controlMode || !streamData) return;
    const coords = getCoordinatesPercent(e.currentTarget, e.clientX, e.clientY);
    if (coords) socket.emit('remote_mouse_move', { clientId: streamData.clientId, x: coords.xPercent, y: coords.yPercent });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (!controlMode || !streamData) return;
    const touch = e.touches[0];
    const coords = getCoordinatesPercent(e.currentTarget as HTMLElement, touch.clientX, touch.clientY);
    if (coords) socket.emit('remote_mouse_move', { clientId: streamData.clientId, x: coords.xPercent, y: coords.yPercent });
  };

  const handleMouseClick = (e: React.MouseEvent<HTMLElement>, button: 'left' | 'right') => {
    if (!controlMode || !streamData) return;
    e.preventDefault();
    socket.emit('remote_mouse_click', { clientId: streamData.clientId, button });
  };

  const toggleFullscreen = () => {
    if (!fullscreenContainerRef.current) return;
    if (!document.fullscreenElement) {
      fullscreenContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  
  const filteredClients = clients.filter(c => {
    const s = globalSearch.toLowerCase();
    const matchesSearch = s === '' || 
      c.hostname.toLowerCase().includes(s) || 
      (c.metrics?.user?.toLowerCase().includes(s)) ||
      (c.ip?.includes(s)) ||
      (c.directiva?.toLowerCase().includes(s)) ||
      (c.grupo?.toLowerCase().includes(s));

    const matchesDirectiva = filters.directiva === '' || c.directiva === filters.directiva;
    const matchesGrupo = filters.grupo === '' || c.grupo === filters.grupo;
    const matchesStatus = filters.status === '' || c.status === filters.status;

    return matchesSearch && matchesDirectiva && matchesGrupo && matchesStatus;
  });

  // KPIs
  const totalEquipos = clients.length;
  const onlineEquipos = clients.filter(c => c.status === 'online').length;
  const offlineEquipos = totalEquipos - onlineEquipos;
  const sesionesActivas = clients.filter(c => c.metrics?.user && c.metrics.user !== 'INVITADO').length;
  const criticos = clients.filter(c => c.metrics && c.metrics.uptimeHours >= 24).length;
  
  const totalUptime = clients.reduce((acc, c) => acc + (c.metrics?.uptimeHours || 0), 0);
  const avgUptime = onlineEquipos > 0 ? (totalUptime / onlineEquipos).toFixed(1) + 'h' : '0h';

  const directivasUnicas = Array.from(new Set(clients.map(c => c.directiva).filter(Boolean))).sort();
  const gruposUnicos = Array.from(new Set(clients.map(c => c.grupo).filter(Boolean))).sort();

  return (
    <div className="page-wrapper" style={{ padding: '20px' }}>
      
      {}
      <div className="remoto-kpi-grid">
        <div className="remoto-kpi-card">
          <div className="remoto-kpi-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
            <Monitor size={24} />
          </div>
          <div className="remoto-kpi-content">
            <span className="remoto-kpi-value">{totalEquipos}</span>
            <span className="remoto-kpi-label">Total Equipos</span>
          </div>
        </div>
        <div className="remoto-kpi-card">
          <div className="remoto-kpi-icon" style={{ background: '#dcfce7', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="remoto-kpi-content">
            <span className="remoto-kpi-value">{onlineEquipos}</span>
            <span className="remoto-kpi-label">En línea</span>
          </div>
        </div>
        <div className="remoto-kpi-card">
          <div className="remoto-kpi-icon" style={{ background: '#f3f4f6', color: '#6b7280' }}>
            <Power size={24} />
          </div>
          <div className="remoto-kpi-content">
            <span className="remoto-kpi-value">{offlineEquipos}</span>
            <span className="remoto-kpi-label">Desconectados</span>
          </div>
        </div>
        <div className="remoto-kpi-card">
          <div className="remoto-kpi-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <UserIcon size={24} />
          </div>
          <div className="remoto-kpi-content">
            <span className="remoto-kpi-value">{sesionesActivas}</span>
            <span className="remoto-kpi-label">Sesiones Activas</span>
          </div>
        </div>
        <div className="remoto-kpi-card">
          <div className="remoto-kpi-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div className="remoto-kpi-content">
            <span className="remoto-kpi-value">{criticos}</span>
            <span className="remoto-kpi-label">Equipos Críticos</span>
          </div>
        </div>
        <div className="remoto-kpi-card">
          <div className="remoto-kpi-icon" style={{ background: '#f3e8ff', color: '#a855f7' }}>
            <Clock size={24} />
          </div>
          <div className="remoto-kpi-content">
            <span className="remoto-kpi-value">{avgUptime}</span>
            <span className="remoto-kpi-label">Tiempo Promedio</span>
          </div>
        </div>
      </div>

      {}
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', background: 'var(--bg-card)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flex: 1, gap: '10px', flexWrap: 'wrap', minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: '2', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar equipo, usuario, IP..." 
              value={globalSearch} 
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="inline-input"
              style={{ width: '100%', paddingLeft: '35px' }}
            />
          </div>
          <select value={filters.directiva} onChange={(e) => handleFilterChange('directiva', e.target.value)} className="inline-input" style={{ flex: 1, minWidth: '130px' }}>
            <option value="">Todas las Sedes</option>
            {directivasUnicas.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filters.grupo} onChange={(e) => handleFilterChange('grupo', e.target.value)} className="inline-input" style={{ flex: 1, minWidth: '130px' }}>
            <option value="">Todos los Ambientes</option>
            {gruposUnicos.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="inline-input" style={{ flex: 1, minWidth: '130px' }}>
            <option value="">Todos los Estados</option>
            <option value="online">En Línea</option>
            <option value="offline">Desconectados</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '5px', background: 'var(--bg-body)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setViewMode('grid')}
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'grid' ? 'var(--primary-color)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            <LayoutGrid size={16} /> Tarjetas
          </button>
          <button 
            onClick={() => setViewMode('list')}
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'list' ? 'var(--primary-color)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            <List size={16} /> Lista
          </button>
        </div>
      </div>

      {}
      {filteredClients.length === 0 ? (
        <div className="empty-state">No se encontraron equipos con los filtros actuales.</div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredClients.map(client => {
            const isOnline = client.status === 'online';
            const metrics = client.metrics;
            
            
            let borderClass = '';
            if (isOnline && metrics) {
              if (metrics.uptimeHours >= 24) borderClass = 'border-red';
              else if (metrics.cpu >= 80) borderClass = 'border-orange';
              else if (metrics.uptimeHours >= 8) borderClass = 'border-yellow';
              else borderClass = 'border-green';
            }

            return (
              <div key={client.id} className={`remoto-card ${!isOnline ? 'status-offline' : ''} ${borderClass}`}>
                
                {}
                <div className="card-badges">
                  {isOnline && metrics?.locked && <div className="card-badge" title="Bloqueado"><Lock size={12} /></div>}
                  {isOnline && metrics?.cpu && metrics.cpu >= 80 && <div className="card-badge active" style={{ color: '#f97316', background: '#ffedd5' }} title="Alto Consumo CPU"><Activity size={12} /></div>}
                </div>

                <div className="remoto-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: isOnline ? 'var(--primary-light)' : 'var(--bg-body)', padding: '10px', borderRadius: '8px', color: isOnline ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                      <Monitor size={24} />
                    </div>
                    <div>
                      <h3 className="remoto-card-title" title={client.hostname}>{client.hostname}</h3>
                      <div className="remoto-card-subtitle">
                        <MapPin size={12} /> {client.directiva || 'Sede'} - {client.grupo || 'Ambiente'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: isOnline ? '#10b981' : 'var(--text-muted)', fontWeight: 500 }}>
                  {isOnline ? <><Wifi size={14} /> En línea</> : <><AlertCircle size={14} /> Desconectado</>}
                </div>

                {}
                <div className="remoto-card-stats">
                  <div className="remoto-stat-item">
                    <Clock size={14} className="icon" /> 
                    <span>{isOnline && metrics ? formatUptime(metrics.uptimeHours) : '--'}</span>
                  </div>
                  <div className="remoto-stat-item">
                    <UserIcon size={14} className="icon" /> 
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isOnline && metrics ? metrics.user : '--'}
                    </span>
                  </div>
                  
                  <div style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                    <div className="remoto-stat-item" style={{ justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><Cpu size={14} className="icon" /> CPU</span>
                      <span style={{ fontWeight: 600 }}>{isOnline && metrics ? `${metrics.cpu}%` : '--'}</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className={`progress-bar-fill ${metrics && metrics.cpu > 80 ? 'high' : metrics && metrics.cpu > 50 ? 'med' : ''}`} style={{ width: `${isOnline && metrics ? metrics.cpu : 0}%` }}></div>
                    </div>
                  </div>
                  
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className="remoto-stat-item" style={{ justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><HardDrive size={14} className="icon" /> RAM</span>
                      <span style={{ fontWeight: 600 }}>{isOnline && metrics ? `${metrics.ram}%` : '--'}</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className={`progress-bar-fill ${metrics && metrics.ram > 85 ? 'high' : metrics && metrics.ram > 60 ? 'med' : ''}`} style={{ width: `${isOnline && metrics ? metrics.ram : 0}%`, background: '#3b82f6' }}></div>
                    </div>
                  </div>
                </div>

                {}
                {isOnline && (
                  <div className="remoto-card-overlay">
                    <button className="btn-overlay btn-overlay-primary" onClick={() => openStream(client)}>
                      <MousePointer2 size={16} /> Control Remoto
                    </button>
                    <button className="btn-overlay btn-overlay-secondary" onClick={() => sendCommand(client.id, 'reboot')}>
                      <RefreshCw size={16} /> Reiniciar
                    </button>
                    <button className="btn-overlay btn-overlay-danger" onClick={() => sendCommand(client.id, 'shutdown')}>
                      <Power size={16} /> Apagar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table className="data-grid" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Equipo</th>
                <th style={{ padding: '12px 16px' }}>Estado</th>
                <th style={{ padding: '12px 16px' }}>Usuario</th>
                <th style={{ padding: '12px 16px' }}>Uptime</th>
                <th style={{ padding: '12px 16px' }}>CPU</th>
                <th style={{ padding: '12px 16px' }}>RAM</th>
                <th style={{ padding: '12px 16px' }}>Laboratorio</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => {
                const isOnline = client.status === 'online';
                const metrics = client.metrics;
                return (
                  <tr key={client.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Monitor size={16} color={isOnline ? 'var(--primary-color)' : 'gray'} />
                      {client.hostname}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`alert-badge ${isOnline ? 'normal' : ''}`} style={{ background: isOnline ? '#dcfce7' : '#f3f4f6', color: isOnline ? '#166534' : '#4b5563', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {isOnline ? '🟢 En línea' : '⚪ Offline'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{metrics?.user || '--'}</td>
                    <td style={{ padding: '12px 16px', color: metrics?.uptimeHours && metrics.uptimeHours >= 24 ? '#ef4444' : 'var(--text-muted)' }}>
                      {metrics ? formatUptime(metrics.uptimeHours) : '--'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '30px', fontSize: '0.8rem' }}>{metrics ? `${metrics.cpu}%` : '--'}</span>
                        <div style={{ width: '50px', height: '4px', background: 'var(--border-color)', borderRadius: '2px' }}>
                          {metrics && <div style={{ height: '100%', width: `${metrics.cpu}%`, background: metrics.cpu > 80 ? '#ef4444' : 'var(--primary-color)', borderRadius: '2px' }} />}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '30px', fontSize: '0.8rem' }}>{metrics ? `${metrics.ram}%` : '--'}</span>
                        <div style={{ width: '50px', height: '4px', background: 'var(--border-color)', borderRadius: '2px' }}>
                          {metrics && <div style={{ height: '100%', width: `${metrics.ram}%`, background: '#3b82f6', borderRadius: '2px' }} />}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{client.directiva} - {client.grupo}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button 
                        disabled={!isOnline}
                        onClick={() => openStream(client)}
                        style={{ padding: '6px 12px', background: isOnline ? 'var(--primary-color)' : 'var(--bg-hover)', color: isOnline ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: isOnline ? 'pointer' : 'not-allowed', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        Controlar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {}
      {streamData && (
        <div ref={fullscreenContainerRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          
          {}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Monitor size={20} color="#38bdf8" />
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600 }}>
                {clients.find(c => c.id === streamData.clientId)?.hostname || 'Equipo Remoto'}
              </h3>
              <span style={{ background: '#064e3b', color: '#34d399', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} /> ONLINE
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={() => setControlMode(!controlMode)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: controlMode ? '#10b981' : 'transparent', border: `1px solid ${controlMode ? '#10b981' : '#334155'}`, color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}>
                <MousePointer2 size={16} /> {controlMode ? 'Control Activo' : 'Iniciar Control'}
              </button>
              
              <div style={{ width: '1px', height: '24px', background: '#334155', margin: '0 5px' }} />
              
              <button onClick={handleSendFile} disabled={fileSending} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: fileSending ? 'wait' : 'pointer', fontWeight: 600 }}>
                <Upload size={16} /> {fileSending ? 'Enviando...' : 'Archivo'}
              </button>
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={onFileSelected} />

              <button onClick={() => setShowSidebar(!showSidebar)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showSidebar ? '#334155' : 'transparent', border: '1px solid #334155', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                <Info size={16} /> Info
              </button>
              
              <button onClick={toggleFullscreen} style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }} title="Pantalla Completa">
                {isFullscreen ? '🖥️ Salir' : '🖥️ Full'}
              </button>
              
              <button onClick={closeStream} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ef4444', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, marginLeft: '10px' }}>
                <X size={16} /> Cerrar
              </button>
            </div>
          </div>

          {fileSent && (
            <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', padding: '10px 20px', borderRadius: '8px', zIndex: 2000, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, boxShadow: '0 4px 6px rgba(0,0,0,0.3)', border: '1px solid #059669' }}>
              <Upload size={18} /> Archivo '{fileSent}' enviado correctamente
            </div>
          )}

          {}
          <div className="remote-info-bar">
            {(() => {
              const client = clients.find(c => c.id === streamData.clientId);
              const metrics = client?.metrics;
              if (!metrics) return <span style={{ color: '#94a3b8' }}>Cargando métricas...</span>;
              return (
                <>
                  <div className="remote-info-item"><Clock size={14}/> <span className="remote-info-value">Up: {formatUptime(metrics.uptimeHours)}</span></div>
                  <div className="remote-info-item"><UserIcon size={14}/> <span className="remote-info-value">{metrics.user}</span></div>
                  <div className="remote-info-item"><Network size={14}/> <span className="remote-info-value">{client.ip}</span></div>
                  <div className="remote-info-item"><Cpu size={14}/> <span className="remote-info-value">{metrics.cpu}%</span></div>
                  <div className="remote-info-item"><HardDrive size={14}/> <span className="remote-info-value">{metrics.ram}% RAM</span></div>
                  <div className="remote-info-item">
                    <Wifi size={14}/> 
                    <span className="remote-info-value" style={{color: client?.network_type === 'wifi' ? (metrics.wifiSignal && metrics.wifiSignal < 50 ? '#ef4444' : (metrics.wifiSignal && metrics.wifiSignal < 80 ? '#fbbf24' : '#34d399')) : '#94a3b8'}}>
                      {client?.network_type === 'wifi' ? (metrics.wifiSignal ? `${metrics.wifiSignal}%` : 'Calculando...') : 'Cable'}
                    </span>
                  </div>
                  <div className="remote-info-item"><Monitor size={14}/> <span className="remote-info-value">1920x1080</span></div>
                </>
              );
            })()}
          </div>
            
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', position: 'relative' }}>
              {streamData.loading && (
                <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <span>Estableciendo túnel directo (WebRTC)...</span>
                </div>
              )}
              
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  display: streamData.loading ? 'none' : 'block',
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain', 
                  cursor: controlMode ? 'crosshair' : 'default', 
                  touchAction: controlMode ? 'none' : 'auto',
                  outline: 'none'
                }}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onClick={(e) => handleMouseClick(e, 'left')}
                onTouchEnd={(e) => { if (controlMode) { e.preventDefault(); handleMouseClick(e as any, 'left'); } }}
                onContextMenu={(e) => handleMouseClick(e, 'right')}
              />
            </div>

            {}
            {showSidebar && (
              <div className="remote-sidebar">
                {(() => {
                  const client = clients.find(c => c.id === streamData.clientId);
                  const metrics = client?.metrics;
                  if (!client || !metrics) return null;
                  return (
                    <>
                      <div className="remote-sidebar-section">
                        <div className="remote-sidebar-title">Sistema</div>
                        <div className="remote-sidebar-row"><span className="remote-sidebar-label">Nombre</span> <span>{client.hostname}</span></div>
                        <div className="remote-sidebar-row"><span className="remote-sidebar-label">OS</span> <span>{client.extended?.os_version || 'Windows 10'}</span></div>
                        <div className="remote-sidebar-row"><span className="remote-sidebar-label">Usuario Activo</span> <span>{metrics.user}</span></div>
                        <div className="remote-sidebar-row"><span className="remote-sidebar-label">Uptime</span> <span>{formatUptime(metrics.uptimeHours)}</span></div>
                      </div>
                      <div className="remote-sidebar-section">
                        <div className="remote-sidebar-title">Red</div>
                        <div className="remote-sidebar-row"><span className="remote-sidebar-label">IP Local</span> <span>{client.ip}</span></div>
                        <div className="remote-sidebar-row"><span className="remote-sidebar-label">MAC Address</span> <span>{client.extended?.mac || '--'}</span></div>
                        <div className="remote-sidebar-row"><span className="remote-sidebar-label">Conexión</span> <span>{client.network_type === 'wifi' ? 'Wi-Fi' : 'Ethernet'}</span></div>
                      </div>
                      <div className="remote-sidebar-section">
                        <div className="remote-sidebar-title">Hardware</div>
                        <div className="remote-sidebar-row"><span className="remote-sidebar-label">Uso CPU</span> <span>{metrics.cpu}%</span></div>
                        <div className="remote-sidebar-row"><span className="remote-sidebar-label">Uso RAM</span> <span>{metrics.ram}%</span></div>
                        <div className="remote-sidebar-row"><span className="remote-sidebar-label">Disco (C:)</span> <span>{client.extended?.disk_used || '--'}% Usado</span></div>
                      </div>
                      <div className="remote-sidebar-section" style={{ flex: 1 }}>
                        <div className="remote-sidebar-title">Acciones de Sistema</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                          <button onClick={() => sendCommand(client.id, 'reboot')} className="btn-overlay btn-overlay-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                            <RefreshCw size={16} /> Reiniciar Equipo
                          </button>
                          <button onClick={() => sendCommand(client.id, 'shutdown')} className="btn-overlay btn-overlay-danger" style={{ width: '100%', justifyContent: 'flex-start' }}>
                            <Power size={16} /> Apagar Equipo
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
