import React, { useState } from 'react';
import { X, Mail, Lock, User, GraduationCap, MapPin, Calendar, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [carrera, setCarrera] = useState('');
    const [ciclo, setCiclo] = useState('');
    const [sede, setSede] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const body = isLogin 
            ? { email, password }
            : { email, password, nombre, carrera, ciclo, sede };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ocurrió un error al procesar la solicitud');
            }

            
            localStorage.setItem('nova_token', data.token);
            localStorage.setItem('nova_user', JSON.stringify(data.user));

            onSuccess(data.user, data.token);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[30000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="relative w-full max-w-md backdrop-blur-2xl bg-slate-950/70 border border-white/10 rounded-[2rem] p-8 shadow-[0_0_80px_rgba(6,182,212,0.15)] overflow-hidden">
                {}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                {}
                <button 
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                    <X className="w-4 h-4" />
                </button>

                {}
                <div className="text-center mb-6 relative z-10">
                    <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-3">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-orbitron font-black text-white tracking-wider">
                        {isLogin ? 'INICIAR SESIÓN' : 'REGISTRO DE ALUMNO'}
                    </h2>
                    <p className="text-xs text-slate-400 tracking-widest font-rajdhani mt-1 uppercase">
                        {isLogin ? 'Accede a tu historial y memoria de Nova' : 'Crea tu perfil inteligente para Nova.IA'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-rajdhani tracking-wider text-center">
                        {error}
                    </div>
                )}

                {}
                <form onSubmit={handleSubmit} className="space-y-4 relative z-10 font-rajdhani tracking-wider">
                    {!isLogin && (
                        <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                                <User className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Nombre Completo"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-cyan-500/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                            />
                        </div>
                    )}

                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                            <Mail className="w-4 h-4" />
                        </span>
                        <input
                            type="email"
                            placeholder="Correo Institucional / Personal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-cyan-500/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                            <Lock className="w-4 h-4" />
                        </span>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-cyan-500/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                        />
                    </div>

                    {!isLogin && (
                        <div className="grid grid-cols-1 gap-3">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                                    <GraduationCap className="w-4 h-4" />
                                </span>
                                <select
                                    value={carrera}
                                    onChange={(e) => setCarrera(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-cyan-500/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors appearance-none"
                                >
                                    <option value="" className="bg-slate-950">Selecciona tu Carrera</option>
                                    <option value="Diseño y Desarrollo de Software" className="bg-slate-950">Diseño y Desarrollo de Software</option>
                                    <option value="Administración de Empresas" className="bg-slate-950">Administración de Empresas</option>
                                    <option value="Contabilidad y Finanzas" className="bg-slate-950">Contabilidad y Finanzas</option>
                                    <option value="Marketing y Gestión de Medios" className="bg-slate-950">Marketing y Gestión de Medios</option>
                                    <option value="Diseño Gráfico" className="bg-slate-950">Diseño Gráfico</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                                        <Calendar className="w-4 h-4" />
                                    </span>
                                    <select
                                        value={ciclo}
                                        onChange={(e) => setCiclo(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-cyan-500/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors appearance-none"
                                    >
                                        <option value="" className="bg-slate-950">Ciclo</option>
                                        <option value="1er Ciclo" className="bg-slate-950">1er Ciclo</option>
                                        <option value="2do Ciclo" className="bg-slate-950">2do Ciclo</option>
                                        <option value="3er Ciclo" className="bg-slate-950">3er Ciclo</option>
                                        <option value="4to Ciclo" className="bg-slate-950">4to Ciclo</option>
                                        <option value="5to Ciclo" className="bg-slate-950">5to Ciclo</option>
                                        <option value="6to Ciclo" className="bg-slate-950">6to Ciclo</option>
                                    </select>
                                </div>

                                <div className="relative">
                                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                                        <MapPin className="w-4 h-4" />
                                    </span>
                                    <select
                                        value={sede}
                                        onChange={(e) => setSede(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-cyan-500/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors appearance-none"
                                    >
                                        <option value="" className="bg-slate-950">Sede</option>
                                        <option value="Ate" className="bg-slate-950">Ate</option>
                                        <option value="San Juan de Lurigancho" className="bg-slate-950">San Juan de Lurigancho</option>
                                        <option value="Lima Centro" className="bg-slate-950">Lima Centro</option>
                                        <option value="Norte" className="bg-slate-950">Norte</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-orbitron font-bold text-xs uppercase rounded-xl tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isLogin ? (
                            'Ingresar'
                        ) : (
                            'Crear Perfil'
                        )}
                    </button>
                </form>

                {}
                <div className="text-center mt-6 relative z-10">
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-xs text-slate-400 hover:text-cyan-400 font-rajdhani tracking-wider transition-colors focus:outline-none"
                    >
                        {isLogin 
                            ? '¿No tienes un perfil? Créalo aquí' 
                            : '¿Ya tienes un perfil? Inicia sesión aquí'}
                    </button>
                </div>
            </div>
        </div>
    );
}
