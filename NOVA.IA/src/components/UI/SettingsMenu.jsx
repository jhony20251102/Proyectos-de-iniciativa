import React, { useState } from 'react';
import { Brain, Mic, MicOff, RefreshCw, Upload, PlayCircle, VolumeX, Volume2, Zap, ChevronLeft, ChevronRight, Video, Database, Megaphone, Hand, Music } from 'lucide-react';

const SettingsMenu = ({
    show,
    onClose,
    currentName,
    adminAuthStatus,
    memoryCount,
    micEnabled,
    onToggleMic,
    onRotate,
    rotation,
    onOpenUpload,
    onPlayPromo,
    isMuted,
    onToggleMute,
    onReset,
    onGreeting,
    onDancing,
    launchTime,
    tutorials,
    ads, 
    onPlayTutorial
}) => {
    const [view, setView] = useState('main'); 

    if (!show) return null;

    const renderMainView = () => (
        <div className="flex flex-col gap-3 md:gap-6 animate-in fade-in duration-300">
            {}
            <div className="bg-slate-800/40 p-3 md:p-5 rounded-xl md:rounded-[2rem] border border-white/5 shadow-inner">
                <div className="space-y-2 md:space-y-4">
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter">Usuario de Sesión</span>
                        <span className="text-cyan-400 font-mono font-bold bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-400/10">{currentName || 'Alumno'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter">Nivel de Acceso</span>
                        <span className={`font-bold px-2 py-0.5 rounded border text-[9px] ${adminAuthStatus === 'authorized'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-slate-700/20 text-slate-400 border-white/10'
                            }`}>
                            {adminAuthStatus === 'authorized' ? 'ADMINISTRADOR' : 'ESTUDIANTE'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <Database className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-slate-500 font-bold uppercase tracking-tighter">Base de Memoria</span>
                        </div>
                        <span className="text-purple-400 font-bold bg-purple-400/5 px-3 py-0.5 rounded-full border border-purple-400/10">
                            {memoryCount || 0} ITEMS
                        </span>
                    </div>
                </div>
            </div>

            {}
            <div className="grid grid-cols-3 md:grid-cols-2 gap-2 md:gap-3">
                <button
                    onClick={onToggleMic}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 md:p-4 rounded-xl md:rounded-[1.5rem] transition-all border group relative overflow-hidden ${micEnabled ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}
                    title={micEnabled ? "Silenciar Micrófono" : "Activar Micrófono"}
                >
                    {micEnabled ? <Mic className="w-4 h-4 md:w-6 md:h-6 animate-pulse" /> : <MicOff className="w-4 h-4 md:w-6 md:h-6" />}
                    <span className="text-[10px] font-bold tracking-widest">{micEnabled ? "ACTIVO" : "MUDO"}</span>
                </button>

                <button onClick={onRotate} className="flex flex-col items-center justify-center gap-1.5 p-2.5 md:p-4 rounded-xl md:rounded-[1.5rem] bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:border-cyan-500/40 transition-colors group">
                    <RefreshCw className="w-4 h-4 md:w-6 md:h-6 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[9px] font-bold tracking-widest leading-none text-center">ROTACIÓN<br /><span className="text-cyan-400 font-mono text-[10px]">{rotation}°</span></span>
                </button>

                <button onClick={() => { onGreeting(); onClose(); }} className="flex flex-col items-center justify-center gap-1.5 p-2.5 md:p-4 rounded-xl md:rounded-[1.5rem] bg-slate-800/50 border border-slate-700/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                    <Hand className="w-4 h-4 md:w-6 md:h-6 group-hover:-rotate-12 transition-transform" />
                    <span className="text-[10px] font-bold tracking-widest">SALUDAR</span>
                </button>

                <button onClick={() => { onDancing(); onClose(); }} className="flex flex-col items-center justify-center gap-1.5 p-2.5 md:p-4 rounded-xl md:rounded-[1.5rem] bg-slate-800/50 border border-slate-700/50 text-pink-400 hover:bg-pink-500/10 hover:border-pink-500/30 transition-all group">
                    <Music className="w-4 h-4 md:w-6 md:h-6 group-hover:scale-110 transition-transform animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest">BAILAR</span>
                </button>

                <button onClick={() => setView('tutorials')} className="flex flex-col items-center justify-center gap-1.5 p-2.5 md:p-4 rounded-xl md:rounded-[1.5rem] bg-slate-800/50 border border-slate-700/50 text-cyan-400 hover:bg-cyan-500/5 transition-colors group">
                    <Video className="w-4 h-4 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold tracking-widest">TUTORIALES</span>
                </button>

                <button onClick={() => setView('ads')} className="flex flex-col items-center justify-center gap-1.5 p-2.5 md:p-4 rounded-xl md:rounded-[1.5rem] bg-slate-800/50 border border-slate-700/50 text-purple-400 hover:bg-purple-500/5 transition-colors group">
                    <Megaphone className="w-4 h-4 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold tracking-widest">PUBLICIDAD</span>
                </button>
            </div>

            {}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-white/10">
                <button
                    onClick={onToggleMute}
                    className={`flex items-center justify-between w-full px-5 py-3 rounded-2xl transition-all border font-bold tracking-widest text-[11px] ${isMuted ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800'}`}
                >
                    <div className="flex items-center gap-3">
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        <span>{isMuted ? "SISTEMA SILENCIADO" : "AUDIO DEL SISTEMA"}</span>
                    </div>
                    <span className={isMuted ? "text-red-500" : "text-cyan-500"}>{isMuted ? "OFF" : "ON"}</span>
                </button>

                <button onClick={onOpenUpload} className="flex items-center justify-between w-full px-5 py-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-[11px] text-emerald-400 hover:bg-emerald-500/5 transition-colors uppercase font-bold tracking-widest">
                    <div className="flex items-center gap-3">
                        <Upload className="w-4 h-4" />
                        <span>Cargar Memoria</span>
                    </div>
                </button>

                <button onClick={onReset} className="flex items-center justify-between w-full px-5 py-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-[11px] text-amber-500 hover:bg-amber-500/5 transition-colors uppercase font-bold tracking-widest">
                    <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4" />
                        <span>Reiniciar Nova</span>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderTutorialsView = () => (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <button
                onClick={() => setView('main')}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-2 group"
            >
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold font-orbitron uppercase tracking-widest">Regresar</span>
            </button>

            <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto px-1 custom-scrollbar">
                {Object.entries(tutorials || {}).map(([key, tutorial]) => (
                    <button
                        key={key}
                        onClick={() => {
                            onPlayTutorial(tutorial.path);
                            onClose();
                        }}
                        className="flex items-center gap-5 w-full p-4 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-lg">
                            <PlayCircle className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className="text-[13px] font-bold text-slate-200 truncate w-full text-left">{tutorial.title}</span>
                            <span className="text-[9px] text-slate-500 font-medium uppercase tracking-[0.2em]">Video Tutorial HD</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-cyan-400 ml-auto transition-colors" />
                    </button>
                ))}
            </div>
        </div>
    );

    const renderAdsView = () => (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <button
                onClick={() => setView('main')}
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-2 group"
            >
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold font-orbitron uppercase tracking-widest">Regresar</span>
            </button>

            <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto px-1 custom-scrollbar">
                {Object.entries(ads || {}).map(([key, ad]) => (
                    <button
                        key={key}
                        onClick={() => {
                            onPlayPromo(ad.path);
                            onClose();
                        }}
                        className="flex items-center gap-5 w-full p-4 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-purple-500/30 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-lg">
                            <Megaphone className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className="text-[13px] font-bold text-slate-200 truncate w-full text-left">{ad.title}</span>
                            <span className="text-[9px] text-slate-500 font-medium uppercase tracking-[0.2em]">Publicidad Certus</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-purple-400 ml-auto transition-colors" />
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="absolute top-12 md:top-24 right-2 md:right-8 z-50 max-w-[92vw]">
            <div className="min-w-[280px] md:min-w-[360px] backdrop-blur-[40px] bg-slate-950/90 p-4 md:p-8 rounded-2xl md:rounded-[3.5rem] shadow-[0_0_120px_rgba(0,0,0,0.95)] border border-cyan-500/15 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 10px; }
                `}</style>

                <h3 className="text-cyan-400 font-bold mb-4 md:mb-8 text-sm md:text-xl flex items-center justify-between border-b border-white/10 pb-3 md:pb-5" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    <div className="flex items-center gap-2 md:gap-4"><Brain className="w-5 h-5 md:w-8 md:h-8 animate-pulse text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]" /> CONFIGURACIÓN</div>
                    <span className="text-[8px] md:text-[10px] text-slate-600 font-mono tracking-widest bg-slate-900 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-white/5">V5.3</span>
                </h3>

                {view === 'main' ? renderMainView() : view === 'tutorials' ? renderTutorialsView() : renderAdsView()}
            </div>
        </div>
    );
};

export default SettingsMenu;
