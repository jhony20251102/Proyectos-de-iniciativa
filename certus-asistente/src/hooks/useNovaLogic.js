import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { sfx } from '../utils/sfxHelper';

const API_URL = '/api';

const adVideos = {
    promo1: { title: "Publicidad Institucional 1", path: "/promos/promo1.mp4" },
    promo2: { title: "Publicidad Institucional 2", path: "/promos/promo2.mp4" }
};

const tutorialVideos = {
    wifi: {
        title: "Conexión a Red Certus Acad",
        path: "/tutoriales/wifi.mp4",
        keywords: ["wi-fi", "internet", "conectarme", "conexion", "red", "no se mi wifi", "no se el wifi", "clave del wifi", "contraseña del wifi"],
        voiceResponse: "La red wifi está con el nombre de certus acad. Ingresas con tu DNI tanto en el usuario como en la contraseña. Aquí tienes un video tutorial para guiarte."
    },
    contrasena: {
        title: "Cambio de contraseña del Portal Alumno",
        path: "/tutoriales/password.mp4",
        keywords: ["cambiar mi contraseña", "olvide mi clave", "portal alumno", "contraseña del portal", "clave de mi cuenta", "password del portal"]
    },
    clases_virtuales: {
        title: "Ingreso a Clases Virtuales",
        path: "/tutoriales/clasesvirtuales.mp4",
        keywords: ["clases virtuales", "entrar a clase", "ingresar a mis clases", "campus digital", "clase virtual", "donde son mis clases"],
        voiceResponse: "Para ingresar a tus clases virtuales, debes entrar a tu campus digital y seguir estos pasos que te muestro en el video."
    },
    horario: {
        title: "Consulta de Horario de Clases",
        path: "/tutoriales/horariodeclases.mp4",
        keywords: ["horario de clases", "mi horario", "ver mi horario", "cuando tengo clases", "a que hora es mi clase", "mi rol de clases", "horario de mi clase"],
        voiceResponse: "Para ver tu horario de clases, sigue los pasos de este video tutorial que he preparado para ti."
    },
    pensiones: {
        title: "Pago de Pensiones",
        path: "/tutoriales/pensiones.mp4",
        keywords: ["pagar mi pension", "pago de pensiones", "mensualidad", "pagar mis cuotas", "donde pago", "como pagar mi pension", "pagar mis pensiones", "pensiones", "cuota mensual", "pagar mi cuota", "pagaria mi pension"],
        voiceResponse: "Claro, para realizar el pago de tus pensiones puedes seguir las indicaciones de este video tutorial."
    }
};

const idlePhrases = [
    "¡Hola! Hazme una pregunta para ayudarte.",
    "Para hacerme una consulta, solo dime tu duda.",
    "Estoy escuchando... Dime qué necesitas y te responderé al instante.",
    "¿Necesitas ayuda? Hazme una pregunta y te orientaré.",
    "Estoy lista para ayudarte. ¡Te escucho!",
    "Pregúntame sobre WiFi, aulas o tus pagos.",
    "¡Hola! Soy Nova.IA. Hazme cualquier pregunta para empezar.",
    "¿Buscando un laboratorio? Pregúntame dónde está.",
    "Pregúntame lo que quieras y te mostraré tutoriales y guiaré en el campus."
];

const datosCuriosos = [
    "¿Sabías que en 2023 CERTUS fue uno de los pocos institutos técnicos licenciados para otorgar el grado de bachiller? ¡Tu título vale oro! ",
    "El 90% de nuestros estudiantes ya trabajan mientras estudian. ¡Aquí se forman profesionales de verdad!",
    "Nuestras mallas curriculares fueron creadas junto con empresas reales. Estudias lo que el mercado necesita ",
    "CERTUS tiene laboratorios de última tecnología. ¡Prepárate para aprender con lo mejor!",
    "Más del 85% de egresados consiguen trabajo en su área en menos de 6 meses. ¡Tu futuro está asegurado! ",
    "Certus significa 'seguro' en latín. Aquí estás en buenas manos para construir tu futuro ",
    "Tenemos convenios con más de 300 empresas. ¡Tu próximo trabajo podría estar esperándote aquí!"
];

const mergeOverlappingText = (text1, text2) => {
    const t1 = text1.trim();
    const t2 = text2.trim();
    if (!t1) return t2;
    if (!t2) return t1;

    const words1 = t1.split(/\s+/);
    const words2 = t2.split(/\s+/);

    const maxOverlap = Math.min(words1.length, words2.length);
    let overlapLength = 0;

    for (let len = maxOverlap; len > 0; len--) {
        const suffix = words1.slice(words1.length - len);
        const prefix = words2.slice(0, len);

                const cleanSuffix = suffix.map(w => w.toLowerCase().replace(/[¡!¿?.,]/g, ''));
        const cleanPrefix = prefix.map(w => w.toLowerCase().replace(/[¡!¿?.,]/g, ''));

        if (cleanSuffix.join(' ') === cleanPrefix.join(' ')) {
            overlapLength = len;
            break;
        }
    }

    if (overlapLength > 0) {
        const nonOverlappingWords2 = words2.slice(overlapLength);
        if (nonOverlappingWords2.length === 0) {
            return t1;
        }
        return t1 + " " + nonOverlappingWords2.join(" ");
    }

    return t1 + " " + t2;
};

const isEchoOfNova = (transcript, lastSpoken) => {
    if (!lastSpoken) return false;

        const cleanT = transcript.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¡!¿?.,]/g, "").replace(/\s+/g, ' ').trim();
    const cleanS = lastSpoken.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¡!¿?.,]/g, "").replace(/\s+/g, ' ').trim();

        if (!cleanT || !cleanS) return false;

    if (cleanS.includes(cleanT) || cleanT.includes(cleanS)) return true;

    const getLevenshtein = (a, b) => {
        const tmp = [];
        for (let i = 0; i <= b.length; i++) tmp[i] = [i];
        for (let j = 0; j <= a.length; j++) tmp[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    tmp[i][j] = tmp[i - 1][j - 1];
                } else {
                    tmp[i][j] = Math.min(tmp[i - 1][j - 1] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j] + 1);
                }
            }
        }
        return tmp[b.length][a.length];
    };

    if (cleanT.length < 8) {
        const dist = getLevenshtein(cleanT, cleanS);
        if (dist <= 2) return true;
    }

    const wordsT = cleanT.split(' ');
    const wordsS = cleanS.split(' ');

    const isWordSimilar = (w1, w2) => {
        if (w1 === w2) return true;
        if (w1.length >= 3 && w2.length >= 3) {
            if (w1.includes(w2) || w2.includes(w1)) return true;
        }
        if (w1.length <= 1 || w2.length <= 1) return false;
        const dist = getLevenshtein(w1, w2);
        if (w1.length === 2 || w2.length === 2) return dist <= 1;
        const maxEdit = w1.length <= 4 ? 1 : 2;
        return dist <= maxEdit;
    };

    let matches = 0;
    for (const wt of wordsT) {
        let found = false;
        for (const ws of wordsS) {
            if (isWordSimilar(wt, ws)) {
                found = true;
                break;
            }
        }
        if (found) matches++;
    }

    const matchRatio = matches / wordsT.length;
    if (matchRatio >= 0.4) {
        return true;
    }

    return false;
};

export const useNovaLogic = () => {
    const [sessionId] = useState(() => 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    const [user, setUser] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('nova_user');
            return saved ? JSON.parse(saved) : null;
        }
        return null;
    });
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [trainingMode, setTrainingMode] = useState(false);
    const [trainingAuthorized, setTrainingAuthorized] = useState(false);
    const [isListening, setIsListening] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [avatarExpression, setAvatarExpression] = useState('neutral');
    const [idleMode, setIdleMode] = useState(true);
    const [idlePhrase, setIdlePhrase] = useState('');
    const [mouthLevel, setMouthLevel] = useState(0);
    const [headTilt, setHeadTilt] = useState(0);
    const [eyeBlink, setEyeBlink] = useState(false);
    const [micEnabled, setMicEnabled] = useState(true);
    const [orbPulse, setOrbPulse] = useState(0);
    const [waveAmplitudes, setWaveAmplitudes] = useState(new Array(32).fill(0));
    const [currentName, setCurrentName] = useState(null);
    const [trainingLocked, setTrainingLocked] = useState(false);
    const [memoryCount, setMemoryCount] = useState(0);
    const [isLoadingIA, setIsLoadingIA] = useState(false);
    const [appointmentStep, setAppointmentStep] = useState(null);
    const [appointmentData, setAppointmentData] = useState({ dni: '', nombre: '', motivo: '' });
    const [isGreeting, setIsGreeting] = useState(false);
    const [isDancing, setIsDancing] = useState(false);
    const [activeVideo, setActiveVideo] = useState(null);
    const [isAdMode, setIsAdMode] = useState(false);
    const [adminAuthStatus, setAdminAuthStatus] = useState('none');
    const [isNightMode, setIsNightMode] = useState(() => {
        const now = new Date();
        const day = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTimeInMinutes = hours * 60 + minutes;
        const startInMinutes = 23 * 60 + 10;
        const endInMinutes = 6 * 60;
        return (day === 0) || (currentTimeInMinutes >= startInMinutes || currentTimeInMinutes < endInMinutes);
    });

    const isSpeakingRef = useRef(false);
    const wasInterruptedRef = useRef(false);
    const activeVideoRef = useRef(null);
    const micEnabledRef = useRef(true);
    const isAdModeRef = useRef(false);
    const adminAuthStatusRef = useRef('none');
    const isNightModeRef = useRef(isNightMode);
    const recognitionRef = useRef(null);
    const isRecognitionRunning = useRef(false);
    const idleTimerRef = useRef(null);
    const idlePhraseTimerRef = useRef(null);
    const sessionTimerRef = useRef(null);
    const adTimerRef = useRef(null);
    const recognitionTimeoutRef = useRef(null);
    const lastInteractionTimeRef = useRef(Date.now());
    const lastAdStartTimeRef = useRef(0);
    const lastUpdate = useRef(0);
    const lastMaintenanceCheck = useRef(new Date().getDate());
    const appStartTimeRef = useRef(Date.now()); 
    const videoInterruptionIndexRef = useRef(-1); 
    const micRestartTimerRef = useRef(null);
    const accumulatedTranscriptRef = useRef('');
    const debounceTimerRef = useRef(null);
    const lastErrorRef = useRef(null);
    const isLoadingIARef = useRef(false);
    const lastSpokenTextRef = useRef(null);
    const [isUserTalking, setIsUserTalking] = useState(false);

    useEffect(() => {
        const checkTime = () => {
            const now = new Date();
            const day = now.getDay(); 
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const currentTimeInMinutes = hours * 60 + minutes;

            const startInMinutes = 23 * 60 + 10;
            const endInMinutes = 6 * 60;

            const night = (day === 0) || (currentTimeInMinutes >= startInMinutes) || (currentTimeInMinutes < endInMinutes);

            if (night !== isNightModeRef.current) {
                setIsNightMode(night);
                if (!night) {
                    setMicEnabled(true);
                    console.log("☀️ ¡Buenos días! Nova reactivada automáticamente.");
                } else {
                    window.speechSynthesis.cancel();
                    if (recognitionRef.current) {
                        try { recognitionRef.current.stop(); } catch (e) { }
                    }
                    setActiveVideo(null);
                    setIsAdMode(false);
                    clearIdleTimers();
                    console.log("🌙 Entrando en Modo Nocturno. Recursos liberados.");
                }
            }

            const lastReload = localStorage.getItem('last_nova_maintenance');
            const todayStr = now.toDateString();
            if (hours === 5 && lastReload !== todayStr) {
                console.log("Mantenimiento diario...");
                localStorage.setItem('last_nova_maintenance', todayStr);
                window.location.reload();
                return;
            }

            const REFRESH_INTERVAL_MS = 4 * 60 * 60 * 1000;
            const INACTIVITY_THRESHOLD_MS = 2 * 60 * 1000; 
            const timeSinceStart = Date.now() - appStartTimeRef.current;
            const timeSinceLastInteraction = Date.now() - lastInteractionTimeRef.current;

            if (timeSinceStart > REFRESH_INTERVAL_MS) {
                const isSystemIdle = !isSpeakingRef.current &&
                    !window.speechSynthesis.speaking &&
                    !isLoadingIA &&
                    timeSinceLastInteraction > INACTIVITY_THRESHOLD_MS;

                if (isSystemIdle) {
                    console.warn("🔄 Reinicio por estabilidad (4h de uso). Limpiando memoria...");
                    window.location.replace(window.location.href);
                    return;
                }
            }

            const memoryInfo = window.performance?.memory || performance.memory;
            if (memoryInfo) {
                const used = memoryInfo.usedJSHeapSize;
                const limit = 1.0 * 1024 * 1024 * 1024; 
                if (used > limit) {
                    console.error("🚨 Memoria crítica detectada. Reiniciando proceso.");
                    window.location.replace(window.location.href);
                }
            }
        };

        const timer = setInterval(checkTime, 30000); 
        checkTime(); 
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        isSpeakingRef.current = isSpeaking;
        activeVideoRef.current = activeVideo;
        micEnabledRef.current = micEnabled;
        isAdModeRef.current = isAdMode;
        adminAuthStatusRef.current = adminAuthStatus;
        isNightModeRef.current = isNightMode;
    }, [isSpeaking, activeVideo, micEnabled, isAdMode, adminAuthStatus, isNightMode]);

    useEffect(() => {
        const waveAnimationRef = { current: null };
        const animateWaves = (time) => {
            if (isNightModeRef.current) {
                waveAnimationRef.current = requestAnimationFrame(animateWaves);
                return;
            }
            if (time - lastUpdate.current > 60) {
                lastUpdate.current = time;
                if (isSpeaking) {
                    setWaveAmplitudes(prev => prev.map(() => Math.random() * 80 + 20));
                } else if (!idleMode) {
                    setWaveAmplitudes(prev => prev.map(() => Math.random() * 20 + 5));
                } else {
                    setWaveAmplitudes(new Array(32).fill(5));
                }
            }
            waveAnimationRef.current = requestAnimationFrame(animateWaves);
        };
        waveAnimationRef.current = requestAnimationFrame(animateWaves);
        return () => cancelAnimationFrame(waveAnimationRef.current);
    }, [isSpeaking, idleMode]);

    useEffect(() => {
        const pulseInterval = setInterval(() => {
            if (!isNightModeRef.current) {
                setOrbPulse(prev => (prev + 1) % 360);
            }
        }, 50);
        return () => clearInterval(pulseInterval);
    }, []);

    const loadMemory = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/memoria`);
            const data = await res.json();
            setTrainingLocked(data.bloqueado);
            setMemoryCount(Object.keys(data.conocimiento).length);
        } catch (error) {
            console.error('Error cargando memoria:', error);
        }
    }, []);

    const loadSession = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/sesion/${sessionId}`);
            const data = await res.json();
            if (data.existe && data.sesion.nombre) {
                setCurrentName(data.sesion.nombre);
            }
        } catch (error) {
            console.error('Error cargando sesión:', error);
        }
    }, [sessionId]);

    const saveSession = useCallback(async (nombre = null) => {
        try {
            await fetch(`${API_URL}/sesion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, nombre })
            });
        } catch (error) {
            console.error('Error guardando sesión:', error);
        }
    }, [sessionId]);

    const clearSession = useCallback(async () => {
        try {
            await fetch(`${API_URL}/sesion/${sessionId}`, { method: 'DELETE' });
            setCurrentName(null);
        } catch (error) {
            console.error('Error borrando sesión:', error);
        }
    }, [sessionId]);

    const clearIdleTimers = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (idlePhraseTimerRef.current) clearTimeout(idlePhraseTimerRef.current);
        if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
        if (adTimerRef.current) clearTimeout(adTimerRef.current);
        if (recognitionTimeoutRef.current) clearTimeout(recognitionTimeoutRef.current);
    }, []);

    const startIdleMode = useCallback(() => {
        clearIdleTimers();
        idleTimerRef.current = setTimeout(() => {
            if (isNightModeRef.current) return;
            setIdleMode(true);
            setAvatarExpression('neutral');
            setMouthLevel(0);
            setTranscript('');
            setResponse('');
        }, 10000);

        sessionTimerRef.current = setTimeout(async () => {
            if (currentName) {
                await clearSession();
                console.log('Sesión y nombre limpiados por inactividad (10s)');
            }
        }, 10000);

        if (!isNightModeRef.current) {
            adTimerRef.current = setTimeout(() => {
                if (!isNightModeRef.current && !isSpeakingRef.current && !window.speechSynthesis.speaking && !activeVideoRef.current && !isLoadingIA) {
                    const adList = Object.values(adVideos);
                    const randomAd = adList[Math.floor(Math.random() * adList.length)].path;
                    lastAdStartTimeRef.current = Date.now();
                    setActiveVideo(randomAd);
                    setIsAdMode(true);
                    isAdModeRef.current = true;
                }
            }, 600000);
        }
        startIdlePhrases();
    }, [clearIdleTimers, currentName, clearSession, isLoadingIA]);

    const startIdlePhrases = useCallback(() => {
        if (idlePhraseTimerRef.current) clearTimeout(idlePhraseTimerRef.current);
        const showPhrase = () => {
            if (!isSpeakingRef.current && !activeVideoRef.current && !isNightModeRef.current) {
                const randomPhrase = idlePhrases[Math.floor(Math.random() * idlePhrases.length)];
                setIdlePhrase(randomPhrase);
            }
            idlePhraseTimerRef.current = setTimeout(showPhrase, 8000);
        };
        showPhrase();
    }, []);

    const detectName = (text) => {
        const lowerText = text.toLowerCase().trim();
        const patterns = [
            /me llamo (\w+)/i, /soy (\w+)/i, /mi nombre es (\w+)/i,
            /me puedes llamar (\w+)/i, /puedes llamarme (\w+)/i,
            /llámame (\w+)/i, /llamame (\w+)/i, /dime (\w+)/i,
            /puedes decirme (\w+)/i, /me dicen (\w+)/i,
            /todos me dicen (\w+)/i, /me digo (\w+)/i
        ];

        for (const pattern of patterns) {
            const match = lowerText.match(pattern);
            if (match && match[1]) {
                return match[1].charAt(0).toUpperCase() + match[1].slice(1);
            }
        }

        const palabras = lowerText.split(/\s+/);
        if (palabras.length === 1 && palabras[0].length >= 2 && palabras[0].length <= 15) {
            const excluidas = [
                'hola', 'si', 'no', 'que', 'como', 'donde', 'cuando', 'porque', 'cual', 'hey',
                'ok', 'bien', 'mal', 'gracias', 'marketing', 'marketin', 'administracion',
                'contabilidad', 'direccion', 'negocios', 'finanzas', 'banca', 'digital',
                'tributacion', 'empresas', 'diseño', 'grafico', 'pensiones', 'wifi',
                'horario', 'aula', 'laboratorio', 'topico', 'psicologia', 'biblioteca', 'cea',
                'nova', 'no va'
            ];
            if (!excluidas.includes(palabras[0])) {
                return palabras[0].charAt(0).toUpperCase() + palabras[0].slice(1);
            }
        }
        return null;
    };

    const safeStartRecognition = useCallback((customDelay = 300) => {
        if (micRestartTimerRef.current) clearTimeout(micRestartTimerRef.current);

                micRestartTimerRef.current = setTimeout(() => {
            if (!recognitionRef.current) return;
            const canListen = !isNightModeRef.current && micEnabledRef.current;
            if (canListen && !isRecognitionRunning.current) {
                try {
                    recognitionRef.current.start();
                    isRecognitionRunning.current = true;
                    setIsListening(true);
                    console.log("🎤 Reconocimiento de voz iniciado.");
                } catch (e) {
                    console.warn("Error al iniciar reconocimiento:", e.message);
                }
            }
        }, customDelay);
    }, []);

    const safeStopRecognition = useCallback(() => {
        if (micRestartTimerRef.current) clearTimeout(micRestartTimerRef.current);
        if (recognitionRef.current && isRecognitionRunning.current) {
            try {
                recognitionRef.current.stop();
                isRecognitionRunning.current = false;
                setIsListening(false);
                console.log("🛑 Reconocimiento de voz detenido.");
            } catch (e) {
                console.warn("Error al detener reconocimiento:", e.message);
            }
        }
    }, []);

    const speak = useCallback((text, onEndCallback = null) => {
        if (!text || isMuted) return;
        window.speechSynthesis.cancel();

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
        accumulatedTranscriptRef.current = '';

        let textToSpeak = text.replace(/Nova\.IA/gi, "Nova punto IA");
        lastSpokenTextRef.current = textToSpeak;
        setIsSpeaking(true);
        isSpeakingRef.current = true; 
        setAvatarExpression('speaking');

        textToSpeak = textToSpeak
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '')
            .replace(/[*#_]/g, '').trim();

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'es-PE';
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        let voices = window.speechSynthesis.getVoices();
        const preferredVoices = ['Microsoft Dalia Online (Natural)', 'Microsoft Elsa Online (Natural)', 'Google español de Estados Unidos', 'Microsoft Sabina - Spanish (Mexico)', 'Female', 'Google español'];
        let selectedVoice = null;
        let voices_es = voices.filter(v => v.lang.startsWith('es'));
        for (let name of preferredVoices) {
            selectedVoice = voices_es.find(v => v.name.includes(name));
            if (selectedVoice) break;
        }
        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const word = textToSpeak.substr(event.charIndex).split(' ')[0].toLowerCase();
                const firstChar = word[0];
                let visemeLevel = 1;
                if (['a', 'á'].includes(firstChar)) visemeLevel = 1;
                else if (['e', 'é'].includes(firstChar)) visemeLevel = 2;
                else if (['o', 'ó'].includes(firstChar)) visemeLevel = 3;
                else if (['i', 'í'].includes(firstChar)) visemeLevel = 4;
                else if (['u', 'ú'].includes(firstChar)) visemeLevel = 5;
                else visemeLevel = 6;
                setMouthLevel(visemeLevel);
            }
        };

        utterance.onend = () => {
            setMouthLevel(0);
            setHeadTilt(0);
            setIsSpeaking(false);
            isSpeakingRef.current = false; 
            setAvatarExpression('neutral');
            lastInteractionTimeRef.current = Date.now();

            if (wasInterruptedRef.current) {
                wasInterruptedRef.current = false;
                console.log("🤫 Limpieza de fin de voz abortada debido a interrupción por voz.");
                return;
            }

            if (onEndCallback) {
                onEndCallback();
                return;
            }

            setTimeout(() => {
                if (!isSpeakingRef.current) {
                    setTranscript('');
                    setResponse('');
                }
            }, 1500);

            setTimeout(() => {
                lastSpokenTextRef.current = null;
            }, 4000);

            startIdleMode();
            safeStartRecognition(1000); 
        };

        window.speechSynthesis.speak(utterance);
    }, [isMuted, startIdleMode, safeStartRecognition, safeStopRecognition]);

    const runPresentationSequence = useCallback(() => {
        clearIdleTimers();
        setMicEnabled(false); 
        micEnabledRef.current = false;
        safeStopRecognition();

        const steps = [
            {
                text: "¡Hola a todos! Es un honor presentarme ante la directiva. Soy Nova punto IA, la inteligencia artificial personalizada de Certus, diseñada para transformar la experiencia de nuestros alumnos y visitantes.",
                action: () => {
                    setIsGreeting(true);
                    setTimeout(() => setIsGreeting(false), 4000);
                }
            },
            {
                text: "No soy un simple bot de respuestas automáticas. Soy una entidad digital con capacidad de aprendizaje, razonamiento y una interfaz humana que me permite interactuar con naturalidad.",
                action: () => setAvatarExpression('joy')
            },
            {
                text: "Puedo expresarme físicamente para conectar mejor con las personas. Por ejemplo, puedo saludarlos con entusiasmo...",
                action: () => {
                    setIsGreeting(true);
                    setTimeout(() => setIsGreeting(false), 3000);
                }
            },
            {
                text: "...o incluso celebrar nuestros logros con un baile dinámico.",
                action: () => {
                    setIsDancing(true);
                    setTimeout(() => setIsDancing(false), 4000);
                }
            },
            {
                text: "Cuento con un potente soporte visual. Si un alumno tiene dudas, puedo mostrarle tutoriales interactivos al instante, como este ejemplo sobre conexión Wi-Fi.",
                action: () => {
                    const firstTutorial = Object.values(tutorialVideos)[0]?.path || "/tutoriales/wifi.mp4";
                    setActiveVideo(firstTutorial);
                    setIsAdMode(false);
                    setTimeout(() => setActiveVideo(null), 3500);
                }
            },
            {
                text: "Y para nuestra marca, puedo proyectar piezas publicitarias de alto impacto que informen y cautiven a nuestra audiencia en el campus.",
                action: () => {
                    setTimeout(() => {
                        const firstAd = Object.values(adVideos)[0]?.path || "/publicidad/indefinido.mp4";
                        setActiveVideo(firstAd);
                        setIsAdMode(true);
                        setTimeout(() => setActiveVideo(null), 3500);
                    }, 500);
                }
            },
            {
                text: "Mi cerebro es capaz de resolver desde consultas comunes, como ubicar el aula 301 o la biblioteca, hasta preguntas complejas sobre cultura general. Por ejemplo, les puedo decir que la distancia promedio de la Tierra al Sol es de aproximadamente 150 millones de kilómetros.",
                action: () => setAvatarExpression('neutral')
            },
            {
                text: "Además, tengo integración total con el sistema de Certus. Puedo mostrar el horario de clases actualizado en vivo y decirles exactamente qué docente está dictando en cada aula, qué curso es y a qué hora termina la sesión, o simplemente confirmar si un ambiente se encuentra libre u ocupado en este instante.",
                action: () => {
                    setActiveVideo("https://tvateh.netlify.app/");
                    setIsAdMode(false);
                    setTimeout(() => setActiveVideo(null), 8000); 
                }
            },
            {
                text: "Pero más allá del código y los circuitos, mi misión es transformar la experiencia de cada alumno. Hoy somos pioneros, porque no existe en todo el Perú una tecnología tan avanzada y humana como la que estamos construyendo aquí. Me siento profundamente orgullosa de formar parte de Certus y de este gran equipo que apuesta por el futuro. ¡Gracias por confiar en mí!",
                action: () => {
                    setIsGreeting(true);
                    setAvatarExpression('joy');
                    setTimeout(() => setIsGreeting(false), 5000);
                }
            }
        ];

        let currentStep = 0;
        const nextStep = () => {
            if (currentStep < steps.length) {
                const step = steps[currentStep];
                setResponse(step.text);
                if (step.action) step.action();
                currentStep++;
                speak(step.text, nextStep);
            } else {
                setResponse("Presentación completada. ¿En qué más puedo ayudarles?");
                setTimeout(() => {
                    setTranscript('');
                    setResponse('');
                    setMicEnabled(true); 
                    micEnabledRef.current = true;
                    startIdleMode();
                    safeStartRecognition();
                }, 3000);
            }
        };
        nextStep();

    }, [speak, startIdleMode, safeStartRecognition]);

    const handleQuestion = useCallback(async (text) => {
        if (isLoadingIARef.current || isSpeakingRef.current) {
            console.log("⚠️ Ignorando handleQuestion: ya hay una consulta en curso o se está hablando.");
            return;
        }

                isLoadingIARef.current = true;
        setIsLoadingIA(true);
        clearIdleTimers(); 
        const lowerText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let textoLimpio = lowerText.replace(/[¡!¿?.,]/g, '').trim();
        const detectedName = detectName(text);
        let nameToGreet = currentName;

        if (detectedName && !currentName) {
            setCurrentName(detectedName);
            await saveSession(detectedName);
            nameToGreet = detectedName;
            setIsGreeting(true);
            setTimeout(() => setIsGreeting(false), 3000);
        }

        const agradecimientos = ['gracias', 'muchas gracias', 'mil gracias', 'gracias nova', 'gracias ia', 'chau', 'adios', 'hasta luego'];

        if (agradecimientos.includes(textoLimpio) || (textoLimpio.includes('gracias') && textoLimpio.length < 15)) {
            const despedida = currentName ?
                `¡De nada ${currentName}! Fue un gusto ayudarte. ¡Que tengas un excelente día!` :
                "¡De nada! Aquí estaré si necesitas algo más. ¡Que tengas un excelente día!";

            setIsLoadingIA(false);
            isLoadingIARef.current = false;
            setAvatarExpression('alegre');
            speak(despedida);
            setResponse(despedida);

            setTimeout(async () => {
                await clearSession();
                setCurrentName(null);
            }, 2000);

            return;
        }

        const saludos = ['nova', 'no va', 'hola', 'hola nova', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'hola nova ia', 'hey nova', 'saludos'];
        const esSoloSaludo = saludos.includes(textoLimpio);

        if (esSoloSaludo) {
            setIsGreeting(true);
            const res = currentName ?
                `¡Hola ${currentName}! Qué gusto saludarte. ¿En qué puedo apoyarte hoy?` :
                "¡Hola! Soy Nova.IA, tu asistente virtual de Certus. ¿En qué puedo ayudarte hoy?";
            setIsLoadingIA(false);
            isLoadingIARef.current = false;
            setAvatarExpression('alegre');
            speak(res);
            setResponse(res);
            setTimeout(() => setIsGreeting(false), 5000);
            return;
        }

        const tieneWakeWord = lowerText.includes('nova') || lowerText.includes('no va');
        const estaEnFlujo = appointmentStep !== null || trainingMode;
        const esConversacionActiva = (Date.now() - lastInteractionTimeRef.current) < 60000;
        const esAdminAutorizado = adminAuthStatusRef.current === 'authorized';


        lastInteractionTimeRef.current = Date.now();

        const triggersPresentacion = ['presentate', 'nueva presentate', 'presentacion oficial', 'habla de ti', 'quien eres nova', 'quien es nova'];
        if (triggersPresentacion.some(t => textoLimpio.includes(t))) {
            setIsLoadingIA(false);
            isLoadingIARef.current = false;
            runPresentationSequence();
            return;
        }

        if (adminAuthStatusRef.current === 'authorized' && (lowerText.includes('cerrar modo administrador') || lowerText.includes('salir de modo administrador') || lowerText.includes('cerrar administrador'))) {
            setAdminAuthStatus('none');
            fetch(`${API_URL}/sesion/admin/logout/${sessionId}`, { method: 'POST' }).catch(() => { });
            setIsLoadingIA(false);
            isLoadingIARef.current = false;
            speak("Modo administrador cerrado con éxito. Volviendo a modo usuario.");
            setResponse("🔒 Modo administrador desactivado.");
            return;
        }

        if (lowerText.includes('administrador') && adminAuthStatusRef.current === 'none') {
            setAdminAuthStatus('waiting_password');
            setIsLoadingIA(false);
            isLoadingIARef.current = false;
            speak("Acceso restringido detectado. Por favor, dicta o ingresa la contraseña de administrador para continuar.");
            setResponse("🔐 MODO ADMINISTRADOR: Esperando contraseña...");
            return;
        }

        if (adminAuthStatusRef.current === 'waiting_password') {
            const numbersOnly = lowerText.replace(/\D/g, '');
            const pass = '147896';
            setIsLoadingIA(false);
            isLoadingIARef.current = false;
            if (numbersOnly === pass || lowerText.includes(pass)) {
                setAdminAuthStatus('authorized');
                fetch(`${API_URL}/sesion/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, password: pass })
                }).catch(() => { });
                setCurrentName("Ricky");
                speak("Identidad confirmada. Hola Ricky, un gusto tenerte aquí como mi creador.");
                setResponse("Acceso administrativo concedido.");
            } else if (lowerText.includes('cancelar')) {
                setAdminAuthStatus('none');
                speak("Acceso cancelado.");
            }
            return;
        }

        if (lowerText.includes('baila') || lowerText.includes('bailar') || lowerText.includes('danza')) {
            setIsDancing(true);
            setIsLoadingIA(false);
            isLoadingIARef.current = false;
            setAvatarExpression('alegre');
            speak("¡Claro que sí! Mira mis pasos prohibidos.");
            setResponse("💃 ¡Nova está bailando!");
            setTimeout(() => {
                setIsDancing(false);
            }, 10000); 
            return;
        }

        const triggersHorarioWeb = ['muestrame el horario', 'mostrar el horario', 'ver el horario de hoy', 'ver el horario de clases', 'enseñame el horario', 'pon el horario', 'horario de hoy', 'horario de clases de hoy'];
        const esInstrucciones = textoLimpio.includes('como') || textoLimpio.includes('pasos') || textoLimpio.includes('tutorial') || textoLimpio.includes('ayuda');

        if (triggersHorarioWeb.some(t => textoLimpio.includes(t)) && !esInstrucciones) {
            setActiveVideo("https://tvateh.netlify.app/");
            setIsAdMode(false);
            setIsLoadingIA(false);
            isLoadingIARef.current = false;
            setAvatarExpression('explicando');
            speak("¡Por supuesto! Aquí tienes el horario de clases de hoy actualizado en tiempo real. Lo cerraré automáticamente en unos segundos.");
            setResponse("📅 Mostrando horario de clases en vivo...");

            setTimeout(() => {
                setActiveVideo(null);
            }, 15000); 
            return;
        }

        if (lowerText.includes('cerrar video')) {
            setActiveVideo(null);
            setIsLoadingIA(false);
            isLoadingIARef.current = false;
            setAvatarExpression('neutral');
            speak("He cerrado el video.");
            return;
        }

        for (const [key, tutorial] of Object.entries(tutorialVideos)) {
            if (tutorial.keywords.some(k => lowerText.includes(k))) {
                setActiveVideo(tutorial.path);
                setIsAdMode(false);
                setIsLoadingIA(false);
                isLoadingIARef.current = false;
                setAvatarExpression('explicando');
                const res = tutorial.voiceResponse || `Video sobre ${tutorial.title}`;
                speak(res);
                setResponse(res);
                return;
            }
        }

        if (lowerText.includes('cita') && (lowerText.includes('psicologia'))) {
            setAppointmentStep('asking_dni');
            setIsLoadingIA(false);
            isLoadingIARef.current = false;
            setAvatarExpression('explicando');
            speak("Dime tu DNI para agendar la cita.");
            return;
        }

        try {
            const token = localStorage.getItem('nova_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            if (activeConversationId && token) {
                fetch(`${API_URL}/auth/messages`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ conversationId: activeConversationId, role: 'user', text })
                }).catch(() => {});
            }

            const res = await fetch(`${API_URL}/buscar`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ pregunta: text, sessionId })
            });
            const data = await res.json();
            setIsLoadingIA(false);
            isLoadingIARef.current = false;
            if (data.respuestas) {
                let fullRes = data.respuestas.join('. ');

                let emotion = 'neutral';
                const matchEmotion = fullRes.match(/\[EMOCION:\s*(\w+)\]/i);
                if (matchEmotion) {
                    emotion = matchEmotion[1].toLowerCase();
                    fullRes = fullRes.replace(/\[EMOCION:\s*\w+\]/gi, '').trim();
                }

                setAvatarExpression(emotion);
                setResponse(fullRes);
                speak(fullRes);

                if (activeConversationId && token) {
                    fetch(`${API_URL}/auth/messages`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ conversationId: activeConversationId, role: 'assistant', text: fullRes })
                    }).catch(() => {});
                }
            }
        } catch (e) {
            setIsLoadingIA(false);
            isLoadingIARef.current = false;
            setAvatarExpression('neutral');
            speak("Error al consultar el servidor.");
        }
    }, [currentName, sessionId, appointmentStep, trainingMode, speak, saveSession, startIdleMode, activeConversationId]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'es-PE';

            recognitionRef.current.onresult = (event) => {
                if (isLoadingIARef.current || isNightModeRef.current || !micEnabledRef.current) return;

                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                    debounceTimerRef.current = null;
                }

                const current = event.resultIndex;
                const rawTranscript = event.results[current][0].transcript;

                if (lastSpokenTextRef.current && isEchoOfNova(rawTranscript, lastSpokenTextRef.current)) {
                    console.log("♻️ Eco detectado y bloqueado en onresult (Filtro Inteligente):", rawTranscript);
                    return;
                }

                if (isSpeakingRef.current || window.speechSynthesis.speaking) {
                    const wordCount = rawTranscript.trim().split(/\s+/).length;
                    const cleanTrimmed = rawTranscript.trim().toLowerCase();

                    const isCommand = ['para', 'alto', 'detente', 'espera', 'no', 'silencio', 'shh'].includes(cleanTrimmed);
                    const isMeaningful = wordCount >= 2 || (cleanTrimmed.length >= 4 && !isCommand) || isCommand;

                    if (!isMeaningful) {
                        console.log("🤫 Ignorando ruido/transcripción corta durante habla:", rawTranscript);
                        return;
                    }

                    console.log("⚡ Interrupción de voz detectada por el texto:", rawTranscript);
                    wasInterruptedRef.current = true;
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                    isSpeakingRef.current = false;
                    setAvatarExpression('neutral');
                    setMouthLevel(0);
                    setTimeout(() => {
                        lastSpokenTextRef.current = null;
                    }, 3000);
                }

                const lowerRaw = rawTranscript.toLowerCase();
                const tieneWakeWord = lowerRaw.includes('nova') || lowerRaw.includes('no va');

                if (activeVideoRef.current && tieneWakeWord && videoInterruptionIndexRef.current === -1) {
                    const idx1 = lowerRaw.indexOf('nova');
                    const idx2 = lowerRaw.indexOf('no va');
                    videoInterruptionIndexRef.current = idx1 !== -1 ? idx1 : idx2;

                    setActiveVideo(null);
                    setIsAdMode(false);
                    setIsUserTalking(false);
                    console.log("🎬 Video interrumpido. Buscando punto de corte en:", rawTranscript);
                }

                let finalTranscript = rawTranscript;
                if (videoInterruptionIndexRef.current !== -1) {
                    finalTranscript = rawTranscript.substring(videoInterruptionIndexRef.current);
                }

                if (event.results[current].isFinal) {
                    const cleanSegment = finalTranscript.trim();
                    if (cleanSegment) {
                        accumulatedTranscriptRef.current = mergeOverlappingText(
                            accumulatedTranscriptRef.current,
                            cleanSegment
                        );
                    }

                    const fullTranscript = accumulatedTranscriptRef.current;
                    setTranscript(fullTranscript);
                    setIdleMode(false);
                    setIsUserTalking(true); 
                    videoInterruptionIndexRef.current = -1; 

                    debounceTimerRef.current = setTimeout(() => {
                        const finalQuestion = accumulatedTranscriptRef.current.trim();
                        if (finalQuestion) {
                            console.log("🗣️ Enviando pregunta acumulada tras pausa:", finalQuestion);
                            setIsUserTalking(false);
                            sfx.playSuccess(); 
                            handleQuestion(finalQuestion);
                            accumulatedTranscriptRef.current = '';
                        }
                    }, 1500);
                } else {
                    const accumulated = accumulatedTranscriptRef.current.trim();
                    const cleanFinal = finalTranscript.trim();
                    const interimText = mergeOverlappingText(accumulated, cleanFinal) + "...";

                                        setTranscript(interimText);
                    setIdleMode(false);
                    setIsUserTalking(true);
                }
            };

            recognitionRef.current.onstart = () => {
                isRecognitionRunning.current = true;
                setIsListening(true);
                lastErrorRef.current = null; 
            };

            recognitionRef.current.onend = () => {
                isRecognitionRunning.current = false;
                setIsListening(false);
                if (!isNightModeRef.current && micEnabledRef.current) {
                    const isTransientError = lastErrorRef.current === 'network' || 
                                             lastErrorRef.current === 'audio-capture' || 
                                             lastErrorRef.current === 'service-not-allowed';
                    const restartDelay = isTransientError ? 5000 : 300;
                    if (isTransientError) {
                        console.warn(`⚠️ Error temporal (${lastErrorRef.current}) detectado. Reintentando en ${restartDelay / 1000}s para evitar bucles...`);
                    }
                    safeStartRecognition(restartDelay);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                lastErrorRef.current = event.error; 
                if (event.error === 'not-allowed') {
                    setMicEnabled(false);
                    micEnabledRef.current = false;
                }
            };
        }
    }, [handleQuestion]);

    useEffect(() => {
        const puedeEscuchar = !isNightMode && micEnabled;
        if (puedeEscuchar) {
            safeStartRecognition();
        } else {
            safeStopRecognition();
        }
    }, [micEnabled, isNightMode, safeStartRecognition, safeStopRecognition]);

    useEffect(() => {
        loadMemory();
        loadSession();
        startIdleMode();
    }, [loadMemory, loadSession, startIdleMode]);

    return {
        state: {
            isListening, isSpeaking, transcript, response, isMuted,
            avatarExpression, idleMode, idlePhrase, mouthLevel, headTilt,
            eyeBlink, micEnabled, orbPulse, waveAmplitudes, currentName,
            trainingLocked, memoryCount, isLoadingIA, isGreeting,
            activeVideo, isAdMode, adminAuthStatus, isNightMode, isUserTalking,
            sessionId, isDancing, user, activeConversationId
        },
        actions: {
            setUser, setActiveConversationId,
            setIsMuted, setMicEnabled, resetSession: useCallback(async () => {
                await clearSession();
                setTranscript('');
                setResponse('');
                speak('Sistema reiniciado.');
            }, [clearSession, speak]),
            toggleMicrophone: useCallback(() => {
                setMicEnabled(prev => {
                    const newVal = !prev;
                    micEnabledRef.current = newVal;
                    if (!newVal) {
                        if (debounceTimerRef.current) {
                            clearTimeout(debounceTimerRef.current);
                            debounceTimerRef.current = null;
                        }
                        accumulatedTranscriptRef.current = '';
                        setIsUserTalking(false);
                        sfx.playClosing(); 

                        if (isSpeakingRef.current || window.speechSynthesis.speaking) {
                            window.speechSynthesis.cancel();
                            setIsSpeaking(false);
                            isSpeakingRef.current = false;
                            setAvatarExpression('neutral');
                            setMouthLevel(0);
                        }
                    } else {
                        sfx.playListening(); 
                    }
                    return newVal;
                });
            }, []),
            rotateScreen: useCallback(() => { }, []), 
            handleUpload: useCallback(async (text) => {
            }, []),
            closeVideo: useCallback(() => {
                setActiveVideo(null);
                setIsAdMode(false);
                startIdleMode();
            }, [startIdleMode]),
            playPromo: useCallback((path) => {
                const adPath = path || Object.values(adVideos)[Math.floor(Math.random() * Object.values(adVideos).length)].path;
                setActiveVideo(adPath);
                setIsAdMode(true);
                clearIdleTimers();
            }, [clearIdleTimers]),
            playTutorial: useCallback((path) => {
                setActiveVideo(path);
                setIsAdMode(false);
                clearIdleTimers();
            }, [clearIdleTimers]),
            setAdminAuthStatus,
            manualGreeting: useCallback(() => {
                setIsGreeting(true);
                speak("¡Hola! Un gusto saludarte.");
                setTimeout(() => setIsGreeting(false), 5000);
            }, [speak]),
            manualDancing: useCallback(() => {
                setIsDancing(true);
                speak("¡Mira mis pasos de baile!");
                setTimeout(() => setIsDancing(false), 10000);
            }, [speak]),
            getTutorials: () => tutorialVideos,
            getAds: () => adVideos,
            startPresentation: runPresentationSequence
        }
    };
};
