const aiService = require('../services/aiService');
const ttsService = require('../services/ttsService');
const memoryService = require('../services/memoryService');
const sessionController = require('./sessionController');
const scheduleService = require('../services/scheduleService');
const ragService = require('../services/ragService');

class AIController {
    async buscar(req, res) {
        try {
            const { pregunta, sessionId } = req.body;
            if (!pregunta) return res.status(400).json({ error: 'Pregunta requerida' });

            const preguntaNorm = pregunta.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/ñ/g, 'n')
                .replace(/[¿?¡!.,:;]/g, '')
                .replace(/-/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            console.log(`\n--- NUEVA CONSULTA ---`);
            console.log(`Original: "${pregunta}"`);
            console.log(`Normalizada: "${preguntaNorm}"`);

            sessionController.updateSessionActivity(sessionId);

            const sesion = sessionController.sesionesTemporales[sessionId];
            const tieneWakeWord = preguntaNorm.includes('nova') || preguntaNorm.includes('no va');
            const esAdmin = sesion && sesion.esAdmin;


            const preguntaLimpia = preguntaNorm.replace(/\b(nova|no va)\b/g, '').trim() || "hola";
            console.log(`🎯 Activado por nombre "Nova". Pregunta real: "${preguntaLimpia}"`);

            const memoria = memoryService.getMemoria();
            const conocimiento = memoria.conocimiento || {};
            let respuestasEncontradas = [];

            const patronesNombre = [
                /me llamo ([a-z]+)/i,
                /mi nombre es ([a-z]+)/i,
                /hola soy ([a-z]+)/i,
                /soy ([a-z]+)/i,
                /llamame ([a-z]+)/i
            ];

            for (const pattern of patronesNombre) {
                const matchNombre = preguntaNorm.match(pattern);
                if (matchNombre && matchNombre[1]) {
                    const nombreExtraido = matchNombre[1].charAt(0).toUpperCase() + matchNombre[1].slice(1).toLowerCase();
                    if (sessionController.sesionesTemporales[sessionId]) {
                        sessionController.sesionesTemporales[sessionId].nombre = nombreExtraido;
                    }
                    console.log(`👤 Nombre detectado: ${nombreExtraido}`);
                    break;
                }
            }

            const consultaTiempo = ['que hora es', 'dime la hora', 'que fecha es', 'que dia es hoy', 'que dia estamos', 'cual es la fecha', 'dime el dia'];
            if (consultaTiempo.some(t => preguntaNorm.includes(t))) {
                const ahora = new Date();
                const diasSemanas = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

                const diaSemana = diasSemanas[ahora.getDay()];
                const diaMes = ahora.getDate();
                const mes = meses[ahora.getMonth()];
                const año = ahora.getFullYear();

                let horas = ahora.getHours();
                const ampm = horas >= 12 ? 'PM' : 'AM';
                horas = horas % 12;
                horas = horas ? horas : 12;
                const minutos = ahora.getMinutes().toString().padStart(2, '0');

                let resTiempo = "";
                if (preguntaNorm.includes('hora')) {
                    resTiempo = `Actualmente son las ${horas} con ${minutos} minutos de la ${ampm}.`;
                } else {
                    resTiempo = `Hoy es ${diaSemana}, ${diaMes} de ${mes} del ${año}.`;
                }

                console.log("⏰ Consulta de tiempo procesada.");
                res.json({ respuestas: [resTiempo], nombre: sessionController.getSessionName(sessionId) });
                memoryService.registrarHistorialConsultas(pregunta, resTiempo).catch(() => { });
                return;
            }

            const regexAula = /(\d{3,4})/;
            const matchAula = preguntaNorm.match(regexAula);

            const esConsultaUbicacion = /\b(donde|ubicacion|piso|como llego|donde queda|queda)\b/i.test(preguntaNorm);
            const esConsultaClase = /\b(clase|curso|clases|ambiente|salon|esta ocupado|esta libre|quien dicta|que hay en)\b/i.test(preguntaNorm) || (preguntaNorm.includes('aula') && !esConsultaUbicacion);

            if (matchAula && esConsultaClase && !esConsultaUbicacion) {
                const roomNum = matchAula[1];
                console.log(`🏫 Detectada consulta de clase en aula: ${roomNum}. Consultando horario en vivo...`);
                const infoClase = await scheduleService.checkClassInRoom(roomNum);

                if (infoClase) {
                    const resClase = `Justo ahora en el aula ${roomNum} se está dictando el curso de "${infoClase.curso}" con el docente ${infoClase.docente}. La clase termina a las ${infoClase.fin}`;
                    console.log("✅ Clase encontrada en vivo.");
                    res.json({ respuestas: [resClase], nombre: sessionController.getSessionName(sessionId) });

                    memoryService.registrarHistorialConsultas(pregunta, resClase).catch(() => { });
                    return;
                } else {
                    const resLibre = `He revisado el horario y por ahora el aula ${roomNum} está libre. No hay ninguna clase programada en este momento.`;
                    console.log("ℹ️ No hay clase activa en aula detectada.");
                    res.json({ respuestas: [resLibre], nombre: sessionController.getSessionName(sessionId) });

                    memoryService.registrarHistorialConsultas(pregunta, resLibre).catch(() => { });
                    return;
                }
            }

            let matchesEspecificos = [];
            for (const [key, value] of Object.entries(conocimiento)) {
                if (key.startsWith('_LABEL_')) continue;
                const keyNorm = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ñ/g, 'n');
                const sinonimos = keyNorm.split('|').map(s => s.trim());
                for (const sin of sinonimos) {
                    if (sin.length > 2 && preguntaNorm.includes(sin)) {
                        matchesEspecificos.push({ value, length: sin.length });
                    }
                }
            }

            if (matchesEspecificos.length > 0) {
                matchesEspecificos.sort((a, b) => b.length - a.length);
                respuestasEncontradas.push(matchesEspecificos[0].value);
            }

            let contextoFinal = "";

            const ragResults = ragService.search(preguntaLimpia, 3);
            if (ragResults && ragResults.length > 0) {
                const ragText = ragResults.map(r => `[REGLAMENTO - ${r.title}]: ${r.content}`).join('\n');
                contextoFinal += `\nDATOS Y REGLAMENTOS DE CERTUS EXTRAÍDOS DEL MANUAL:\n${ragText}\n`;
            }

            if (respuestasEncontradas.length > 0) {
                const infoLocal = respuestasEncontradas.slice(0, 3).join('\n');
                contextoFinal += `\nINFORMACIÓN COMPLEMENTARIA DE CERTUS:\n${infoLocal}`;
            } else if (!ragResults || ragResults.length === 0) {
                contextoFinal += `\nInformación general: La Directora es Tatiana Tuesta y nuestra web oficial es certus.edu.pe.`;
            }

            let userProfile = null;
            let userMemories = [];
            const authHeader = req.headers.authorization;
            if (authHeader) {
                try {
                    const token = authHeader.split(' ')[1];
                    if (token) {
                        const jwt = require('jsonwebtoken');
                        const JWT_SECRET = process.env.JWT_SECRET || 'nova_ia_secret_token_12345';
                        const decoded = jwt.verify(token, JWT_SECRET);
                        const userId = decoded.userId;
                        const db = require('../services/dbService');
                        userProfile = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
                        if (userProfile) {
                            userMemories = await memoryService.getUserMemories(userProfile.id);
                        }
                    }
                } catch (e) {
                    console.log("No auth token or invalid token in search");
                }
            }

            let nombreSesion = sessionController.getSessionName(sessionId);

                        if (userProfile) {
                nombreSesion = userProfile.nombre;
                contextoFinal += `\nINFORMACIÓN DEL ALUMNO LOGUEADO (PERFIL):`;
                contextoFinal += `\n- Nombre: ${userProfile.nombre}`;
                if (userProfile.carrera) contextoFinal += `\n- Carrera: ${userProfile.carrera}`;
                if (userProfile.ciclo) contextoFinal += `\n- Ciclo actual: ${userProfile.ciclo}`;
                if (userProfile.sede) contextoFinal += `\n- Sede: ${userProfile.sede}`;

                                if (userMemories && userMemories.length > 0) {
                    contextoFinal += `\nHECHOS RECORDADOS SOBRE EL ALUMNO (MEMORIA PERMANENTE):`;
                    userMemories.forEach(mem => {
                        contextoFinal += `\n- ${mem.key}: ${mem.value}`;
                    });
                }

                                contextoFinal += `\nINSTRUCCIÓN: Dirígete al alumno por su nombre (${userProfile.nombre}) y personaliza la respuesta con su carrera/sede/ciclo o hechos recordados si es pertinente académico.`;
            } else if (nombreSesion && nombreSesion !== "Alumno") {
                contextoFinal += `\nINSTRUCCIÓN: El alumno se llama ${nombreSesion}.`;
            }

            if (sesion && sesion.esAdmin) contextoFinal += "\n[MODO_ADMIN_ACTIVO]";

            const respuestaFinal = await aiService.consultarGemini(preguntaLimpia, contextoFinal, nombreSesion);

            res.json({
                respuestas: [respuestaFinal],
                nombre: nombreSesion
            });

            sessionController.updateSessionActivity(sessionId);
            memoryService.registrarHistorialConsultas(pregunta, respuestaFinal).catch(() => { });

            if (userProfile) {
                (async () => {
                    try {
                        const memoriaExtraida = await aiService.extraerMemoria(preguntaLimpia);
                        if (memoriaExtraida) {
                            const { guardar, olvidar } = memoriaExtraida;

                            if (guardar && Object.keys(guardar).length > 0) {
                                for (const [key, value] of Object.entries(guardar)) {
                                    if (value && value !== '...' && value.trim() !== '') {
                                        await memoryService.saveUserMemory(userProfile.id, key, value);
                                        console.log(`💾 Memoria guardada para usuario ${userProfile.id} (${userProfile.nombre}): [${key}]: ${value}`);
                                    }
                                }
                            }

                            if (olvidar && olvidar.length > 0) {
                                for (const key of olvidar) {
                                    await memoryService.deleteUserMemory(userProfile.id, key);
                                    console.log(`🗑️ Memoria olvidada para usuario ${userProfile.id} (${userProfile.nombre}): [${key}]`);
                                }
                            }
                        }
                    } catch (err) {
                        console.error("❌ Error en segundo plano actualizando memoria:", err.message);
                    }
                })();
            }

        } catch (error) {
            console.error("❌ Error en AIController.buscar:", error);
            res.status(500).json({ error: "Ocurrió un error al procesar tu consulta." });
        }
    }

    async tts(req, res) {
        try {
            const { text, voiceId } = req.body;
            const audioData = await ttsService.generateSpeech(text, voiceId);
            res.set('Content-Type', 'audio/mpeg');
            res.send(audioData);
        } catch (error) {
            console.error('❌ ERROR TTS:', error.message);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AIController();
