import { useEffect, useState } from 'react';
import { Trash, CheckSquare, Eye, Download } from 'lucide-react';
import DateTreeFilter from '../components/DateTreeFilter';
import type { User } from 'firebase/auth';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:3000/api';

type HistoryLog = {
  id: string;
  action: string;
  userEmail: string;
  targetId: string;
  timestamp: string;
  details: string;
  status?: string;
  completedAt?: string;
  targetList?: string[];
};

interface HistorialProps {
  user: User;
}

export default function Historial({ user }: HistorialProps) {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    userEmail: '',
    action: '',
    targetId: '',
    details: '',
    status: ''
  });
  const [selectedTimestamp, setSelectedTimestamp] = useState<{year: number, month: number, day: number}[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTargetList, setSelectedTargetList] = useState<{title: string, list: string[]} | null>(null);

  const [colWidths, setColWidths] = useState<Record<string, number>>({
    timestamp: 160, userEmail: 200, action: 150, targetId: 150, details: 250, status: 120, completedAt: 160
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

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true,
    timestamp: true,
    userEmail: true,
    action: true,
    targetId: true,
    details: true,
    status: true,
    completedAt: true
  });

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const isSuperAdmin = user?.email === 'rickysedano1@gmail.com';

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/history`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const filteredLogs = logs.filter(log => {
    if (filters.userEmail && log.userEmail !== filters.userEmail) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.targetId && log.targetId !== filters.targetId) return false;
    if (filters.details && log.details !== filters.details) return false;
    if (filters.status && log.status !== filters.status) return false;
    if (selectedTimestamp && selectedTimestamp.length > 0) {
      const logDate = new Date(log.timestamp);
      const match = selectedTimestamp.some(st => 
        logDate.getFullYear() === st.year && 
        logDate.getMonth() === st.month && 
        logDate.getDate() === st.day
      );
      if (!match) return false;
    }
    return true;
  });

  const uniqueUsers = Array.from(new Set(logs.map(l => l.userEmail).filter(Boolean)));
  const uniqueActions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)));
  const uniqueTargets = Array.from(new Set(logs.map(l => l.targetId).filter(Boolean)));
  const uniqueDetails = Array.from(new Set(logs.map(l => l.details).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(logs.map(l => l.status).filter(Boolean)));

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIdx, startIdx + itemsPerPage);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLogs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLogs.map(l => l.id)));
    }
  };

  const handleBatchDeleteLogs = async () => {
    if (window.confirm('¿Eliminar seleccionados?')) {
      try {
        await fetch(`${API_URL}/history/batch-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selectedIds), userEmail: user?.email })
        });
        setSelectedIds(new Set());
        fetchLogs();
      } catch (error) {
        console.error("Error eliminando historial en batch:", error);
      }
    }
  };

  const handleClearAllLogs = async () => {
    if (window.confirm('¿Vaciar TODO el historial?')) {
      try {
        await fetch(`${API_URL}/history/clear-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: user?.email })
        });
        fetchLogs();
      } catch (error) {
        console.error("Error limpiando historial:", error);
      }
    }
  };

  const exportToExcel = () => {
    const headers = ['Fecha y Hora', 'Usuario', 'Acción', 'Target', 'Detalles', 'Estado', 'Completado'];
    const rows = filteredLogs.map(log => [
      formatDate(log.timestamp),
      log.userEmail,
      log.action,
      log.targetId,
      log.details,
      log.status || '',
      log.completedAt ? formatDate(log.completedAt) : ''
    ]);
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");
    
    XLSX.writeFile(workbook, "historial.xlsx");
  };

  return (
    <div className="page-wrapper">
      <div className="toolbar">
        <h2>Historial de Auditoría</h2>
        
        <div className="toolbar-actions" style={{ position: 'relative' }}>
          {isSuperAdmin && (
            <>
              <button className="btn btn-action btn-danger" disabled={selectedIds.size === 0} onClick={handleBatchDeleteLogs}>
                <Trash size={16} /> Eliminar Seleccionados
              </button>
              <button className="btn btn-action btn-danger" onClick={handleClearAllLogs}>
                <Trash size={16} /> Vaciar Historial
              </button>
              <div className="divider"></div>
            </>
          )}
          <button className="btn btn-action" onClick={(e) => { e.stopPropagation(); setShowColumnMenu(!showColumnMenu); }}>
            <Eye size={16} /> Columnas
          </button>
          {showColumnMenu && (
            <div className="column-dropdown" style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', zIndex: 100, minWidth: '150px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginTop: '5px' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}>Ver Columnas</div>
              {Object.keys(visibleColumns).map(key => {
                if(key === 'checkbox') return null;
                const labelMap: Record<string, string> = {
                  timestamp: 'FECHA Y HORA',
                  userEmail: 'USUARIO (EMAIL)',
                  action: 'ACCIÓN REALIZADA',
                  targetId: 'EQUIPO / TARGET',
                  details: 'DETALLES ADICIONALES',
                  status: 'ESTADO',
                  completedAt: 'COMPLETADO EN'
                };
                return (
                  <label key={key} style={{ display: 'block', margin: '5px 0', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={visibleColumns[key as keyof typeof visibleColumns]} onChange={() => toggleColumn(key as keyof typeof visibleColumns)} style={{ marginRight: '8px' }}/>
                    {labelMap[key]}
                  </label>
                );
              })}
            </div>
          )}
          
          <button className="btn btn-action" onClick={exportToExcel} title="Exportar historial a Excel">
            <Download size={16} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="modern-table-container" style={{ marginBottom: '2rem' }}>
        {loading ? (
          <div className="empty-state">Cargando historial...</div>
        ) : (
          <table className="modern-table" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                {isSuperAdmin && visibleColumns.checkbox && (
                  <th className="col-checkbox">
                    <div 
                      className={`checkbox ${selectedIds.size > 0 && selectedIds.size === filteredLogs.length ? 'checked' : ''} ${selectedIds.size > 0 && selectedIds.size < filteredLogs.length ? 'indeterminate' : ''}`}
                      onClick={toggleSelectAll}
                    >
                      {selectedIds.size > 0 && <CheckSquare size={16} />}
                    </div>
                  </th>
                )}
                {visibleColumns.timestamp && (
                  <th style={{ width: colWidths.timestamp || 160, minWidth: colWidths.timestamp || 160 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>Fecha y Hora</div>
                      <DateTreeFilter 
                        dates={logs.map(l => l.timestamp || '')} 
                        onFilterChange={setSelectedTimestamp} 
                      />
                    </div>
                    <div className={`resizer ${resizingCol === 'timestamp' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'timestamp')} />
                  </th>
                )}
                {visibleColumns.userEmail && (
                  <th style={{ width: colWidths.userEmail || 200, minWidth: colWidths.userEmail || 200 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>Usuario (Email)</div>
                      <select className="modern-column-filter" value={filters.userEmail} onChange={e => handleFilterChange('userEmail', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                        <option value="">Todos</option>
                        {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className={`resizer ${resizingCol === 'userEmail' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'userEmail')} />
                  </th>
                )}
                {visibleColumns.action && (
                  <th style={{ width: colWidths.action || 150, minWidth: colWidths.action || 150 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>Acción Realizada</div>
                      <select className="modern-column-filter" value={filters.action} onChange={e => handleFilterChange('action', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                        <option value="">Todas</option>
                        {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div className={`resizer ${resizingCol === 'action' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'action')} />
                  </th>
                )}
                {visibleColumns.targetId && (
                  <th style={{ width: colWidths.targetId || 150, minWidth: colWidths.targetId || 150 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>Equipo / Target</div>
                      <select className="modern-column-filter" value={filters.targetId} onChange={e => handleFilterChange('targetId', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                        <option value="">Todos</option>
                        {uniqueTargets.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className={`resizer ${resizingCol === 'targetId' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'targetId')} />
                  </th>
                )}
                {visibleColumns.details && (
                  <th style={{ width: colWidths.details || 250, minWidth: colWidths.details || 250 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>Detalles Adicionales</div>
                      <select className="modern-column-filter" value={filters.details} onChange={e => handleFilterChange('details', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                        <option value="">Todos</option>
                        {uniqueDetails.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className={`resizer ${resizingCol === 'details' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'details')} />
                  </th>
                )}
                {visibleColumns.status && (
                  <th style={{ width: colWidths.status || 120, minWidth: colWidths.status || 120 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>Estado</div>
                      <select className="modern-column-filter" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                        <option value="">Todos</option>
                        {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className={`resizer ${resizingCol === 'status' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'status')} />
                  </th>
                )}
                {visibleColumns.completedAt && (
                  <th style={{ width: colWidths.completedAt || 160, minWidth: colWidths.completedAt || 160 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>Completado en</div>
                    </div>
                    <div className={`resizer ${resizingCol === 'completedAt' ? 'isResizing' : ''}`} onMouseDown={(e) => startResize(e, 'completedAt')} />
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 8 : 7} className="empty-state">No hay registros en el historial</td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => (
                  <tr key={log.id || index} className={selectedIds.has(log.id) ? 'selected' : ''}>
                    {isSuperAdmin && visibleColumns.checkbox && (
                      <td className="col-checkbox">
                        <div 
                          className={`checkbox ${selectedIds.has(log.id) ? 'checked' : ''}`}
                          onClick={() => toggleSelect(log.id)}
                        >
                          {selectedIds.has(log.id) && <CheckSquare size={16} />}
                        </div>
                      </td>
                    )}
                    {visibleColumns.timestamp && (
                      <td className="text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDate(log.timestamp)}</td>
                    )}
                    {visibleColumns.userEmail && (
                      <td style={{fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={log.userEmail}>{log.userEmail || 'Desconocido'}</td>
                    )}
                    {visibleColumns.action && (
                      <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span className="status-text warning">{log.action}</span></td>
                    )}
                    {visibleColumns.targetId && (
                      <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.targetId}>
                        {log.targetId}
                        {log.targetList && log.targetList.length > 0 && (
                          <button 
                            className="btn btn-action ml-2" 
                            style={{ padding: '2px 6px', fontSize: '0.75rem', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setSelectedTargetList({ title: log.targetId, list: log.targetList || [] })}
                            title="Ver lista de equipos"
                          >
                            <Eye size={12} /> Ver
                          </button>
                        )}
                      </td>
                    )}
                    {visibleColumns.details && (
                      <td className="text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.details}>{log.details}</td>
                    )}
                    {visibleColumns.status && (
                      <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span className={`status-text ${log.status === 'Completado' ? 'success' : log.status === 'Fallido' ? 'danger' : 'warning'}`}>
                          {log.status || 'Pendiente'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.completedAt && (
                      <td className="text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.completedAt ? formatDate(log.completedAt) : '-'}</td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {}
      {filteredLogs.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', borderRadius: '0 0 8px 8px', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Mostrar</span>
            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.85rem' }}>
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>registros por página</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Mostrando {Math.min(startIdx + 1, filteredLogs.length)}-{Math.min(startIdx + itemsPerPage, filteredLogs.length)} de {filteredLogs.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="btn btn-action" disabled={safePage <= 1} onClick={() => setCurrentPage(1)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>«</button>
            <button className="btn btn-action" disabled={safePage <= 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>‹ Anterior</button>
            <span style={{ padding: '0 10px' }}>Página {safePage} de {totalPages}</span>
            <button className="btn btn-action" disabled={safePage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Siguiente ›</button>
            <button className="btn btn-action" disabled={safePage >= totalPages} onClick={() => setCurrentPage(totalPages)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>»</button>
          </div>
        </div>
      )}

      {}
      {selectedTargetList && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }} onClick={() => setSelectedTargetList(null)}>
          <div style={{
            backgroundColor: 'var(--bg-color, #1e1e2e)', border: '1px solid var(--border-color)', borderRadius: '8px',
            width: '90%', maxWidth: '550px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Equipos Objetivo ({selectedTargetList.title})</h3>
              <button onClick={() => setSelectedTargetList(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </div>
            <div style={{ padding: '16px', overflowY: 'auto' }}>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-muted)' }}>
                {selectedTargetList.list.map((hostname, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{hostname}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
