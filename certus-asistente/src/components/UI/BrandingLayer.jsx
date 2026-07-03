import React from 'react';
import { Brain, Sparkles, Settings, LogIn, MessageSquare } from 'lucide-react';

const BrandingLayer = ({ 
    currentName, 
    isSpeaking, 
    idleMode, 
    micEnabled, 
    onToggleSettings,
    user,
    onToggleAuth,
    onToggleSidebar
}) => {
    return (
        <div className="absolute top-0 left-0 right-0 z-50">
            <div className="mx-2 mt-2 md:mx-4 md:mt-4 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 shadow-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center border border-white/20 shadow-lg shadow-cyan-500/20 shrink-0">
                            <Brain className="w-4 h-4 text-white" />
                        </div>

                        {user ? (
                            <button
                                onClick={onToggleSidebar}
                                className="flex items-center gap-2 p-1.5 px-3 rounded-lg md:rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 hover:border-cyan-400/30 transition-all font-rajdhani text-xs md:text-sm text-slate-300 hover:text-white"
                                title="Ver Historial"
                            >
                                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="hidden md:inline font-bold">Historial</span>
                            </button>
                        ) : (
                            <button
                                onClick={onToggleAuth}
                                className="flex items-center gap-2 p-1.5 px-3 rounded-lg md:rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 transition-all font-rajdhani text-xs md:text-sm text-cyan-400 hover:text-cyan-300"
                                title="Iniciar Sesión"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                <span className="hidden md:inline font-bold">Acceder</span>
                            </button>
                        )}

                        {user && (
                            <span className="hidden lg:inline font-rajdhani text-xs text-slate-400 tracking-wider">
                                ALUMNO: <strong className="text-white uppercase">{user.nombre.split(' ')[0]}</strong>
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {currentName && (
                            <div className="px-4 py-1.5 rounded-xl text-xs font-medium bg-purple-500/10 border border-purple-400/30 text-purple-300 flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                {currentName}
                            </div>
                        )}

                        <div className={`px-4 py-1.5 rounded-xl text-xs font-medium tracking-wider border flex items-center gap-2 ${isSpeaking
                            ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                            : !idleMode
                                ? 'bg-purple-500/20 border-purple-400/50 text-purple-300'
                                : micEnabled
                                    ? 'bg-slate-800/50 border-slate-600/30 text-slate-400'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-cyan-400 animate-pulse' :
                                !idleMode ? 'bg-purple-400 animate-pulse' :
                                    micEnabled ? 'bg-emerald-400' : 'bg-red-400'
                                }`}></div>
                            {isSpeaking ? 'HABLANDO' : !idleMode ? 'PROCESANDO' : micEnabled ? 'ESCUCHANDO' : 'PAUSADO'}
                        </div>

                        <button
                            onClick={onToggleSettings}
                            className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-300 border border-slate-600/30 hover:border-cyan-400/30 group flex items-center justify-center"
                        >
                            <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandingLayer;
