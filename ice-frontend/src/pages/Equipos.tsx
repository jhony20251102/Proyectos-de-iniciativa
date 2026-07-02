import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Power, RefreshCw, Snowflake, CheckSquare, Flame, MonitorPlay, Tag, Download, Eye, Trash } from 'lucide-react';
import * as XLSX from 'xlsx';

import type { User } from 'firebase/auth';
import DateTreeFilter from '../components/DateTreeFilter';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const socket = io(SOCKET_URL);
const API_URL = `${SOCKET_URL}/api`;

type Client = {
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
  extended?: {
    ram_total?: string;
    disk_capacity?: string;
    disk_type?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    boot_time?: number;
  };
};

interface EquiposProps {
  user: User;
}

export default function Equipos({ user }: EquiposProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    hostname: '', ip: '', id: '', directiva: '', grupo: '', status: '', version: '', etiquetas: '', is_frozen: '',
    disk_type: '', brand: '', ram_total: '', disk_capacity: '', model: '', serial_number: ''
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>('asc');
  const [selectedLastSeen, setSelectedLastSeen] = useState<{year: number, month: number, day: number}[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [colWidths, setColWidths] = useState<Record<string, number>>({
    hostname: 150, ip: 110, id: 130, directiva: 150, grupo: 130, status: 110, is_frozen: 120,
    version: 100, last_seen: 150, uptime: 120, etiquetas: 130, ram: 110, disk: 130, disk_type: 110, brand: 120, model: 130, serial: 140
  });

  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const startResize = (e: React.MouseEvent, colId: string) => {
    setResizingCol(colId);
    setStartX(e.clientX);
    setStartWidth(colWidths[colId] || 100);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingCol) return;
      const diff = e.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [resizingCol]: Math.max(60, startWidth + diff)
      }));
    };
    const handleMouseUp = () => setResizingCol(null);

    if (resizingCol) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, startX, startWidth]);

  
  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true,
    hostname: true,
    ip: true,
    id: true,
    directiva: true,
    grupo: true,
    status: true,
    is_frozen: true,
    version: true,
    last_seen: true,
    uptime: true,
    etiquetas: false,
    ram: false,
    disk: false,
    disk_type: false,
    brand: false,
    model: false,
    serial: false
  });
  
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_URL}/clients`);
      const data = await res.json();
      setClients(data);
    } catch (e) {
      console.error("Error fetching clients", e);
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

    socket.on('clients_deleted', (deletedIds: string[]) => {
      const deletedSet = new Set(deletedIds);
      setClients(prev => prev.filter(c => !deletedSet.has(c.id)));
      setSelectedIds(prev => {
        const next = new Set(prev);
        deletedIds.forEach(id => next.delete(id));
        return next;
      });
    });

    return () => {
      socket.off('client_updated');
      socket.off('clients_deleted');
    };
  }, []);



  const updateClientField = async (id: string, field: string, value: string) => {
    try {
      await fetch(`${API_URL}/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value, userEmail: user.email })
      });
      setClients(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    } catch (e) {
      console.error("Error updating field", e);
    }
  };

  const handleBatchCommand = async (command: string) => {
    if (selectedIds.size === 0) return;
    
    const commandLabels: Record<string, string> = {
      shutdown: 'APAGAR',
      reboot: 'REINICIAR',
      freeze: 'CONGELAR (Ice Freeze)',
      thaw: 'DESCONGELAR'
    };
    const label = commandLabels[command] || command;
    
    if (!confirm(`⚠️ ¿Estás seguro de que quieres ${label} ${selectedIds.size} equipo(s)?\n\nEsta acción se ejecutará de inmediato.`)) return;
    
    try {
      await fetch(`${API_URL}/clients/batch-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), command, userEmail: user.email })
      });
    } catch (e) {
      console.error("Error sending batch command", e);
    }
    
    setSelectedIds(new Set());
  };

  const handleBatchUpdateField = async (field: 'directiva' | 'grupo', value: string) => {
    if (selectedIds.size === 0 || !value) return;
    const label = field === 'directiva' ? 'SEDE' : 'GRUPO (AMBIENTE)';
    
    if (!confirm(`⚠️ ¿Estás seguro de asignar ${label} "${value}" a ${selectedIds.size} equipo(s)?`)) {
      return;
    }
    
    try {
      await Promise.all(Array.from(selectedIds).map(id => 
        fetch(`${API_URL}/clients/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value, userEmail: user.email })
        })
      ));
      
      setClients(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, [field]: value } : c));
      setSelectedIds(new Set());
    } catch (e) {
      console.error("Error bulk updating", e);
      alert("Hubo un error al actualizar masivamente.");
    }
  };

  const handleBatchDeleteClients = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`⚠️ ¿Estás seguro de que quieres ELIMINAR permanentemente ${selectedIds.size} equipo(s)?\n\nEsta acción no se puede deshacer y los equipos desaparecerán de la consola.`)) {
      return;
    }

    try {
      const idsArray = Array.from(selectedIds);
      const res = await fetch(`${API_URL}/clients/batch-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsArray, userEmail: user.email })
      });
      
      if (res.ok) {
        setClients(prev => prev.filter(c => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'No se pudo eliminar los equipos'}`);
      }
    } catch (e) {
      console.error("Error deleting clients", e);
      alert("Ocurrió un error al intentar eliminar los equipos.");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredClients.length && filteredClients.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClients.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const uniqueVersions = Array.from(new Set(clients.map(c => c.version).filter(Boolean))).sort();
  const DEFAULT_SEDES = ['ATE', 'AREQUIPA', 'NORTE', 'SAN JUAN', 'SURCO', 'VILLA'];
  const uniqueDirectivas = Array.from(new Set([...DEFAULT_SEDES, ...clients.map(c => c.directiva).filter(Boolean)])).sort();
  const uniqueGrupos = Array.from(new Set(clients.map(c => c.grupo).filter(Boolean))).sort();
  const uniqueDiskTypes = Array.from(new Set(clients.map(c => c.extended?.disk_type).filter(Boolean))).sort();
  const uniqueBrands = Array.from(new Set(clients.map(c => c.extended?.brand).filter(Boolean))).sort();
  const uniqueRams = Array.from(new Set(clients.map(c => c.extended?.ram_total).filter(Boolean))).sort();

  const formatLastSeen = (dateString: string) => {
    if (!dateString) return 'Desconocido';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute:'2-digit', second: '2-digit' 
    });
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const formatUptime = (bootTimeMs?: number) => {
    if (!bootTimeMs) return '-';
    const diffMs = Date.now() - bootTimeMs;
    if (diffMs < 0) return '-';
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / 1000 / 60) % 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const exportToExcel = () => {
    const listToExport = selectedIds.size > 0 
      ? filteredClients.filter(c => selectedIds.has(c.id)) 
      : filteredClients;

    const headers = [
      'Hostname', 'IP', 'ID (MAC)', 'Directiva', 'Grupo', 'Estado', 'Tiempo Prendido', 'Último Visto', 'Ice Freeze', 'Versión', 'Etiquetas', 'Memoria RAM', 'Disco', 'Tipo Disco', 'Marca', 'Modelo', 'Serial'
    ];
    
    const rows = listToExport.map(c => [
      c.hostname,
      c.ip,
      c.id,
      c.directiva,
      c.grupo,
      c.status === 'online' ? 'Conectado' : 'Desconectado',
      formatUptime(c.extended?.boot_time),
      formatLastSeen(c.last_seen),
      c.is_frozen ? 'Congelado' : 'Descongelado',
      c.version,
      c.etiquetas || '',
      c.extended?.ram_total || '',
      c.extended?.disk_capacity || '',
      c.extended?.disk_type || '',
      c.extended?.brand || '',
      c.extended?.model || '',
      c.extended?.serial_number || ''
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Equipos");
    
    XLSX.writeFile(workbook, `equipos_ice_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredClients = clients.filter(c => {
    let dateMatches = true;
    if (selectedLastSeen && c.last_seen) {
      const d = new Date(c.last_seen);
      if (!isNaN(d.getTime())) {
        dateMatches = selectedLastSeen.some(ymd => ymd.year === d.getFullYear() && ymd.month === d.getMonth() && ymd.day === d.getDate());
      } else {
        dateMatches = false;
      }
    } else if (selectedLastSeen && !c.last_seen) {
      dateMatches = false;
    }

    return (
      dateMatches &&
      (c.hostname || '').toLowerCase().includes(filters.hostname.toLowerCase()) &&
      (c.ip || '').toLowerCase().includes(filters.ip.toLowerCase()) &&
      (c.id || '').toLowerCase().includes(filters.id.toLowerCase()) &&
      (filters.directiva === '' || c.directiva === filters.directiva) &&
      (filters.grupo === '' || c.grupo === filters.grupo) &&
      (c.status || '').toLowerCase().includes(filters.status.toLowerCase()) &&
      (filters.is_frozen === '' || String(c.is_frozen) === filters.is_frozen) &&
      (filters.version === '' || c.version === filters.version) &&
      (c.etiquetas || '').toLowerCase().includes(filters.etiquetas.toLowerCase()) &&
      (filters.disk_type === '' || c.extended?.disk_type === filters.disk_type) &&
      (filters.brand === '' || c.extended?.brand === filters.brand) &&
      (filters.ram_total === '' || c.extended?.ram_total === filters.ram_total) &&
      (filters.disk_capacity === '' || (c.extended?.disk_capacity || '').toLowerCase().includes(filters.disk_capacity.toLowerCase())) &&
      (filters.model === '' || (c.extended?.model || '').toLowerCase().includes(filters.model.toLowerCase())) &&
      (filters.serial_number === '' || (c.extended?.serial_number || '').toLowerCase().includes(filters.serial_number.toLowerCase()))
    );
  });

  if (sortOrder) {
    filteredClients.sort((a, b) => {
      const nameA = a.hostname || '';
      const nameB = b.hostname || '';
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }

  return (
    <div className="page-wrapper" onClick={() => setShowColumnMenu(false)}>
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div className="toolbar-actions">
          <button className="btn btn-action" onClick={fetchClients} title="Actualizar datos">
            <RefreshCw size={16} /> Actualizar
          </button>
          <div className="divider"></div>
          <button className="btn btn-action" disabled={selectedIds.size === 0} onClick={() => handleBatchCommand('shutdown')}>
            <Power size={16} /> Apagar
          </button>
          <button className="btn btn-action" disabled={selectedIds.size === 0} onClick={() => handleBatchCommand('reboot')}>
            <RefreshCw size={16} /> Reiniciar
          </button>
          <div className="divider"></div>
          <button className="btn btn-action" disabled={selectedIds.size === 0} onClick={() => handleBatchCommand('freeze')}>
            <Snowflake size={16} /> Ice Freeze (Congelar)
          </button>
          <button className="btn btn-action" disabled={selectedIds.size === 0} onClick={() => handleBatchCommand('thaw')}>
            <Flame size={16} /> Descongelar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Tag size={16} style={{ color: 'var(--text-muted)' }} />
            <select 
              className="modern-column-filter" 
              style={{ width: '160px', padding: '0.4rem', borderRadius: '6px', cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed' }}
              value=""
              disabled={selectedIds.size === 0}
              onChange={e => {
                const val = e.target.value;
                if (!val) return;
                if (val === 'CREAR_NUEVO') {
                  const newVal = prompt('Escribe la nueva SEDE a asignar (ej. Certus Ate):');
                  if (newVal) handleBatchUpdateField('directiva', newVal.trim());
                } else {
                  handleBatchUpdateField('directiva', val);
                }
                e.target.value = '';
              }}
            >
              <option value="">Asignar SEDE...</option>
              {uniqueDirectivas.map(d => <option key={d} value={d}>{d}</option>)}
              <option value="CREAR_NUEVO">➕ Crear nueva Sede...</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Tag size={16} style={{ color: 'var(--text-muted)' }} />
            <select 
              className="modern-column-filter" 
              style={{ width: '180px', padding: '0.4rem', borderRadius: '6px', cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed' }}
              value=""
              disabled={selectedIds.size === 0}
              onChange={e => {
                const val = e.target.value;
                if (!val) return;
                
                // Validar que todos tengan SEDE asignada primero
                const selectedClients = clients.filter(c => selectedIds.has(c.id));
                const missingSede = selectedClients.some(c => !c.directiva || c.directiva === 'Sin Asignar');
                
                if (missingSede) {
                  alert('⚠️ Por favor, asigna primero una SEDE a los equipos seleccionados antes de asignarles un Grupo (Ambiente).');
                  e.target.value = '';
                  return;
                }

                if (val === 'CREAR_NUEVO') {
                  const newVal = prompt('Escribe el nuevo GRUPO a asignar (ej. Lab 1):');
                  if (newVal) handleBatchUpdateField('grupo', newVal.trim());
                } else {
                  handleBatchUpdateField('grupo', val);
                }
                e.target.value = '';
              }}
            >
              <option value="">Asignar GRUPO...</option>
              {uniqueGrupos.map(g => <option key={g} value={g}>{g}</option>)}
              <option value="CREAR_NUEVO">➕ Crear nuevo Grupo...</option>
            </select>
          </div>
          {user.email === 'rickysedano1@gmail.com' && (
            <>
              <div className="divider"></div>
              <button className="btn btn-action btn-danger" disabled={selectedIds.size === 0} onClick={handleBatchDeleteClients}>
                <Trash size={16} /> Eliminar
              </button>
            </>
          )}
        </div>

        <div className="toolbar-actions" style={{ position: 'relative' }}>
          <button className="btn btn-action" onClick={(e) => { e.stopPropagation(); setShowColumnMenu(!showColumnMenu); }}>
            <Eye size={16} /> Columnas
          </button>
          {showColumnMenu && (
            <div className="column-dropdown" style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', zIndex: 100, minWidth: '150px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginTop: '5px' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}>Ver Columnas</div>
              {Object.keys(visibleColumns).map(key => {
                if(key === 'checkbox') return null;
                const labelMap: Record<string, string> = {
                  hostname: 'NOMBRE DE EQUIPO',
                  ip: 'IP',
                  id: 'ID (MAC)',
                  directiva: 'SEDE',
                  grupo: 'GRUPO (AMBIENTE)',
                  status: 'ESTADO',
                  is_frozen: 'ICE FREEZE',
                  version: 'VERSIÓN',
                  last_seen: 'ÚLTIMO VISTO',
                  uptime: 'TIEMPO PRENDIDO',
                  etiquetas: 'ETIQUETAS',
                  ram: 'MEMORIA RAM',
                  disk: 'CAPACIDAD DISCO',
                  disk_type: 'TIPO DE DISCO',
                  brand: 'MARCA',
                  model: 'MODELO',
                  serial: 'N° DE SERIE'
                };
                return (
                  <label key={key} style={{ display: 'block', margin: '5px 0', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={visibleColumns[key as keyof typeof visibleColumns]} onChange={() => toggleColumn(key as keyof typeof visibleColumns)} style={{ marginRight: '8px' }}/>
                    {labelMap[key] || key.replace('_', ' ').toUpperCase()}
                  </label>
                );
              })}
            </div>
          )}
          
          <button className="btn btn-action" onClick={exportToExcel} title="Exportar seleccionados o todos a Excel">
            <Download size={16} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="modern-table-container" style={{ marginBottom: '2rem' }}>
        <table className="modern-table" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              {visibleColumns.checkbox && (
                <th className="col-checkbox">
                  <div 
                    className={`checkbox ${selectedIds.size > 0 && selectedIds.size === filteredClients.length ? 'checked' : ''} ${selectedIds.size > 0 && selectedIds.size < filteredClients.length ? 'indeterminate' : ''}`}
                    onClick={toggleSelectAll}
                  >
                    {selectedIds.size > 0 && <CheckSquare size={16} />}
                  </div>
                </th>
              )}
              {visibleColumns.hostname && (
                <th style={{ width: colWidths.hostname || 150, minWidth: colWidths.hostname || 150 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'}}>
                      Nombre de equipo {sortOrder === 'asc' ? '↑' : sortOrder === 'desc' ? '↓' : ''}
                    </div>
                    <input type="text" className="modern-column-filter" placeholder="Filtrar..." value={filters.hostname} onChange={e => handleFilterChange('hostname', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div className={`resizer ${resizingCol === 'hostname' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'hostname')} />
                </th>
              )}
              {visibleColumns.ip && (
                <th style={{ width: colWidths.ip || 110, minWidth: colWidths.ip || 110 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>IP</div>
                    <input type="text" className="modern-column-filter" placeholder="Filtrar..." value={filters.ip} onChange={e => handleFilterChange('ip', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div className={`resizer ${resizingCol === 'ip' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'ip')} />
                </th>
              )}
              {visibleColumns.id && (
                <th style={{ width: colWidths.id || 130, minWidth: colWidths.id || 130 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>ID (MAC)</div>
                    <input type="text" className="modern-column-filter" placeholder="Filtrar..." value={filters.id} onChange={e => handleFilterChange('id', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div className={`resizer ${resizingCol === 'id' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'id')} />
                </th>
              )}
              {visibleColumns.directiva && (
                <th style={{ width: colWidths.directiva || 150, minWidth: colWidths.directiva || 150 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>SEDE</div>
                    <select className="modern-column-filter" value={filters.directiva} onChange={e => handleFilterChange('directiva', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                      <option value="">Todas</option>
                      {uniqueDirectivas.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className={`resizer ${resizingCol === 'directiva' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'directiva')} />
                </th>
              )}
              {visibleColumns.grupo && (
                <th style={{ width: colWidths.grupo || 130, minWidth: colWidths.grupo || 130 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Grupo (Ambiente)</div>
                    <select className="modern-column-filter" value={filters.grupo} onChange={e => handleFilterChange('grupo', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                      <option value="">Todos</option>
                      {uniqueGrupos.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className={`resizer ${resizingCol === 'grupo' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'grupo')} />
                </th>
              )}
              {visibleColumns.status && (
                <th style={{ width: colWidths.status || 110, minWidth: colWidths.status || 110 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Estado</div>
                    <select className="modern-column-filter" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                      <option value="">Todos</option>
                      <option value="online">Conectado</option>
                      <option value="offline">Desconectado</option>
                    </select>
                  </div>
                  <div className={`resizer ${resizingCol === 'status' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'status')} />
                </th>
              )}
              {visibleColumns.is_frozen && (
                <th style={{ width: colWidths.is_frozen || 120, minWidth: colWidths.is_frozen || 120 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Ice Freeze</div>
                    <select className="modern-column-filter" value={filters.is_frozen} onChange={e => handleFilterChange('is_frozen', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                      <option value="">Todos</option>
                      <option value="true">Congelado</option>
                      <option value="false">Descongelado</option>
                    </select>
                  </div>
                  <div className={`resizer ${resizingCol === 'is_frozen' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'is_frozen')} />
                </th>
              )}
              {visibleColumns.version && (
                <th style={{ width: colWidths.version || 100, minWidth: colWidths.version || 100 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Versión</div>
                    <select className="modern-column-filter" value={filters.version} onChange={e => handleFilterChange('version', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                      <option value="">Todas</option>
                      {uniqueVersions.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className={`resizer ${resizingCol === 'version' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'version')} />
                </th>
              )}
              {visibleColumns.last_seen && (
                <th style={{ width: colWidths.last_seen || 150, minWidth: colWidths.last_seen || 150 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Último Visto</div>
                    <DateTreeFilter 
                      dates={clients.map(c => c.last_seen || '')} 
                      onFilterChange={setSelectedLastSeen} 
                    />
                  </div>
                  <div className={`resizer ${resizingCol === 'last_seen' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'last_seen')} />
                </th>
              )}
              {visibleColumns.uptime && (
                <th style={{ width: colWidths.uptime || 120, minWidth: colWidths.uptime || 120 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Tiempo Prendido</div>
                  </div>
                  <div className={`resizer ${resizingCol === 'uptime' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'uptime')} />
                </th>
              )}
              {visibleColumns.etiquetas && (
                <th style={{ width: colWidths.etiquetas || 130, minWidth: colWidths.etiquetas || 130 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Etiqueta</div>
                    <input type="text" className="modern-column-filter" placeholder="Filtrar..." value={filters.etiquetas} onChange={e => handleFilterChange('etiquetas', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div className={`resizer ${resizingCol === 'etiquetas' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'etiquetas')} />
                </th>
              )}
              {visibleColumns.ram && (
                <th style={{ width: colWidths.ram || 110, minWidth: colWidths.ram || 110 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Memoria RAM</div>
                    <select className="modern-column-filter" value={filters.ram_total} onChange={e => handleFilterChange('ram_total', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                      <option value="">Todas</option>
                      {uniqueRams.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className={`resizer ${resizingCol === 'ram' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'ram')} />
                </th>
              )}
              {visibleColumns.disk && (
                <th style={{ width: colWidths.disk || 130, minWidth: colWidths.disk || 130 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Capacidad Disco</div>
                    <input type="text" className="modern-column-filter" placeholder="Filtrar..." value={filters.disk_capacity} onChange={e => handleFilterChange('disk_capacity', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div className={`resizer ${resizingCol === 'disk' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'disk')} />
                </th>
              )}
              {visibleColumns.disk_type && (
                <th style={{ width: colWidths.disk_type || 110, minWidth: colWidths.disk_type || 110 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Tipo de Disco</div>
                    <select className="modern-column-filter" value={filters.disk_type} onChange={e => handleFilterChange('disk_type', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                      <option value="">Todos</option>
                      {uniqueDiskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className={`resizer ${resizingCol === 'disk_type' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'disk_type')} />
                </th>
              )}
              {visibleColumns.brand && (
                <th style={{ width: colWidths.brand || 120, minWidth: colWidths.brand || 120 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Marca</div>
                    <select className="modern-column-filter" value={filters.brand} onChange={e => handleFilterChange('brand', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                      <option value="">Todas</option>
                      {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className={`resizer ${resizingCol === 'brand' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'brand')} />
                </th>
              )}
              {visibleColumns.model && (
                <th style={{ width: colWidths.model || 130, minWidth: colWidths.model || 130 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Modelo</div>
                    <input type="text" className="modern-column-filter" placeholder="Filtrar..." value={filters.model} onChange={e => handleFilterChange('model', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div className={`resizer ${resizingCol === 'model' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'model')} />
                </th>
              )}
              {visibleColumns.serial && (
                <th style={{ width: colWidths.serial || 140, minWidth: colWidths.serial || 140 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>N° de Serie</div>
                    <input type="text" className="modern-column-filter" placeholder="Filtrar..." value={filters.serial_number} onChange={e => handleFilterChange('serial_number', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div className={`resizer ${resizingCol === 'serial' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'serial')} />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={11} className="empty-state">No se encontraron equipos registrados</td>
              </tr>
            ) : (
              (() => {
                const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
                const safePage = Math.min(currentPage, totalPages || 1);
                const startIdx = (safePage - 1) * itemsPerPage;
                const paginatedClients = filteredClients.slice(startIdx, startIdx + itemsPerPage);
                return paginatedClients.map(client => {
                  const isSelected = selectedIds.has(client.id);
                  return (
                    <tr key={client.id} className={isSelected ? 'selected' : ''} onClick={() => toggleSelect(client.id)}>
                      {visibleColumns.checkbox && (
                        <td className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                          <div className={`checkbox ${isSelected ? 'checked' : ''}`} onClick={() => toggleSelect(client.id)}>
                            {isSelected && <CheckSquare size={16} />}
                          </div>
                        </td>
                      )}
                      {visibleColumns.hostname && (
                        <td className="col-hostname">
                          <div className="hostname-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MonitorPlay size={16} className="text-muted"/> 
                            <a href={`/equipos/${client.id}`} style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}>{client.hostname}</a>
                            <a href={`/equipos/${client.id}`} style={{ color: '#3b82f6', display: 'flex', alignItems: 'center' }} title="Ver detalles">
                              <Eye size={16} />
                            </a>
                          </div>
                        </td>
                      )}
                      {visibleColumns.ip && (
                        <td className="text-muted">{client.ip}</td>
                      )}
                      {visibleColumns.id && (
                        <td className="text-muted" style={{ fontSize: '0.85em' }}>{client.id}</td>
                      )}
                      {visibleColumns.directiva && (
                        <td className="col-editable" onClick={(e) => e.stopPropagation()}>
                          <select value={client.directiva || 'Sin Asignar'} onChange={(e) => updateClientField(client.id, 'directiva', e.target.value)}>
                            <option value="Sin Asignar">Sin Asignar</option>
                            {uniqueDirectivas.filter(d => d !== 'Sin Asignar').map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </td>
                      )}
                      {visibleColumns.grupo && (
                        <td className="col-editable" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text" 
                            defaultValue={client.grupo} 
                            onBlur={(e) => {
                              if (e.target.value !== client.grupo) {
                                updateClientField(client.id, 'grupo', e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                            placeholder="Ej. ATELAB03"
                            className="inline-input"
                          />
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="col-status">
                          {client.status === 'online' ? 
                            <span className="status-text online">Conectado</span> : 
                            <span className="status-text offline">Desconectado</span>
                          }
                        </td>
                      )}
                      {visibleColumns.is_frozen && (
                        <td className="col-uwf">
                          {client.is_frozen ? 
                            <span className="status-text online">Congelado</span> : 
                            <span className="status-text warning">Descongelado</span>
                          }
                        </td>
                      )}
                      {visibleColumns.version && (
                        <td className="col-version text-muted">{client.version}</td>
                      )}
                      {visibleColumns.last_seen && (
                        <td className="col-lastseen text-muted">{formatLastSeen(client.last_seen)}</td>
                      )}
                      {visibleColumns.uptime && (
                        <td className="col-uptime text-muted">{formatUptime(client.extended?.boot_time)}</td>
                      )}
                      {visibleColumns.etiquetas && (
                        <td className="col-editable" onClick={(e) => e.stopPropagation()}>
                           <div className="label-cell">
                             <Tag size={12} className="text-muted"/>
                             <input 
                              type="text" 
                              defaultValue={client.etiquetas || ''} 
                              onBlur={(e) => {
                                if (e.target.value !== (client.etiquetas || '')) {
                                  updateClientField(client.id, 'etiquetas', e.target.value);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              }}
                              placeholder="Etiqueta..."
                              className="inline-input"
                            />
                           </div>
                        </td>
                      )}
                      {visibleColumns.ram && (
                        <td className="text-muted">{client.extended?.ram_total || ''}</td>
                      )}
                      {visibleColumns.disk && (
                        <td className="text-muted">{client.extended?.disk_capacity || ''}</td>
                      )}
                      {visibleColumns.disk_type && (
                        <td className="text-muted">{client.extended?.disk_type || ''}</td>
                      )}
                      {visibleColumns.brand && (
                        <td className="text-muted">{client.extended?.brand || ''}</td>
                      )}
                      {visibleColumns.model && (
                        <td className="text-muted">{client.extended?.model || ''}</td>
                      )}
                      {visibleColumns.serial && (
                        <td className="text-muted">{client.extended?.serial_number || ''}</td>
                      )}
                    </tr>
                  );
                });
              })()
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredClients.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', borderRadius: '0 0 8px 8px', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Mostrar</span>
            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.85rem' }}>
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>equipos por página</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredClients.length)}-{Math.min(currentPage * itemsPerPage, filteredClients.length)} de {filteredClients.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="btn btn-action" disabled={currentPage <= 1} onClick={() => setCurrentPage(1)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>«</button>
            <button className="btn btn-action" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>‹ Anterior</button>
            <span style={{ padding: '0 10px' }}>Página {currentPage} de {Math.ceil(filteredClients.length / itemsPerPage)}</span>
            <button className="btn btn-action" disabled={currentPage >= Math.ceil(filteredClients.length / itemsPerPage)} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Siguiente ›</button>
            <button className="btn btn-action" disabled={currentPage >= Math.ceil(filteredClients.length / itemsPerPage)} onClick={() => setCurrentPage(Math.ceil(filteredClients.length / itemsPerPage))} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
