import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Users, UserPlus, Trash2, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:3000/api';

interface UsuariosProps {
  user: User | null;
}

export default function Usuarios({ user }: UsuariosProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Error fetching users", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes('@')) {
      alert("Por favor ingresa un correo válido.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, role: newRole, addedBy: user?.email || 'Admin' })
      });
      if (res.ok) {
        setNewEmail('');
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Error al agregar usuario.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar el acceso para ${email}?`)) return;
    try {
      const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
      alert("Error al eliminar.");
    }
  };

  if (loading) return <div className="page-wrapper" style={{ padding: '2rem' }}>Cargando usuarios...</div>;

  return (
    <div className="page-wrapper" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
        <Users size={28} color="#3b82f6" />
        <h2 style={{ margin: 0 }}>Gestión de Accesos</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
            <UserPlus size={20} />
            <h3 style={{ margin: 0 }}>Agregar Usuario</h3>
          </div>
          
          <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Correo Electrónico</label>
              <input 
                type="email" 
                value={newEmail} 
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                required
                className="inline-input"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Rol</label>
              <select 
                value={newRole} 
                onChange={(e) => setNewRole(e.target.value)}
                className="inline-input"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px' }}
              >
                <option value="superadmin">Superadmin (Acceso Total)</option>
                <option value="admin">Administrador</option>
                <option value="viewer">Visor (Solo Lectura)</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn"
              style={{ width: '100%', marginTop: '0.5rem', background: '#3b82f6', color: 'white', padding: '0.75rem', display: 'flex', justifyContent: 'center', gap: '8px' }}
            >
              {isSubmitting ? 'Agregando...' : <><UserPlus size={18} /> Agregar Acceso</>}
            </button>
          </form>
        </div>

        {}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
            <Shield size={20} />
            <h3 style={{ margin: 0 }}>Usuarios Autorizados</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {users.length === 0 ? (
              <div className="empty-state">No hay usuarios registrados en la base de datos. (Usando respaldos en código).</div>
            ) : (
              users.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{u.email}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Rol: {u.role} | Agregado por: {u.addedBy}</div>
                  </div>
                  <button 
                    onClick={() => handleDelete(u.id, u.email)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                    title="Eliminar Acceso"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
