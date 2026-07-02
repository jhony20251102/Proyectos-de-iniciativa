import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LabelList } from 'recharts';
import { Monitor, Snowflake, Wifi, ShieldAlert, Maximize2, X, PowerOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:3000/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    frozen: 0,
    thawed: 0,
    networkTypeData: [] as any[],
    diskData: [] as any[],
    diskTypeData: [] as any[],
    ramData: [] as any[],
    versionData: [] as any[],
    userActivity: [] as any[],
    timelineData: [] as any[],
    sedesData: [] as any[],
    statusData: [] as any[],
    frozenData: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [fullScreenChart, setFullScreenChart] = useState<string | null>(null);

  const renderChartCard = (id: string, title: string, children: React.ReactNode, wrapperStyle: React.CSSProperties, chartHeight: string = '250px') => {
    const isFullScreen = fullScreenChart === id;
    
    if (isFullScreen) {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#f4f5f7', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.5rem', fontWeight: 700 }}>{title}</h3>
              <button onClick={() => setFullScreenChart(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#1f2937' }}>
                <X size={32} />
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              {children}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{ ...wrapperStyle, background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
          <button onClick={() => setFullScreenChart(id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}>
            <Maximize2 size={16} />
          </button>
        </div>
        <div style={{ height: chartHeight }}>
          {children}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, historyRes] = await Promise.all([
          fetch(`${API_URL}/clients`),
          fetch(`${API_URL}/history`)
        ]);
        const clients = await clientsRes.json();
        const history = await historyRes.json();

        
        const total = clients.length;
        const online = clients.filter((c: any) => c.status === 'online').length;
        const offline = total - online;
        const frozen = clients.filter((c: any) => c.is_frozen).length;
        const thawed = total - frozen;

        
        const diskCounts: Record<string, number> = {};
        const diskTypeCounts: Record<string, number> = {};
        const ramCounts: Record<string, number> = {};
        const versionCounts: Record<string, number> = {};
        const sedesMap: Record<string, number> = {};
        let wifi = 0;
        let eth = 0;

        clients.forEach((c: any) => {
          
          const sede = c.directiva || 'Sin Asignar';
          sedesMap[sede] = (sedesMap[sede] || 0) + 1;

          
          let disk = c.extended?.disk_capacity || 'Unknown';
          if (disk !== 'Unknown') {
            const gb = parseFloat(disk);
            if (gb < 300) disk = '256GB';
            else if (gb < 600) disk = '512GB';
            else disk = '1TB+';
          }
          diskCounts[disk] = (diskCounts[disk] || 0) + 1;

          
          const dType = c.extended?.disk_type || 'HDD';
          diskTypeCounts[dType] = (diskTypeCounts[dType] || 0) + 1;

          
          let ram = c.extended?.ram_total || 'Desconocido';
          if (ram !== 'Desconocido') {
            const gb = parseInt(ram);
            
            if (gb <= 4) ram = '4 GB';
            else if (gb <= 8) ram = '8 GB';
            else if (gb <= 16) ram = '16 GB';
            else if (gb <= 32) ram = '32 GB';
            else ram = '+32 GB';
          }
          ramCounts[ram] = (ramCounts[ram] || 0) + 1;

          
          const ver = c.version || 'v1.0.0';
          versionCounts[ver] = (versionCounts[ver] || 0) + 1;

          
          if (c.network_type === 'wifi') wifi++;
          else eth++;
        });

        const sedesData = Object.keys(sedesMap).map(key => ({ name: key, equipos: sedesMap[key] }));
        const diskData = Object.keys(diskCounts).map(k => ({ name: k, value: diskCounts[k] }));
        const diskTypeData = Object.keys(diskTypeCounts).map(k => ({ name: k, value: diskTypeCounts[k] }));
        const ramData = Object.keys(ramCounts).map(k => ({ name: k, value: ramCounts[k] }));
        const versionData = Object.keys(versionCounts).map(k => ({ name: k, value: versionCounts[k] }));
        const networkTypeData = [
          { name: 'Wi-Fi', value: wifi },
          { name: 'Ethernet', value: eth }
        ];

        const statusData = [
          { name: 'Conectados', value: online, color: '#4B49AC' }, 
          { name: 'Desconectados', value: offline, color: '#e2e8f0' } 
        ];

        const frozenData = [
          { name: 'Congelados', value: frozen, color: '#7DA0FA' }, 
          { name: 'Descongelados', value: thawed, color: '#FF4747' } 
        ];

        
        const userActionCounts: Record<string, any> = {};
        history.forEach((h: any) => {
          if (!userActionCounts[h.userEmail]) {
            userActionCounts[h.userEmail] = { email: h.userEmail.split('@')[0], comandos: 0, archivos: 0 };
          }
          if (h.action.includes('Archivo')) {
            userActionCounts[h.userEmail].archivos++;
          } else {
            userActionCounts[h.userEmail].comandos++;
          }
        });
        const userActivity = Object.values(userActionCounts).sort((a: any, b: any) => (b.comandos + b.archivos) - (a.comandos + a.archivos)).slice(0, 5);

        
        const dateMap: Record<string, { date: string, comandos: number, archivos: number }> = {};
        history.forEach((h: any) => {
          if (!h.timestamp) return;
          const dateObj = new Date(h.timestamp);
          const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
          
          if (!dateMap[dateStr]) dateMap[dateStr] = { date: dateStr, comandos: 0, archivos: 0 };
          
          if (h.action.includes('Archivo')) dateMap[dateStr].archivos++;
          else dateMap[dateStr].comandos++;
        });
        
        const timelineData = Object.values(dateMap).slice(-7);

        setStats({
          total,
          online,
          offline,
          frozen,
          thawed,
          networkTypeData,
          diskData,
          diskTypeData,
          ramData,
          versionData,
          userActivity,
          timelineData,
          sedesData,
          statusData,
          frozenData
        });
      } catch (e) {
        console.error("Error fetching dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="page-wrapper" style={{ padding: '2rem', color: '#1f2937' }}>Cargando estadísticas...</div>;

  return (
    <div className="page-wrapper" style={{ padding: '2rem', background: '#f4f5f7', minHeight: '100vh', color: '#1f2937', fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#1f2937', fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>ICE Dashboard</h1>
      </div>

      {}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { title: 'Equipos Totales', value: stats.total, pct: 100, icon: <Monitor size={20} color="#64748b" />, bg: '#f8fafc', barColor: '#cbd5e1', topColor: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
          { title: 'En Línea', value: stats.online, pct: stats.total ? (stats.online / stats.total) * 100 : 0, icon: <Wifi size={20} color="#64748b" />, bg: '#f8fafc', barColor: '#64748b', topColor: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' },
          { title: 'Apagados', value: stats.offline, pct: stats.total ? (stats.offline / stats.total) * 100 : 0, icon: <PowerOff size={20} color="#64748b" />, bg: '#f8fafc', barColor: '#64748b', topColor: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' },
          { title: 'Protegidos (UWF)', value: stats.frozen, pct: stats.total ? (stats.frozen / stats.total) * 100 : 0, icon: <Snowflake size={20} color="#64748b" />, bg: '#f8fafc', barColor: '#64748b', topColor: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' },
          { title: 'Vulnerables', value: stats.thawed, pct: stats.total ? (stats.thawed / stats.total) * 100 : 0, icon: <ShieldAlert size={20} color="#b91c1c" />, bg: '#fef2f2', barColor: '#b91c1c', topColor: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' }
        ].map((stat, i) => (
          <div key={i} style={{ background: '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ height: '3px', background: stat.topColor }} />
            <div style={{ padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                <div style={{ background: stat.bg, padding: '0.4rem', borderRadius: '8px' }}>
                  {stat.icon}
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 600 }}>{stat.title}</div>
                  <div style={{ color: '#1f2937', fontSize: '1.25rem', fontWeight: 800 }}>{stat.value}</div>
                </div>
              </div>
              <div style={{ height: '3px', background: '#f1f5f9', borderRadius: '1.5px', overflow: 'hidden', marginBottom: '0.15rem' }}>
                <div style={{ height: '100%', width: `${stat.pct}%`, background: stat.barColor, borderRadius: '1.5px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {}
        {renderChartCard('timeline', 'Actividad del Sistema (Línea de Tiempo)',
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorComandos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4747" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF4747" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorArchivos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFC100" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FFC100" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#6b7280" axisLine={false} tickLine={false} dx={-10} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Area type="monotone" dataKey="comandos" name="Comandos Ejecutados" stroke="#FF4747" strokeWidth={3} fillOpacity={1} fill="url(#colorComandos)" />
              <Area type="monotone" dataKey="archivos" name="Archivos Enviados" stroke="#FFC100" strokeWidth={3} fillOpacity={1} fill="url(#colorArchivos)" />
            </AreaChart>
          </ResponsiveContainer>,
          { gridColumn: 'span 2' }
        )}

        {}
        {renderChartCard('sede', 'Distribución por Sede',
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={stats.sedesData} layout="vertical" margin={{ top: 0, right: 35, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" hide />
              <YAxis dataKey="name" type="category" stroke="#6b7280" axisLine={false} tickLine={false} width={100} />
              <Tooltip cursor={{fill: '#f4f5f7'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="equipos" fill="#57B657" radius={[0, 4, 4, 0]} barSize={20}>
                <LabelList dataKey="equipos" position="right" fill="#6b7280" fontSize={12} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>,
          {}
        )}

      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {}
        {renderChartCard('connection', 'Estado de Conexión',
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={75} outerRadius={95} paddingAngle={2} dataKey="value" stroke="none">
                  <Cell fill="#4B49AC" /> {}
                  <Cell fill="#e2e8f0" /> {}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            {}
            <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 600 }}>Conectados</div>
              <div style={{ fontSize: '2rem', color: '#1f2937', fontWeight: 800 }}>
                {stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%
              </div>
            </div>
          </div>,
          {}
        )}

        {}
        {renderChartCard('activity', 'Top Usuarios (Actividad)',
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.userActivity} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="email" stroke="#6b7280" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#6b7280" axisLine={false} tickLine={false} dx={-10} />
              <Tooltip cursor={{fill: '#f4f5f7'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="comandos" name="Comandos" fill="#4B49AC" radius={[4, 4, 0, 0]} barSize={25} />
              <Bar dataKey="archivos" name="Archivos" fill="#98BDFF" radius={[4, 4, 0, 0]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>,
          { gridColumn: 'span 2' }
        )}


      </div>


      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>

        {}
        {renderChartCard('protection', 'Protección (UWF)',
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.frozenData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none" label={({name, percent}) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                <Cell fill="#7DA0FA" /> {}
                <Cell fill="#FF4747" /> {}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>,
          {},
          '220px'
        )}

        {}
        {renderChartCard('network', 'Tipos de Conexión',
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.networkTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none" label={({name, percent}) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                <Cell fill="#4B49AC" /> {}
                <Cell fill="#FFC100" /> {}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>,
          {},
          '220px'
        )}

        {}
        {renderChartCard('ram', 'Memoria RAM',
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.ramData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none" label={({name, percent}) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                {stats.ramData.map((_, index) => <Cell key={`cell-${index}`} fill={['#4B49AC', '#57B657', '#FFC100', '#FF4747', '#7DA0FA'][index % 5]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>,
          {},
          '220px'
        )}

        {}
        {renderChartCard('disktype', 'Tipo de Disco',
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.diskTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none" label={({name, percent}) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                <Cell fill="#7DA0FA" /> {}
                <Cell fill="#4B49AC" />
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>,
          {},
          '220px'
        )}

        {}
        {renderChartCard('versions', 'Versiones del Agente',
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.versionData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none" label={({name, percent}) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                {stats.versionData.map((_, index) => <Cell key={`cell-${index}`} fill={['#57B657', '#FFC100', '#FF4747', '#4B49AC'][index % 4]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>,
          {},
          '220px'
        )}

      </div>
    </div>
  );
}
