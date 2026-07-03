import React from 'react';

const InteractionLayer = ({
    idleMode,
    idlePhrase,
    transcript,
    isLoadingIA,
    response,
    isVertical
}) => {
    return (
        <div className={`${isVertical ? 'w-full' : 'flex-1'} flex flex-col items-center justify-center gap-3 md:gap-6 min-w-0 w-full`}>
            {}
            {idleMode && (
                <div className="text-center transition-all duration-500 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-center gap-2 md:gap-4 mb-1 md:mb-3">
                        <div className="w-1.5 h-1.5 md:w-3 md:h-3 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50"></div>
                        <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif", background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 50%, #00d4ff 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>CERTUS</h1>
                        <div className="w-1.5 h-1.5 md:w-3 md:h-3 rounded-full bg-purple-400 animate-pulse shadow-lg shadow-purple-400/50"></div>
                    </div>
                    <p className="text-base md:text-2xl lg:text-3xl font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>NOVA.IA</p>
                </div>
            )}

            {}
            {idleMode && (
                <div className="text-center max-w-lg px-4 mt-2 md:mt-4">
                    <div className="backdrop-blur-xl bg-slate-800/30 px-6 py-4 rounded-2xl border border-slate-700/50">
                        <p className="text-base lg:text-lg font-medium text-cyan-300/80 leading-relaxed" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{idlePhrase}</p>
                    </div>
                </div>
            )}

            {}
            {!idleMode && transcript && (
                <div className="backdrop-blur-2xl bg-purple-500/10 px-4 py-3 md:px-8 md:py-5 rounded-2xl md:rounded-3xl border border-purple-400/40 w-full max-w-xs md:max-w-lg shadow-[0_0_50px_rgba(139,92,246,0.15)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-[9px] md:text-[10px] text-purple-400 mb-1.5 md:mb-3 font-black tracking-[0.4em] uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>TRANSMISIÓN DE VOZ:</p>
                    <p className="text-base md:text-xl lg:text-2xl text-white font-medium leading-tight" style={{ fontFamily: "'Rajdhani', sans-serif" }}>"{transcript}"</p>
                </div>
            )}

            {}
            {isLoadingIA && (
                <div className="flex flex-col items-center gap-2 py-2 md:py-4">
                    <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></div>
                    </div>
                    <p className="text-[10px] md:text-xs text-cyan-400/60 font-medium tracking-[0.2em]" style={{ fontFamily: "'Orbitron', sans-serif" }}>PROCESANDO RESPUESTA...</p>
                </div>
            )}

            {}
            {response && (
                <div className="backdrop-blur-2xl bg-cyan-500/5 px-4 py-3.5 md:px-8 md:py-6 rounded-2xl md:rounded-3xl border border-cyan-400/50 w-full max-w-xs md:max-w-lg shadow-[0_0_60px_rgba(0,242,255,0.15)] animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="flex items-center gap-2 mb-2 md:mb-4">
                        <div className="w-1 h-3 md:w-1.5 md:h-4 bg-cyan-400 rounded-full"></div>
                        <p className="text-[9px] md:text-[10px] text-cyan-400 font-black tracking-[0.4em] uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>SISTEMA NOVA.IA</p>
                    </div>
                    <p className="text-sm md:text-lg lg:text-xl text-slate-50 leading-relaxed font-medium" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{response}</p>
                </div>
            )}
        </div>
    );
};

export default InteractionLayer;
