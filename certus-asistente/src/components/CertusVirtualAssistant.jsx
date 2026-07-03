import React, { useState, useMemo, useRef, useEffect } from 'react';
import Avatar3D from './Avatar3D';
import { useNovaLogic } from '../hooks/useNovaLogic';
import InteractionLayer from './UI/InteractionLayer';
import BrandingLayer from './UI/BrandingLayer';
import SettingsMenu from './UI/SettingsMenu';
import { X, PlayCircle, Mic, MicOff, RefreshCw, Upload, Zap, Brain, Sparkles } from 'lucide-react';
import AuthModal from './UI/AuthModal';
import ChatHistorySidebar from './UI/ChatHistorySidebar';



const HolographicOrb = React.memo(({ isSpeaking, idleMode, headTilt, orbPulse, mouthLevel }) => {
  return (
    <div className="relative w-64 h-64 lg:w-80 lg:h-80 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from ${orbPulse}deg, transparent, rgba(0, 212, 255, 0.3), transparent, rgba(139, 92, 246, 0.3), transparent)`, animation: 'spin 8s linear infinite' }} />
      <div className={`absolute w-full h-full rounded-full transition-all duration-500 ${isSpeaking ? 'bg-gradient-to-br from-cyan-400/40 via-purple-500/30 to-cyan-400/40 scale-110 blur-3xl' : !idleMode ? 'bg-gradient-to-br from-cyan-400/25 via-purple-500/20 to-cyan-400/25 scale-105 blur-2xl' : 'bg-gradient-to-br from-cyan-400/15 via-purple-500/10 to-cyan-400/15 blur-xl'}`}></div>
      <div className="relative w-44 h-52 lg:w-52 lg:h-60 rounded-[45%_45%_42%_42%] backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-300" style={{ transform: `rotate(${headTilt}deg)`, background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
        <div className="flex gap-10 lg:gap-12 mb-6 mt-6">
          {[1, 2].map((i) => (
            <div key={i} className="relative">
              <div className={`absolute -inset-2 rounded-full bg-cyan-400/20 blur-lg transition-all duration-300 ${isSpeaking ? 'opacity-100 scale-125' : 'opacity-50'}`}></div>
              <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-400/40 overflow-hidden">
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-cyan-400 via-cyan-500 to-purple-500">
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-900 to-slate-800">
                    <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/90"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="relative h-8 flex items-center justify-center">
          <div className={`relative bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 rounded-full transition-all duration-75 ${mouthLevel === 0 ? 'w-12 h-1' : mouthLevel === 1 ? 'w-16 h-2' : mouthLevel === 2 ? 'w-20 h-3' : 'w-24 h-4'}`}></div>
        </div>
      </div>
    </div>
  );
});

const VoiceWaveform = React.memo(({ isSpeaking, waveAmplitudes }) => {
  
  const generatePath = (offset, amplitudeMult) => {
    const len = waveAmplitudes.length;
    let pathData = "M 0,50";

    for (let i = 0; i < len; i++) {
      const x = (i / (len - 1)) * 400;

      
      const mirroredIndex = i > (len / 2) ? (len - 1) - i : i;
      const amp = waveAmplitudes[mirroredIndex];

      const centerFactor = Math.pow(1 - Math.abs(i - (len - 1) / 2) / (len / 2), 4);

      
      const isEdge = i === 0 || i === len - 1;
      const y = isEdge ? 50 : 50 + (isSpeaking ? (amp * centerFactor * amplitudeMult * 0.7) - (35 * amplitudeMult) : (Math.sin(i + offset) * 1.5));

      pathData += ` L ${x},${y}`;
    }

    pathData += " L 400,50";
    return pathData;
  };

  return (
    <div className="relative w-full max-w-md h-12 md:h-16 lg:h-24 flex items-center justify-center overflow-hidden">
      {}
      <svg viewBox="0 0 400 100" className="w-full h-full preserve-3d" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}>
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {}
        <path
          d={generatePath(2, 0.4)}
          fill="none"
          stroke="rgba(139, 92, 246, 0.15)"
          strokeWidth="0.8"
          className="transition-all duration-500 ease-in-out"
          style={{ filter: 'blur(2px)' }}
        />

        {}
        <path
          d={generatePath(5, 0.6)}
          fill="none"
          stroke="rgba(0, 212, 255, 0.2)"
          strokeWidth="1"
          className="transition-all duration-300 ease-in-out"
        />

        {}
        <path
          d={generatePath(0, 1)}
          fill="none"
          stroke="url(#waveGrad)"
          strokeWidth="1.5"
          filter="url(#glow)"
          className="transition-all duration-200 ease-out"
        />

        {}
        <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(0, 212, 255, 0.03)" strokeWidth="0.5" />
      </svg>

      {}
      <div className={`absolute w-1/4 h-[1px] bg-cyan-400 blur-[15px] transition-opacity duration-700 ${isSpeaking ? 'opacity-20' : 'opacity-0'}`}></div>

      {}
      <div className="absolute bottom-2 flex gap-4">
        <div className={`text-[7px] font-black tracking-[0.6em] uppercase transition-all ${isSpeaking ? 'text-cyan-400 opacity-60' : 'text-slate-700 opacity-10'}`}>
          Quantum_Harmonics
        </div>
      </div>
    </div>
  );
});

const VideoTutorialOverlay = React.memo(({ url, onClose, onEnded, rotation, isAdMode, isUserTalking }) => {
  const videoRef = useRef(null);
  const [isVideoVertical, setIsVideoVertical] = useState(url?.includes('wifi.mp4'));

  
  useEffect(() => {
    return () => {
      
      if (videoRef.current) {
        console.log("🎬 Liberando Video...");
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.load();
        videoRef.current.remove();
      }

      
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          iframe.src = 'about:blank';
          iframe.remove();
        } catch (e) {  }
      });
    };
  }, []);

  if (!url) return null;
  const videoSrc = url.startsWith('/') ? url : `/${url}`;
  const isWeb = url.startsWith('http');

  const handleMetadata = (e) => {
    const { videoWidth, videoHeight } = e.target;
    
    if (!url.includes('wifi.mp4')) {
      setIsVideoVertical(videoHeight > videoWidth);
    } else {
      setIsVideoVertical(true);
    }
  };

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/98 backdrop-blur-3xl transition-all duration-700">
      {}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isAdMode ? 'opacity-20' : 'opacity-10'}`}>
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-500/10 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-purple-500/10 to-transparent"></div>
      </div>

      <div className={`relative w-full flex flex-col items-center justify-center gap-2 ${(isAdMode || !isVideoVertical) ? 'px-0 max-w-full' : 'px-2 max-w-[98vw]'} h-full py-2`}>

        {}
        <div className="flex flex-col items-center gap-2 mb-1 shrink-0">
          {}
          <div className="flex flex-col items-center select-none pointer-events-none">
            <span className="text-white font-orbitron text-3xl lg:text-4xl tracking-[0.4em] font-black drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">CERTUS</span>
            <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent my-0.5"></div>
            <span className="text-cyan-400 font-orbitron text-[10px] tracking-[0.7em] font-bold">NOVA.IA</span>
          </div>

          {}
          <div className="flex items-center gap-3 px-8 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-md">
            <div className="flex gap-1.5 items-center">
              <div className="w-1 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDuration: '1s' }}></div>
              <div className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDuration: '1.2s', animationDelay: '0.1s' }}></div>
              <div className="w-1 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDuration: '1.4s', animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-cyan-400 font-orbitron tracking-[0.4em] font-bold text-[9px] uppercase">
              {isAdMode ? 'Reproduciendo Publicidad' : (isWeb ? 'Visualizando Horario en Vivo' : 'Reproduciendo Tutorial')}
            </span>
            <div className="flex gap-1.5 items-center rotate-180">
              <div className="w-1 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDuration: '1s' }}></div>
              <div className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDuration: '1.2s', animationDelay: '0.1s' }}></div>
              <div className="w-1 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDuration: '1.4s', animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>

        {}
        <div className={`relative transition-all duration-700 ${isWeb
          ? 'h-[75%] w-[95%] max-w-[1200px]'
          : isVideoVertical
            ? 'h-[60vh] md:h-[80vh] lg:h-[90vh] w-[calc(60vh*9/16)] md:w-[calc(80vh*9/16)] lg:w-[calc(90vh*9/16)] max-w-[95vw]'
            : (rotation % 180 === 0 ? 'w-full max-w-[98vw]' : 'w-full max-w-[95vh]') + ' aspect-video'} group shrink-0 min-h-0 flex items-center justify-center`}>
          {}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2.5 rounded-xl bg-black/50 hover:bg-white/10 border border-white/20 text-white transition-all z-[1001] backdrop-blur-md shadow-2xl"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className={`relative w-full h-full ${isWeb ? 'rounded-3xl' : 'rounded-[2.5rem] lg:rounded-[4rem]'} overflow-hidden border transition-all duration-700 shadow-[0_0_120px_rgba(0,0,0,1)] ${isUserTalking ? 'border-cyan-400 scale-[1.01] shadow-[0_0_140px_rgba(6,182,212,0.3)]' : 'border-white/10'}`}>
            {isWeb ? (
              <iframe
                src={url}
                className="w-full h-full border-none bg-white"
                style={{
                  zoom: '0.8',
                  MozTransform: 'scale(0.8)',
                  MozTransformOrigin: '0 0'
                }}
                title="Horario de Clases"
              />
            ) : (
              <video
                ref={videoRef}
                src={videoSrc}
                autoPlay
                playsInline
                controls={!isAdMode}
                className={`w-full h-full object-contain bg-black ${isAdMode ? 'cursor-pointer' : ''}`}
                onEnded={onEnded}
                onLoadedMetadata={handleMetadata}
                onClick={(e) => {
                  if (isAdMode) {
                    if (e.target.paused) e.target.play().catch(err => console.error("Error al reproducir video:", err));
                    else e.target.pause();
                  }
                }}
              />
            )}
          </div>
        </div>

        {}
        <div className="w-full max-w-2xl flex flex-col items-center gap-2 mt-1 shrink-0">
          <div className={`flex items-center gap-4 px-8 py-3 rounded-2xl border backdrop-blur-2xl transition-all duration-500 ${isUserTalking ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.25)]' : 'bg-slate-950/60 border-slate-800/50'}`}>
            <div className={`w-3 h-3 rounded-full ${isUserTalking ? 'bg-cyan-400 animate-pulse ring-4 ring-cyan-400/20' : 'bg-cyan-950'}`}></div>
            <div className="flex flex-col items-center">
              <span className={`text-[12px] font-orbitron tracking-[0.4em] font-bold transition-colors ${isUserTalking ? 'text-cyan-400' : 'text-slate-400'}`}>
                {isUserTalking ? "¡TE ESTOY ESCUCHANDO!" : "NOVA ESTÁ ESCUCHANDO"}
              </span>
              <span className="text-[9px] font-rajdhani text-slate-500 tracking-[0.2em] mt-1 uppercase font-medium">
                PREGUNTA LIBREMENTE EN CUALQUIER MOMENTO
              </span>
            </div>
            <div className={`w-3 h-3 rounded-full ${isUserTalking ? 'bg-cyan-400 animate-pulse ring-4 ring-cyan-400/20' : 'bg-cyan-950'}`}></div>
          </div>

          {}
          <div className={`flex gap-1.5 h-4 transition-all duration-300 ${isUserTalking ? 'opacity-100' : 'opacity-0'}`}>
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-full"
                style={{
                  height: `${Math.random() * 100}%`,
                  animation: isUserTalking ? `pulse 0.4s ease-in-out infinite alternate` : 'none',
                  animationDelay: `${i * 0.02}s`
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

const IntroOverlay = React.memo(({ onStart, avatarLoaded }) => {
  const [isFading, setIsFading] = useState(false);

  const handleStart = () => {
    if (!avatarLoaded) return;
    setIsFading(true);
    setTimeout(() => {
      onStart();
    }, 800);
  };

  return (
    <div className={`fixed inset-0 z-[20000] bg-[#020208] flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ${isFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'}`}>
      {}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      {}
      <div className="absolute inset-0 opacity-20 z-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 4 + 2}s`
            }}
          />
        ))}
      </div>

      {}
      <div className="relative z-10 backdrop-blur-3xl bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 md:p-12 text-center max-w-md w-[90%] shadow-[0_0_80px_rgba(6,182,212,0.15)] flex flex-col items-center gap-6 md:gap-8">
        {}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {}
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 border-t-cyan-400 animate-spin" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-2 rounded-full border border-dashed border-purple-500/20 border-b-purple-400 animate-spin-reverse" style={{ animationDuration: '5s' }}></div>
          
          {}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center border border-white/20 shadow-lg shadow-cyan-500/30">
            <Brain className="w-6 h-6 text-white animate-pulse" />
          </div>
        </div>

        {}
        <div className="flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-widest font-orbitron mb-2" style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 50%, #00d4ff 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 15px rgba(6,182,212,0.3))' }}>
            NOVA.IA
          </h1>
          <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent my-1"></div>
          <p className="text-[11px] md:text-xs font-semibold font-orbitron text-cyan-400 tracking-[0.6em] uppercase">
            Asistente Virtual de Certus
          </p>
        </div>

        {}
        <p className="text-slate-300 font-rajdhani text-sm md:text-base tracking-wide leading-relaxed max-w-xs">
          ¡Hola! Soy tu guía inteligente. Estoy lista para responder tus preguntas sobre el campus, aulas, horarios en vivo y guiarte con tutoriales dinámicos.
        </p>

        {}
        <div className="flex flex-col gap-2.5 w-full text-left bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60 font-rajdhani text-[13px] text-slate-400 tracking-wider">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
            <span>Consulta de Aulas y Laboratorios</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
            <span>Visualización de Horario en Vivo</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
            <span>Comandos y respuestas por voz activa</span>
          </div>
        </div>

        {}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleStart}
            disabled={!avatarLoaded}
            className={`relative group w-full py-4 px-6 rounded-2xl font-orbitron font-bold tracking-widest text-xs uppercase overflow-hidden text-white transition-all duration-300 ${
              avatarLoaded 
                ? 'shadow-[0_0_30px_rgba(6,182,212,0.25)] cursor-pointer' 
                : 'opacity-80 cursor-not-allowed border border-cyan-500/20'
            }`}
          >
            {}
            {avatarLoaded ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-600 to-cyan-500 transition-all duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </>
            ) : (
              <div className="absolute inset-0 bg-slate-950/80" />
            )}
            
            <span className="relative z-10 flex items-center justify-center gap-2">
              {avatarLoaded ? (
                <>
                  Iniciar Experiencia
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </>
              ) : (
                <>
                  Cargando Asistente...
                  <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </>
              )}
            </span>
          </button>

          {!avatarLoaded && (
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 rounded-full animate-pulse"
                style={{ width: '100%', animationDuration: '2.5s' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const NovaIA = () => {
  const { state, actions } = useNovaLogic();
  const [rotation, setRotation] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [conversations, setConversations] = useState([]);

  
  const averageVolume = useMemo(() => {
    if (!state.isSpeaking || !state.waveAmplitudes || state.waveAmplitudes.length === 0) return 0;
    const sum = state.waveAmplitudes.reduce((acc, val) => acc + val, 0);
    return sum / state.waveAmplitudes.length;
  }, [state.isSpeaking, state.waveAmplitudes]);

  useEffect(() => {
    if (state.isNightMode) {
      setAvatarLoaded(true);
    }
  }, [state.isNightMode]);

  
  const fetchHistory = async () => {
    const token = localStorage.getItem('nova_token');
    if (!token) return;
    try {
      const response = await fetch('/api/auth/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error cargando historial de chat:', error);
    }
  };

  useEffect(() => {
    if (state.user) {
      fetchHistory();
    } else {
      setConversations([]);
    }
  }, [state.user]);

  const handleAuthSuccess = (user, token) => {
    actions.setUser(user);
    fetchHistory();
  };

  const handleLogout = () => {
    localStorage.removeItem('nova_token');
    localStorage.removeItem('nova_user');
    actions.setUser(null);
    actions.setActiveConversationId(null);
    setConversations([]);
    setShowSidebar(false);
  };

  const handleSelectConversation = (convId) => {
    actions.setActiveConversationId(convId);
    setShowSidebar(false);
  };

  const handleDeleteConversation = async (convId) => {
    const token = localStorage.getItem('nova_token');
    if (!token) return;
    try {
      const response = await fetch(`/api/auth/conversations/${convId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setConversations(prev => prev.filter(c => c.id !== convId));
        if (state.activeConversationId === convId) {
          actions.setActiveConversationId(null);
        }
      }
    } catch (error) {
      console.error('Error eliminando conversación:', error);
    }
  };

  const handleNewConversation = async () => {
    const token = localStorage.getItem('nova_token');
    if (!token) return;
    try {
      const title = `Chat de ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
      const response = await fetch('/api/auth/conversations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });
      const data = await response.json();
      if (data.success) {
        actions.setActiveConversationId(data.conversationId);
        setConversations(prev => [
          { id: data.conversationId, title: data.title, messages: [] },
          ...prev
        ]);
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Error creando nueva conversación:', error);
    }
  };

  const handleStartIntro = () => {
    setShowIntro(false);
    setTimeout(() => {
      actions.manualGreeting();
    }, 300);
  };

  const isVertical = rotation === 90 || rotation === 270;

  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-center relative bg-main">
      {}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-150 z-[99999]"
        style={{
          border: state.isSpeaking ? '4px solid rgba(6, 182, 212, 0.45)' : '4px solid transparent',
          boxShadow: state.isSpeaking 
            ? `inset 0 0 ${15 + (averageVolume * 0.35)}px rgba(6, 182, 212, ${0.15 + (averageVolume * 0.005)})` 
            : 'none',
          opacity: state.isSpeaking ? 1 : 0
        }}
      />

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px) translateX(0px); } 50% { transform: translateY(-30px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        .animate-spin-reverse { animation: spin-reverse 8s linear infinite; }
        @import url('https://fonts.googleapis.com/css2?family=Orbitron&family=Rajdhani&display=swap');
      `}</style>

      <div className="transition-all duration-500 flex items-center justify-center relative overflow-hidden" style={{ transform: `rotate(${rotation}deg)`, width: rotation % 180 === 0 ? '100%' : '100vh', height: rotation % 180 === 0 ? '100%' : '100vw' }}>
        <div className="absolute inset-0 z-0 bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 to-transparent"></div>
          {}
          <div className="glow-overlay"></div>
          <div className="glow-overlay-cyan"></div>
        </div>

        <div className="text-white flex flex-col relative w-full h-full z-10">
          <BrandingLayer
            currentName={state.currentName}
            isSpeaking={state.isSpeaking}
            idleMode={state.idleMode}
            micEnabled={state.micEnabled}
            onToggleSettings={() => setShowSettings(!showSettings)}
            user={state.user}
            onToggleAuth={() => setShowAuthModal(true)}
            onToggleSidebar={() => setShowSidebar(true)}
          />

          <SettingsMenu
            show={showSettings}
            onClose={() => setShowSettings(false)}
            currentName={state.currentName}
            adminAuthStatus={state.adminAuthStatus}
            memoryCount={state.memoryCount}
            micEnabled={state.micEnabled}
            onToggleMic={actions.toggleMicrophone}
            onRotate={() => setRotation(r => (r + 90) % 360)}
            rotation={rotation}
            onOpenUpload={() => { setShowUploadPanel(true); setShowSettings(false); }}
            onPlayPromo={actions.playPromo}
            isMuted={state.isMuted}
            onToggleMute={() => actions.setIsMuted(!state.isMuted)}
            onReset={actions.resetSession}
            onGreeting={actions.manualGreeting}
            onDancing={actions.manualDancing}
            tutorials={actions.getTutorials()}
            ads={actions.getAds()}
            onPlayTutorial={actions.playTutorial}
          />

          <div className={`flex-1 flex ${isVertical ? 'flex-col' : 'flex-col lg:flex-row'} items-center justify-center px-4 md:px-6 py-2 md:py-4 gap-3 md:gap-8 mt-10 md:mt-16 overflow-hidden`}>
            <InteractionLayer
              idleMode={state.idleMode}
              idlePhrase={state.idlePhrase}
              transcript={state.transcript}
              isLoadingIA={state.isLoadingIA}
              response={state.response}
              isVertical={isVertical}
            />

            <div className={`${isVertical ? 'w-full' : 'w-full lg:w-auto lg:flex-shrink-0'} flex items-center justify-center min-w-0 lg:min-w-[350px] h-[45vh] md:h-[50vh] lg:h-[70vh] xl:h-[80vh]`}>
              {!state.isNightMode && (
                <Avatar3D 
                  {...state} 
                  showIntro={showIntro} 
                  onLoaded={() => {
                    setAvatarLoaded(true);
                  }} 
                />
              )}
            </div>

            <div className={`${isVertical ? 'w-full' : 'w-full lg:flex-1'} flex flex-col items-center justify-end pb-3 lg:pb-8 gap-1 md:gap-3`}>
              <VoiceWaveform isSpeaking={state.isSpeaking} waveAmplitudes={state.waveAmplitudes} />
              <div className="backdrop-blur-xl bg-slate-800/30 px-2.5 py-1 md:px-3.5 md:py-1.5 rounded-md md:rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${state.micEnabled ? 'bg-cyan-400 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-[10px] md:text-xs text-slate-400 tracking-wider" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{state.micEnabled ? 'MICRÓFONO ACTIVO' : 'PAUSADO'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-3 z-40 pointer-events-none">
            <div className="flex flex-row justify-between items-center text-[7px] md:text-[10px] text-slate-600 font-mono w-full px-3">
              <span>CERTUS-ATE © 2026</span>
              <span>NOVA.IA v5.2.0 | DEV: RICKY</span>
            </div>
          </div>

          {!state.isNightMode && (
            <VideoTutorialOverlay
              url={state.activeVideo}
              onClose={actions.closeVideo}
              onEnded={actions.closeVideo}
              rotation={rotation}
              isAdMode={state.isAdMode}
              isUserTalking={state.isUserTalking}
            />
          )}

          {state.isNightMode && (
            <div className="absolute inset-0 z-[10000] bg-[#010105] flex flex-col items-center justify-center overflow-hidden">
              {}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[120px] animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

              {}
              <div className="absolute inset-0 opacity-20">
                {[...Array(20)].map((_, i) => (
                  <div key={`night-${i}`} className="absolute rounded-full bg-white" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`, opacity: 0.3, animation: `float ${15 + i}s infinite` }} />
                ))}
              </div>

              {}
              <div className="relative z-10 flex flex-col items-center gap-8">
                {}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-spin" style={{ animationDuration: '20s' }}></div>
                  <div className="absolute inset-4 rounded-full border border-purple-500/10 animate-spin-reverse" style={{ animationDuration: '15s' }}></div>
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 blur-sm animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.3)]"></div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <h2 className="text-slate-400 text-6xl font-extralight tracking-[0.3em] font-orbitron opacity-40">
                    S L E E P <span className="text-cyan-800/50">M O D E</span>
                  </h2>
                  <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-slate-700/50 to-transparent"></div>
                  <p className="text-slate-600 font-rajdhani text-lg tracking-[0.2em] uppercase opacity-60">
                    Sincronización de sistemas finalizada
                  </p>
                </div>

                {}
                <div className="mt-12 group cursor-default">
                  <div className="flex items-center gap-4 px-6 py-3 rounded-full border border-slate-800/30 bg-slate-900/20 backdrop-blur-md transition-all duration-700 hover:border-cyan-900/40">
                    <div className="w-2 h-2 rounded-full bg-slate-700 animate-pulse"></div>
                    <span className="text-slate-500 text-xs font-mono tracking-widest uppercase">
                      Reactivación programada: 06:00 AM
                    </span>
                  </div>
                </div>
              </div>

              {}
              <div className="absolute bottom-12 right-12 text-slate-700/40 font-orbitron text-4xl select-none tracking-tighter">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}

          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />

          <ChatHistorySidebar
            isOpen={showSidebar}
            onClose={() => setShowSidebar(false)}
            conversations={conversations}
            activeConversationId={state.activeConversationId}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onNewConversation={handleNewConversation}
            user={state.user}
            onLogout={handleLogout}
          />

          {showIntro && (
            <IntroOverlay 
              onStart={handleStartIntro} 
              avatarLoaded={avatarLoaded}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NovaIA;