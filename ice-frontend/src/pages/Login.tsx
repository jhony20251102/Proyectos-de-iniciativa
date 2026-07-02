import { useState } from 'react';
import { loginWithGoogle } from '../firebase';
import { MonitorPlay, AlertCircle } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // App.tsx se encarga de redirigir y verificar el correo
    } catch (err: unknown) {
      const error = err as Error & { code?: string };
      if (error.code !== 'auth/popup-closed-by-user') {
        setError('Ocurrió un error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <MonitorPlay size={48} className="login-icon" />
          <h2>Ice Console <span>Cloud</span></h2>
          <p>Instituto de Educación Superior Tecnológico Privado</p>
        </div>
        
        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button 
          className="btn-google" 
          onClick={handleLogin} 
          disabled={loading}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          {loading ? 'Verificando...' : 'Ingresar con cuenta corporativa'}
        </button>

        <p className="login-footer">
          Acceso restringido únicamente al personal autorizado de TI.
        </p>
      </div>
    </div>
  );
}
