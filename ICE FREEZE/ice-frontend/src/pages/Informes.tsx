import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';


const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:3000/api';

type Client = {
  id: string;
  status: string;
  is_frozen: boolean;
  directiva: string;
};

export default function Informes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch(`${API_URL}/clients`);
        const data = await res.json();
        setClients(data);
      } catch (e) {
        console.error("Error fetching clients", e);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  if (loading) {
    return <div className="page-wrapper"><div className="empty-state">Cargando métricas...</div></div>;
  }

  
  const totalEquipos = clients.length;
  const onlineCount = clients.filter(c => c.status === 'online').length;
  const offlineCount = totalEquipos - onlineCount;
  
  const frozenCount = clients.filter(c => c.is_frozen).length;
  const thawedCount = totalEquipos - frozenCount;

  
  const sedesMap: Record<string, number> = {};
  clients.forEach(c => {
    const sede = c.directiva || 'Sin Asignar';
    sedesMap[sede] = (sedesMap[sede] || 0) + 1;
  });
  
  const barData = Object.keys(sedesMap).map(key => ({
    name: key,
    equipos: sedesMap[key]
  }));

  const pieDataStatus = [
    { name: 'Conectados', value: onlineCount, color: '#10b981' }, 
    { name: 'Desconectados', value: offlineCount, color: '#ef4444' } 
  ];

  const pieDataFrozen = [
    { name: 'Congelados', value: frozenCount, color: '#38bdf8' }, 
    { name: 'Descongelados', value: thawedCount, color: '#f59e0b' } 
  ];

  return (
    <div className="page-wrapper" style={{ paddingBottom: '40px' }}>
      <div style={{ background: '#334155', color: '#fff', padding: '15px 20px', borderRadius: '4px', marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '1px', borderLeft: '5px solid #38bdf8' }}>
        RESUMEN DE EQUIPOS (ICE CLIENT)
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderTop: '4px solid #3b82f6', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Total Equipos Registrados</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '400', color: 'var(--text-main)', lineHeight: 1 }}>{totalEquipos}</div>
        </div>

        <div style={{ background: 'var(--card-bg)', padding: '24px', borderTop: '4px solid #10b981', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Equipos Online</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '400', color: 'var(--text-main)', lineHeight: 1 }}>{onlineCount}</div>
        </div>

        <div style={{ background: 'var(--card-bg)', padding: '24px', borderTop: '4px solid #38bdf8', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Protegidos (UWF Congelado)</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '400', color: 'var(--text-main)', lineHeight: 1 }}>{frozenCount}</div>
        </div>

        <div style={{ background: 'var(--card-bg)', padding: '24px', borderTop: '4px solid #f59e0b', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Vulnerables (Descongelado)</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '400', color: 'var(--text-main)', lineHeight: 1 }}>{thawedCount}</div>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        {}
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '4px', border: '1px solid var(--border-color)', gridColumn: '1 / -1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '24px' }}>DISTRIBUCIÓN DE EQUIPOS POR SEDE</div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="var(--text-muted)" allowDecimals={false} axisLine={false} tickLine={false} dx={-10} />
                <RechartsTooltip cursor={{fill: 'var(--bg-hover)'}} contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '4px' }} />
                <Bar dataKey="equipos" fill="#36b9cc" name="Equipos Registrados" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {}
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '4px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '24px' }}>ESTADO DE CONEXIÓN</div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieDataStatus} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                  {pieDataStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '4px' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '4px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '24px' }}>ESTADO DE PROTECCIÓN (UWF)</div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieDataFrozen} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                  {pieDataFrozen.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '4px' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
