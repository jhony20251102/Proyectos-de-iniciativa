import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { ChevronRight, ChevronDown, MonitorPlay, Server } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const socket = io(SOCKET_URL);
const API_URL = `${SOCKET_URL}/api`;

type Client = {
  id: string;
  hostname: string;
  directiva: string; 
  grupo: string;     
};

const DEFAULT_SEDES = ['ATE', 'AREQUIPA', 'NORTE', 'SAN JUAN', 'SURCO', 'VILLA', 'Sin Asignar'];

export default function Grupos() {
  const [clients, setClients] = useState<Client[]>([]);
  const [expandedSedes, setExpandedSedes] = useState<Set<string>>(new Set(['Sin Asignar']));
  const [expandedAmbientes, setExpandedAmbientes] = useState<Set<string>>(new Set());

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_URL}/clients`);
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchClients();
    
    const handleClientUpdated = (updatedClient: Client) => {
      setClients(prev => {
        const idx = prev.findIndex(c => c.id === updatedClient.id);
        if (idx >= 0) {
          const newClients = [...prev];
          newClients[idx] = updatedClient;
          return newClients;
        } else {
          return [...prev, updatedClient];
        }
      });
    };

    socket.on('client_updated', handleClientUpdated);
    return () => { socket.off('client_updated', handleClientUpdated); };
  }, []);

  
  const tree: Record<string, Record<string, Client[]>> = {};
  
  
  DEFAULT_SEDES.forEach(sede => {
    tree[sede] = {};
  });
  
  clients.forEach(c => {
    const d = c.directiva || 'Sin Asignar';
    const g = c.grupo || 'Sin Asignar';
    if (!tree[d]) tree[d] = {};
    if (!tree[d][g]) tree[d][g] = [];
    tree[d][g].push(c);
  });

  const toggleSede = (sede: string) => {
    const newSet = new Set(expandedSedes);
    if (newSet.has(sede)) newSet.delete(sede);
    else newSet.add(sede);
    setExpandedSedes(newSet);
  };

  const toggleAmbiente = (ambiente: string) => {
    const newSet = new Set(expandedAmbientes);
    if (newSet.has(ambiente)) newSet.delete(ambiente);
    else newSet.add(ambiente);
    setExpandedAmbientes(newSet);
  };

  return (
    <div className="page-wrapper">
      <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Server size={24} color="var(--primary)" />
        <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Estructura de Sedes y Grupos</h3>
      </div>
      
      <div className="modern-table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Nivel / Entidad</th>
              <th style={{ width: '20%' }}>Cantidad de Equipos</th>
              <th style={{ width: '40%' }}>Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(tree).sort((a, b) => {
              if (a === 'Sin Asignar') return 1;
              if (b === 'Sin Asignar') return -1;
              return a.localeCompare(b);
            }).map(sede => {
              const isSedeExpanded = expandedSedes.has(sede);
              const ambientes = tree[sede];
              const totalEquiposSede = Object.values(ambientes).reduce((acc, current) => acc + current.length, 0);

              return (
                <React.Fragment key={sede}>
                  <tr onClick={() => toggleSede(sede)} style={{ cursor: 'pointer', background: isSedeExpanded ? 'var(--bg-hover)' : 'inherit' }}>
                    <td style={{ fontWeight: 600, color: sede === 'Sin Asignar' ? 'var(--danger)' : 'var(--primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isSedeExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                        {sede}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{totalEquiposSede} {totalEquiposSede === 1 ? 'equipo' : 'equipos'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>Sede Principal</td>
                  </tr>
                  
                  {isSedeExpanded && Object.keys(ambientes).sort().map(ambiente => {
                    const isAmbienteExpanded = expandedAmbientes.has(`${sede}-${ambiente}`);
                    const equipos = ambientes[ambiente];
                    
                    return (
                      <React.Fragment key={`${sede}-${ambiente}`}>
                        <tr onClick={() => toggleAmbiente(`${sede}-${ambiente}`)} style={{ cursor: 'pointer', background: 'var(--bg-card)' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '32px', color: 'var(--text-main)', fontWeight: 500 }}>
                              {isAmbienteExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                              {ambiente}
                            </div>
                          </td>
                          <td>{equipos.length}</td>
                          <td style={{ color: 'var(--text-muted)' }}>Grupo / Ambiente</td>
                        </tr>
                        
                        {isAmbienteExpanded && equipos.sort((a,b) => a.hostname.localeCompare(b.hostname)).map(equipo => (
                          <tr key={equipo.id} style={{ background: 'var(--bg-main)' }}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '64px', color: 'var(--text-muted)' }}>
                                <MonitorPlay size={14} />
                                <span>{equipo.hostname}</span>
                              </div>
                            </td>
                            <td>-</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{equipo.id}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
