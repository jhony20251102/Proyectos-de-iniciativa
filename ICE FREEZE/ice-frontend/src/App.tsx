import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './firebase';


import Layout from './components/Layout';
import Login from './pages/Login';
import Equipos from './pages/Equipos';
import Grupos from './pages/Grupos';
import Dashboard from './pages/Dashboard';
import Historial from './pages/Historial';
import Remoto from './pages/Remoto';
import Descargas from './pages/Descargas';
import EquipoDetalle from './pages/EquipoDetalle';
import Usuarios from './pages/Usuarios';
import Energia from './pages/Energia';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:3000/api';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email) {
        try {
          const res = await fetch(`${API_URL}/users`);
          if (res.ok) {
            const users = await res.json();
            const isAllowed = users.some((u: any) => u.email === currentUser.email);
            
            
            if (isAllowed || currentUser.email === 'rsedano@visivaedu.com') {
              setUser(currentUser);
            } else {
              auth.signOut();
              alert(`Acceso denegado: El correo ${currentUser.email} no está autorizado.`);
              setUser(null);
            }
          } else {
             
             if (['rsedano@visivaedu.com', 'jcardenas@visivaedu.com', 'rickysedano1@gmail.com'].includes(currentUser.email)) {
               setUser(currentUser);
             } else {
               auth.signOut();
               setUser(null);
             }
          }
        } catch(e) {
          console.error("Error validando acceso", e);
          auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="loading-screen">Cargando Consola Ice...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout user={user} />}>
        <Route index element={<Navigate to="/equipos" replace />} />
        <Route path="equipos" element={<Equipos user={user} />} />
        <Route path="equipos/:id" element={<EquipoDetalle />} />
        <Route path="grupos" element={<Grupos />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="energia" element={<Energia />} />
        <Route path="historial" element={<Historial user={user} />} />
        <Route path="remoto" element={<Remoto user={user} />} />
        <Route path="usuarios" element={<Usuarios user={user} />} />
        <Route path="descargas" element={<Descargas />} />
      </Route>
    </Routes>
  );
}

export default App;
