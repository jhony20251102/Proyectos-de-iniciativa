import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import {
  Monitor, Building2, TrendingUp, Award, Calendar, BarChart3,
  RefreshCw, Download, MonitorPlay, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Search, Zap, Maximize2, X
} from 'lucide-react';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:3000/api';

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
    boot_time?: number;
  };
};

type AlertLevel = 'normal' | 'review' | 'warning' | 'critical';
type SortField = 'hostname' | 'grupo' | 'directiva' | 'uptime';
type SortDir = 'asc' | 'desc';

type SedeMetric = {
  sede: string;
  totalEquipos: number;
  totalReadings: number;
  avgUptimeHours: number;
  maxUptimeHours: number;
  maxUptimeHostname: string;
  alertCounts: { normal: number; review: number; warning: number; critical: number };
};

type EnergyHistory = {
  month: string;
  snapshotCount: number;
  snapshots: Array<{
    date: string;
    timestamp: string;
    totalOnline: number;
    totalRegistered: number;
    clients: Array<{
      id: string;
      hostname: string;
      sede: string;
      grupo: string;
      uptimeHours: number;
    }>;
  }>;
  sedeMetrics: SedeMetric[];
};

function getAlertLevel(bootTimeMs?: number): AlertLevel {
  if (!bootTimeMs) return 'normal';
  const hours = (Date.now() - bootTimeMs) / (1000 * 60 * 60);
  if (hours >= 24) return 'critical';
  if (hours >= 12) return 'warning';
  if (hours >= 8) return 'review';
  return 'normal';
}

function getUptimeHours(bootTimeMs?: number): number {
  if (!bootTimeMs) return 0;
  const diff = Date.now() - bootTimeMs;
  return diff > 0 ? diff / (1000 * 60 * 60) : 0;
}

function formatUptime(bootTimeMs?: number): string {
  if (!bootTimeMs) return '-';
  const diffMs = Date.now() - bootTimeMs;
  if (diffMs < 0) return '-';
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / 1000 / 60) % 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatBootDate(bootTimeMs?: number): string {
  if (!bootTimeMs) return '-';
  const date = new Date(bootTimeMs);
  return date.toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}


const ALERT_META: Record<AlertLevel, { label: string; badgeClass: string; colorHex: string }> = {
  normal:   { label: 'Normal',   badgeClass: 'green',  colorHex: '#16a34a' },
  review:   { label: 'Revisar',  badgeClass: 'yellow', colorHex: '#eab308' },
  warning:  { label: 'Atención', badgeClass: 'orange', colorHex: '#f97316' },
  critical: { label: 'Crítico',  badgeClass: 'red',    colorHex: '#ef4444' }
};


const SEDE_COLORS = ['#475569', '#64748b', '#0ea5e9', '#0284c7', '#3b82f6', '#1e293b', '#94a3b8', '#38bdf8', '#2563eb', '#334155'];


function getMonthOptions(): { value: string; label: string }[] {
  const months = [];
  const now = new Date();
  
  let year = now.getFullYear();
  let month = now.getMonth();
  
  
  while (year > 2026 || (year === 2026 && month >= 5)) {
    const d = new Date(year, month, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    
    month--;
    if (month < 0) {
      month = 11;
      year--;
    }
  }
  
  
  if (months.length === 0) {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  
  return months;
}


export default function Energia() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [historyData, setHistoryData] = useState<EnergyHistory | null>(null);

  
  const [globalSearch, setGlobalSearch] = useState('');
  
  // Column Filters
  const [colFilterHostname, setColFilterHostname] = useState('');
  const [colFilterIp, setColFilterIp] = useState('');
  const [colFilterGrupo, setColFilterGrupo] = useState('');
  const [colFilterSede, setColFilterSede] = useState('');
  const [colFilterStatus, setColFilterStatus] = useState('');
  const [colFilterHealth, setColFilterHealth] = useState('');

  // Status Filter for Health Strip
  const [filterLevel, setFilterLevel] = useState('');

  // Sort
  const [sortField, setSortField] = useState<SortField>('uptime');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  
  const [selectedSede, setSelectedSede] = useState('');

  // Full Screen Chart
  const [fullScreenChart, setFullScreenChart] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/clients`);
      const data = await res.json();
      setClients(data);
    } catch (e) {
      console.error('Error fetching clients for energy module', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (month: string) => {
    try {
      const res = await fetch(`${API_URL}/energy/history?month=${month}`);
      const data = await res.json();
      setHistoryData(data);
    } catch (e) {
      console.error('Error fetching energy history', e);
    }
  };

  const takeSnapshot = async () => {
    try {
      await fetch(`${API_URL}/energy/snapshot`, { method: 'POST' });
      
      fetchHistory(selectedMonth);
    } catch (e) {
      console.error('Error taking energy snapshot', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  
  useEffect(() => {
    fetchHistory(selectedMonth);
  }, []);

  
  useEffect(() => {
    fetchHistory(selectedMonth);
  }, [selectedMonth]);

  

  const onlineClients = clients.filter(c => c.status === 'online');
  const clientsWithUptime = onlineClients
    .filter(c => c.extended?.boot_time && c.extended.boot_time > 0)
    .map(c => ({
      ...c,
      uptimeHours: getUptimeHours(c.extended?.boot_time),
      alertLevel: getAlertLevel(c.extended?.boot_time)
    }));

  
  const totalOnline = onlineClients.length;
  const criticalCount = clientsWithUptime.filter(c => c.alertLevel === 'critical').length;
  const warningCount = clientsWithUptime.filter(c => c.alertLevel === 'warning').length;
  const reviewCount = clientsWithUptime.filter(c => c.alertLevel === 'review').length;
  const normalCount = clientsWithUptime.filter(c => c.alertLevel === 'normal').length;

  

  const realtimeSedeMetrics = useMemo(() => {
    const sedeMap: Record<string, { sede: string; equipos: string[]; totalHours: number; maxHours: number; maxHostname: string; alerts: Record<AlertLevel, number> }> = {};
    clientsWithUptime.forEach(c => {
      const sede = c.directiva || 'Sin Asignar';
      if (!sedeMap[sede]) {
        sedeMap[sede] = { sede, equipos: [], totalHours: 0, maxHours: 0, maxHostname: '', alerts: { normal: 0, review: 0, warning: 0, critical: 0 } };
      }
      const s = sedeMap[sede];
      if (!s.equipos.includes(c.id)) s.equipos.push(c.id);
      s.totalHours += c.uptimeHours;
      s.alerts[c.alertLevel]++;
      if (c.uptimeHours > s.maxHours) {
        s.maxHours = c.uptimeHours;
        s.maxHostname = c.hostname;
      }
    });
    return Object.values(sedeMap).map(s => ({
      sede: s.sede,
      totalEquipos: s.equipos.length,
      avgUptimeHours: s.equipos.length > 0 ? parseFloat((s.totalHours / s.equipos.length).toFixed(1)) : 0,
      maxUptimeHours: parseFloat(s.maxHours.toFixed(1)),
      maxUptimeHostname: s.maxHostname,
      alertCounts: s.alerts
    })).sort((a, b) => b.avgUptimeHours - a.avgUptimeHours);
  }, [clientsWithUptime]);

  // Choose metrics: from history if available, otherwise from real-time
  const sedeMetrics = historyData?.sedeMetrics && historyData.sedeMetrics.length > 0
    ? historyData.sedeMetrics
    : realtimeSedeMetrics;

  // ── Chart Data ──────────────────────────────

  // Chart 1: Avg uptime per SEDE (bar chart)
  const avgUptimeChartData = sedeMetrics.map((s, i) => ({
    name: s.sede.length > 18 ? s.sede.substring(0, 18) + '…' : s.sede,
    promedio: s.avgUptimeHours,
    fill: SEDE_COLORS[i % SEDE_COLORS.length]
  }));

  // Chart 2: Max equipo per SEDE (horizontal bar)
  const maxEquipoChartData = sedeMetrics.map((s, i) => ({
    name: s.sede.length > 15 ? s.sede.substring(0, 15) + '…' : s.sede,
    horas: s.maxUptimeHours,
    hostname: s.maxUptimeHostname,
    fill: SEDE_COLORS[i % SEDE_COLORS.length]
  }));

  // Chart 3: Alert distribution stacked per SEDE
  const alertDistributionData = sedeMetrics.map(s => ({
    name: s.sede.length > 12 ? s.sede.substring(0, 12) + '…' : s.sede,
    Normal: s.alertCounts.normal,
    Revisar: s.alertCounts.review,
    Atención: s.alertCounts.warning,
    Crítico: s.alertCounts.critical
  }));

  // Chart 4: Timeline chart - daily online counts from snapshots
  const timelineData = useMemo(() => {
    if (!historyData?.snapshots) return [];
    return historyData.snapshots.map(snap => ({
      date: snap.date.substring(5), // "06-30"
      online: snap.totalOnline,
      equipos: snap.clients?.length || 0
    }));
  }, [historyData]);

  // Unique filters for selects
  const uniqueGrupos = Array.from(new Set(clients.map(c => c.grupo).filter(Boolean))).sort();
  const uniqueDirectivas = Array.from(new Set(clients.map(c => c.directiva).filter(Boolean))).sort();

  // Apply filters
  let filteredData = [...clientsWithUptime];
  
  // Strip Filter
  if (filterLevel) filteredData = filteredData.filter(c => c.alertLevel === filterLevel);
  
  // Toolbar Filter
  if (globalSearch) {
    const s = globalSearch.toLowerCase();
    filteredData = filteredData.filter(c => 
      c.hostname.toLowerCase().includes(s) || 
      (c.ip && c.ip.includes(s)) ||
      (c.grupo && c.grupo.toLowerCase().includes(s)) ||
      (c.directiva && c.directiva.toLowerCase().includes(s))
    );
  }

  // Column Filters
  if (colFilterHostname) filteredData = filteredData.filter(c => c.hostname.toLowerCase().includes(colFilterHostname.toLowerCase()));
  if (colFilterIp) filteredData = filteredData.filter(c => c.ip?.includes(colFilterIp));
  if (colFilterGrupo) filteredData = filteredData.filter(c => c.grupo === colFilterGrupo);
  if (colFilterSede) filteredData = filteredData.filter(c => c.directiva === colFilterSede);
  if (colFilterStatus) filteredData = filteredData.filter(c => c.status === colFilterStatus);
  if (colFilterHealth) filteredData = filteredData.filter(c => c.alertLevel === colFilterHealth);

  // Apply Sorting
  filteredData.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'hostname': cmp = a.hostname.localeCompare(b.hostname); break;
      case 'grupo': cmp = (a.grupo || '').localeCompare(b.grupo || ''); break;
      case 'directiva': cmp = (a.directiva || '').localeCompare(b.directiva || ''); break;
      case 'uptime': cmp = a.uptimeHours - b.uptimeHours; break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const safePage = Math.min(currentPage, totalPages || 1);
  const startIdx = (safePage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIdx, startIdx + itemsPerPage);

  
  useEffect(() => { setCurrentPage(1); }, [globalSearch, filterLevel, colFilterHostname, colFilterIp, colFilterGrupo, colFilterSede, colFilterStatus, colFilterHealth]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'uptime' ? 'desc' : 'asc');
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} /> : <ChevronDown size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />;
  };

  const exportExcel = () => {
    const headers = ['Hostname', 'IP', 'Grupo (Ambiente)', 'SEDE', 'Estado', 'Encendido Desde', 'Tiempo Acumulado', 'Horas', 'Nivel'];
    const rows = filteredData.map(c => [
      c.hostname,
      c.ip,
      c.grupo || 'Sin Asignar',
      c.directiva || 'Sin Asignar',
      c.status === 'online' ? 'En Línea' : 'Desconectado',
      formatBootDate(c.extended?.boot_time),
      formatUptime(c.extended?.boot_time),
      c.uptimeHours.toFixed(1),
      ALERT_META[c.alertLevel].label
    ]);
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Equipos");
    XLSX.writeFile(workbook, `reporte_energia_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const clearAllFilters = () => {
    setGlobalSearch('');
    setColFilterHostname('');
    setColFilterIp('');
    setColFilterGrupo('');
    setColFilterSede('');
    setColFilterStatus('');
    setColFilterHealth('');
    setFilterLevel('');
  };

  const hasAnyFilter = Boolean(globalSearch || colFilterHostname || colFilterIp || colFilterGrupo || colFilterSede || colFilterStatus || colFilterHealth || filterLevel);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // Custom tooltip for charts
  const chartTooltipStyle = { borderRadius: '0.5rem', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '0.8125rem', background: 'var(--bg-color, #fff)', color: 'var(--text-color, #0f172a)' };

  if (loading) {
    return <div className="modern-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <Zap size={32} color="#2563eb" style={{ marginBottom: '1rem' }} />
        <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Cargando analíticas de energía...</div>
      </div>
    </div>;
  }

  
  const renderChartCard = (id: string, title: React.ReactNode, children: React.ReactNode) => {
    const isFullScreen = fullScreenChart === id;
    
    if (isFullScreen) {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'var(--bg-color, #ffffff)', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            {title}
            <button onClick={() => setFullScreenChart(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-color, #0f172a)' }}>
              <X size={24} />
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {children}
          </div>
        </div>
      );
    }
    
    return (
      <div className="modern-card energia-chart-card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          {title}
          <button onClick={() => setFullScreenChart(id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}>
            <Maximize2 size={16} />
          </button>
        </div>
        <div style={{ height: '280px' }}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="modern-dashboard">
      
      {}
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0.9}/>
          </linearGradient>
          <linearGradient id="colorReview" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#eab308" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#ca8a04" stopOpacity={0.9}/>
          </linearGradient>
          <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#ea580c" stopOpacity={0.9}/>
          </linearGradient>
          <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#dc2626" stopOpacity={0.9}/>
          </linearGradient>
          <linearGradient id="colorBarCorp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.9}/>
          </linearGradient>
          <linearGradient id="colorAreaBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>
      </svg>

      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <h1 className="modern-title">Monitoreo de Energía</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {filterLevel && (
            <button onClick={() => setFilterLevel('')} style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '0.25rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>✕ Limpiar filtro</button>
          )}
          <button className="modern-btn modern-btn-secondary" onClick={fetchData}>
            <RefreshCw size={16} strokeWidth={2} /> Actualizar Datos
          </button>
        </div>
      </div>

      {}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        
        {}
        <div className="modern-card energia-kpi-card" style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
          <div style={{ height: '3px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }} />
          <div style={{ padding: '1.25rem 1.25rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                  <Monitor size={16} color="#ffffff" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>Activos</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #94a3b8)', marginTop: '1px' }}>En línea ahora</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-color, #0f172a)', lineHeight: 1 }}>{totalOnline}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>de {clients.length}</div>
              </div>
            </div>
            <div style={{ height: '3px', background: 'var(--bg-muted, #f1f5f9)', borderRadius: '1.5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: clients.length > 0 ? `${(totalOnline / clients.length) * 100}%` : '0%', background: 'linear-gradient(90deg, #1e293b, #0f172a)', borderRadius: '1.5px', transition: 'width 0.5s ease', opacity: 0.7 }} />
            </div>
          </div>
        </div>

        {}
        {([
          { level: 'normal' as AlertLevel, count: normalCount, title: 'Normal', sub: 'Menos de 8 horas', gradient: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', accentColor: '#16a34a', bgLight: 'var(--bg-muted, #f8fafc)' },
          { level: 'review' as AlertLevel, count: reviewCount, title: 'Revisar', sub: 'Entre 8 y 12 horas', gradient: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', accentColor: '#ca8a04', bgLight: 'var(--bg-muted, #f8fafc)' },
          { level: 'warning' as AlertLevel, count: warningCount, title: 'Atención', sub: 'Entre 12 y 24 horas', gradient: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', accentColor: '#ea580c', bgLight: 'var(--bg-muted, #f8fafc)' },
          { level: 'critical' as AlertLevel, count: criticalCount, title: 'Crítico', sub: 'Más de 24 horas', gradient: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', accentColor: '#dc2626', bgLight: 'var(--bg-muted, #f8fafc)' }
        ]).map(({ level, count, title, sub, gradient, accentColor, bgLight }) => {
          const isActive = filterLevel === level;
          const totalWithData = clientsWithUptime.length || 1;
          const pct = ((count / totalWithData) * 100).toFixed(0);
          return (
            <div 
              key={level} 
              className="modern-card energia-health-card"
              onClick={() => setFilterLevel(filterLevel === level ? '' : level)}
              style={{ 
                position: 'relative',
                padding: 0, 
                cursor: 'pointer',
                overflow: 'hidden',
                border: isActive ? `2px solid ${accentColor}` : '1px solid var(--border-color, #e2e8f0)',
                boxShadow: isActive ? `0 0 0 3px ${accentColor}22, 0 4px 12px ${accentColor}15` : '0 1px 3px rgba(0,0,0,0.04)',
                transform: isActive ? 'translateY(-2px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div style={{ height: '3px', background: gradient }} />
              <div style={{ padding: '1.25rem 1.25rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: bgLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: accentColor, boxShadow: `0 0 6px ${accentColor}40` }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>{title}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #94a3b8)', marginTop: '1px' }}>{sub}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: count > 0 ? accentColor : 'var(--text-muted, #cbd5e1)', lineHeight: 1 }}>{count}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>{pct}%</div>
                  </div>
                </div>
                <div style={{ height: '3px', background: 'var(--bg-muted, #f1f5f9)', borderRadius: '1.5px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: accentColor, borderRadius: '1.5px', transition: 'width 0.5s ease', opacity: 0.7 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {}
      {}
      {}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <h2 className="modern-section-title" style={{ margin: 0 }}><Monitor size={18} strokeWidth={2.5} /> Análisis de Equipos</h2>
      </div>
      
      {}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" className="modern-input" placeholder="Búsqueda global..." style={{ paddingLeft: '2.25rem', width: '220px' }} value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} />
        </div>
        
        {hasAnyFilter && (
          <button className="modern-btn" onClick={clearAllFilters} style={{ color: '#ef4444', fontSize: '0.875rem', background: 'transparent' }}>
            Limpiar Todos los Filtros
          </button>
        )}
        
        <div style={{ marginLeft: 'auto' }}>
          <button className="modern-btn modern-btn-primary" onClick={exportExcel} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} strokeWidth={2} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="modern-table-container" style={{ marginBottom: '3rem' }}>
        <table className="modern-table">
          <thead>
            <tr>
              <th>
                <div onClick={() => toggleSort('hostname')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  Hostname {sortIcon('hostname')}
                </div>
                <input type="text" className="modern-column-filter" placeholder="Filtrar..." value={colFilterHostname} onChange={e => setColFilterHostname(e.target.value)} />
              </th>
              <th>
                <div style={{ display: 'flex', alignItems: 'center' }}>Dirección IP</div>
                <input type="text" className="modern-column-filter" placeholder="Filtrar..." value={colFilterIp} onChange={e => setColFilterIp(e.target.value)} />
              </th>
              <th>
                <div onClick={() => toggleSort('grupo')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  Grupo (Ambiente) {sortIcon('grupo')}
                </div>
                <select className="modern-column-filter" value={colFilterGrupo} onChange={e => setColFilterGrupo(e.target.value)}>
                  <option value="">Todos</option>
                  {uniqueGrupos.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </th>
              <th>
                <div onClick={() => toggleSort('directiva')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  SEDE {sortIcon('directiva')}
                </div>
                <select className="modern-column-filter" value={colFilterSede} onChange={e => setColFilterSede(e.target.value)}>
                  <option value="">Todas</option>
                  {uniqueDirectivas.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </th>
              <th>
                <div style={{ display: 'flex', alignItems: 'center' }}>Estado</div>
                <select className="modern-column-filter" value={colFilterStatus} onChange={e => setColFilterStatus(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="online">En Línea</option>
                  <option value="offline">Desconectado</option>
                </select>
              </th>
              <th>
                <div style={{ display: 'flex', alignItems: 'center' }}>Encendido Desde</div>
              </th>
              <th>
                <div onClick={() => toggleSort('uptime')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  Tiempo Acumulado {sortIcon('uptime')}
                </div>
              </th>
              <th>
                <div style={{ display: 'flex', alignItems: 'center' }}>Nivel de Salud</div>
                <select className="modern-column-filter" value={colFilterHealth} onChange={e => setColFilterHealth(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="normal">Normal</option>
                  <option value="review">Revisar</option>
                  <option value="warning">Atención</option>
                  <option value="critical">Crítico</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #94a3b8)' }}>
                  No hay equipos que coincidan con los filtros actuales.
                </td>
              </tr>
            ) : (
              paginatedData.map(client => {
                const meta = ALERT_META[client.alertLevel];
                return (
                  <tr key={client.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <MonitorPlay size={14} color="var(--text-muted, #64748b)" />
                        {client.hostname}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.8125rem' }}>{client.ip}</td>
                    <td style={{ color: 'var(--text-muted, #64748b)' }}>{client.grupo || 'Sin Asignar'}</td>
                    <td style={{ color: 'var(--text-muted, #64748b)' }}>{client.directiva || 'Sin Asignar'}</td>
                    <td>
                      <span className={`modern-badge ${client.status === 'online' ? 'green' : 'gray'}`}>
                        <span className="modern-badge-dot"></span> {client.status === 'online' ? 'En Línea' : 'Desconectado'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.8125rem' }}>{formatBootDate(client.extended?.boot_time)}</td>
                    <td style={{ fontWeight: 600, color: meta.colorHex }}>{formatUptime(client.extended?.boot_time)}</td>
                    <td>
                      <span className={`modern-badge ${meta.badgeClass}`}>
                        <span className="modern-badge-dot"></span> {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        {}
        {filteredData.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-muted, #f8fafc)', borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748b)' }}>
              Mostrando <span style={{ fontWeight: 600, color: 'var(--text-color, #0f172a)' }}>{startIdx + 1}</span> a <span style={{ fontWeight: 600, color: 'var(--text-color, #0f172a)' }}>{Math.min(startIdx + itemsPerPage, filteredData.length)}</span> de <span style={{ fontWeight: 600, color: 'var(--text-color, #0f172a)' }}>{filteredData.length}</span> equipos
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select className="modern-input" style={{ padding: '0.25rem 1.5rem 0.25rem 0.5rem', marginRight: '0.5rem', backgroundColor: 'var(--bg-color, #fff)' }} value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
              </select>
              
              <button 
                onClick={() => setCurrentPage(p => p - 1)} disabled={safePage <= 1}
                style={{ padding: '0.375rem', background: 'var(--bg-color, #fff)', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '0.375rem', cursor: safePage <= 1 ? 'not-allowed' : 'pointer', opacity: safePage <= 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={16} color="var(--text-color, #0f172a)" />
              </button>
              
              <button 
                onClick={() => setCurrentPage(p => p + 1)} disabled={safePage >= totalPages}
                style={{ padding: '0.375rem', background: 'var(--bg-color, #fff)', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '0.375rem', cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', opacity: safePage >= totalPages ? 0.5 : 1 }}
              >
                <ChevronRight size={16} color="var(--text-color, #0f172a)" />
              </button>
            </div>
          </div>
        )}
      </div>

      {}
      {}
      {}

      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 className="modern-section-title" style={{ margin: 0 }}>
            <BarChart3 size={20} strokeWidth={2.5} /> Métricas por SEDE
          </h2>
          {historyData && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', background: 'var(--bg-muted, #f1f5f9)', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontWeight: 500 }}>
              {historyData.snapshotCount} snapshot{historyData.snapshotCount !== 1 ? 's' : ''} del mes
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '0.5rem', padding: '0.375rem 0.75rem' }}>
            <Calendar size={14} color="var(--text-muted, #64748b)" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-color, #0f172a)', background: 'transparent', cursor: 'pointer' }}
            >
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <button className="modern-btn modern-btn-primary" onClick={takeSnapshot} style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
            <Zap size={14} /> Capturar Estado
          </button>
        </div>
      </div>

      {}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>

        {}
        {renderChartCard('chart1', (
          <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-color, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Tiempo de actividad por SEDE
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 400, marginLeft: '0.25rem' }}>horas</span>
          </h3>
        ), (
          avgUptimeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={avgUptimeChartData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #f1f5f9)" />
                <XAxis dataKey="name" stroke="var(--text-muted, #94a3b8)" fontSize={11} angle={-35} textAnchor="end" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted, #94a3b8)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(val) => [`${val} hrs`, 'Promedio']} />
                <Bar dataKey="promedio" radius={[4, 4, 0, 0]} barSize={28}>
                  {avgUptimeChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.875rem' }}>Sin datos de SEDEs</div>
          )
        ))}

        {}
        {renderChartCard('chart2', (
          <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-color, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Equipo Máx. Encendido por SEDE
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 400, marginLeft: '0.25rem' }}>horas</span>
          </h3>
        ), (
          maxEquipoChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={maxEquipoChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #f1f5f9)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted, #94a3b8)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted, #475569)" fontSize={11} width={110} tickLine={false} axisLine={false} fontWeight={500} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(val: any, _name: any, props: any) => {
                    const hn = props?.payload?.hostname || '';
                    return [`${val} hrs — ${hn}`, 'Máx. equipo'];
                  }}
                />
                <Bar dataKey="horas" radius={[0, 4, 4, 0]} barSize={14}>
                  {maxEquipoChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.875rem' }}>Sin datos</div>
          )
        ))}

        {}
        {renderChartCard('chart3', (
          <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-color, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Distribución de Alertas por SEDE
          </h3>
        ), (
          alertDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={alertDistributionData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #f1f5f9)" />
                <XAxis dataKey="name" stroke="var(--text-muted, #94a3b8)" fontSize={11} angle={-35} textAnchor="end" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted, #94a3b8)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }} />
                <Bar dataKey="Normal" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Revisar" stackId="a" fill="#eab308" />
                <Bar dataKey="Atención" stackId="a" fill="#f97316" />
                <Bar dataKey="Crítico" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.875rem' }}>Sin datos</div>
          )
        ))}

        {}
        {renderChartCard('chart4', (
          <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-color, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Equipos Online por Día
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 400, marginLeft: '0.25rem' }}>
              {monthOptions.find(m => m.value === selectedMonth)?.label}
            </span>
          </h3>
        ), (
          timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #f1f5f9)" />
                <XAxis dataKey="date" stroke="var(--text-muted, #94a3b8)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted, #94a3b8)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="online" stroke="#3b82f6" strokeWidth={2} fill="url(#colorAreaBlue)" name="Equipos online" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted, #94a3b8)', fontSize: '0.875rem' }}>
              <Calendar size={24} color="var(--text-muted, #cbd5e1)" />
              <span>Sin snapshots para este mes</span>
              <span style={{ fontSize: '0.75rem' }}>Toma tu primer snapshot con el botón de arriba</span>
            </div>
          )
        ))}

      </div>

      {}
      {sedeMetrics.length > 0 && (
        <>
          <h2 className="modern-section-title" style={{ marginBottom: '1rem' }}>
            <Building2 size={18} strokeWidth={2.5} /> Ranking de SEDEs
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            {sedeMetrics.map((sede, idx) => {
              const totalAlerts = sede.alertCounts.critical + sede.alertCounts.warning + sede.alertCounts.review;
              const riskLevel: AlertLevel = sede.alertCounts.critical > 0 ? 'critical' : sede.alertCounts.warning > 0 ? 'warning' : sede.alertCounts.review > 0 ? 'review' : 'normal';
              const riskMeta = ALERT_META[riskLevel];
              return (
                <div key={sede.sede} className="modern-card energia-sede-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', border: selectedSede === sede.sede ? `2px solid ${SEDE_COLORS[idx % SEDE_COLORS.length]}` : '1px solid var(--border-color, #e2e8f0)' }}
                  onClick={() => setSelectedSede(selectedSede === sede.sede ? '' : sede.sede)}
                >
                  <div style={{ padding: '1.25rem' }}>
                    {}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '0.625rem', background: `${SEDE_COLORS[idx % SEDE_COLORS.length]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Building2 size={18} color={SEDE_COLORS[idx % SEDE_COLORS.length]} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>{sede.sede}</div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #94a3b8)' }}>{sede.totalEquipos} equipo{sede.totalEquipos !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <span className={`modern-badge ${riskMeta.badgeClass}`} style={{ fontSize: '0.6875rem' }}>
                        <span className="modern-badge-dot"></span> {riskMeta.label}
                      </span>
                    </div>
                    {}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ background: 'var(--bg-muted, #f8fafc)', borderRadius: '0.5rem', padding: '0.625rem 0.75rem' }}>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <TrendingUp size={11} /> Promedio
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: sede.avgUptimeHours >= 12 ? '#f97316' : 'var(--text-color, #0f172a)' }}>
                          {sede.avgUptimeHours}h
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-muted, #f8fafc)', borderRadius: '0.5rem', padding: '0.625rem 0.75rem' }}>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Award size={11} /> Máx. equipo
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: sede.maxUptimeHours >= 24 ? '#ef4444' : 'var(--text-color, #0f172a)' }}>
                          {sede.maxUptimeHours}h
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sede.maxUptimeHostname}
                        </div>
                      </div>
                    </div>
                    {}
                    {(sede.alertCounts.normal + totalAlerts) > 0 && (
                      <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginTop: '0.75rem', gap: '1px' }}>
                        {sede.alertCounts.normal > 0 && <div style={{ flex: sede.alertCounts.normal, background: '#22c55e', borderRadius: '3px' }} />}
                        {sede.alertCounts.review > 0 && <div style={{ flex: sede.alertCounts.review, background: '#eab308', borderRadius: '3px' }} />}
                        {sede.alertCounts.warning > 0 && <div style={{ flex: sede.alertCounts.warning, background: '#f97316', borderRadius: '3px' }} />}
                        {sede.alertCounts.critical > 0 && <div style={{ flex: sede.alertCounts.critical, background: '#ef4444', borderRadius: '3px' }} />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
