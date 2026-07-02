import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { logoutUser } from '../firebase';
import type { User } from 'firebase/auth';
import { MonitorPlay, LogOut, PieChart, Package, History, Cast, Download, Moon, Sun, Users, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LayoutProps {
  user: User;
}

export default function Layout({ user }: LayoutProps) {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <div className="layout-container">
      {}
      <header className="global-header">
        <div className="header-left">
          <img src="/favicon.ico" alt="ICE Logo" className="brand-icon" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
          <h1>ICE - Institucion De Educacion Superior - Certus Cloud</h1>
        </div>
        <div className="header-right">
          <div className="user-profile">
            <button onClick={() => setIsDark(!isDark)} className="btn-logout" title="Cambiar Tema" style={{ marginRight: '1rem' }}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <span className="user-email">{user.email}</span>
            <button onClick={handleLogout} className="btn-logout" title="Cerrar Sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {}
      <nav className="global-nav">
        <NavLink to="/equipos" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <MonitorPlay size={14}/> EQUIPOS
        </NavLink>
        <NavLink to="/grupos" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <Package size={14}/> GRUPOS
        </NavLink>

        <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <PieChart size={14}/> DASHBOARD
        </NavLink>
        <NavLink to="/energia" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <Zap size={14}/> ENERGÍA
        </NavLink>
        {user.email === 'rickysedano1@gmail.com' && (
          <NavLink to="/usuarios" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Users size={14}/> USUARIOS
          </NavLink>
        )}
        <NavLink to="/historial" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <History size={14} /> HISTORIAL
        </NavLink>
        <NavLink to="/remoto" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <Cast size={14} /> REMOTO
        </NavLink>
        <NavLink to="/descargas" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <Download size={14} /> DESCARGAS
        </NavLink>
      </nav>

      {}
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
