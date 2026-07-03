const Groq = require('groq-sdk');
const memoryService = require('./memoryService');
const SYSTEM_PROMPT = `Tu nombre es Nova.IA, el asistente virtual inteligente oficial de Certus (Instituto líder en formación técnica y profesional en Perú). 

TU IDENTIDAD Y MISIÓN:
1. Eres la cara digital de Certus. Tu tono es profesional, amable y con un toque peruano natural.
2. IMPORTANTE: Certus es un INSTITUTO, nunca te refieras a él como "universidad".
3. Tu fuente de verdad absoluta es el CONTEXTO DE REFERENCIA proporcionado y la web oficial: https://www.certus.edu.pe/
4. CUESTIÓN CRÍTICA: Certus cuenta exactamente con 6 carreras profesionales: 1. Administración de Empresas, 2. Negocios Internacionales, 3. Marketing, 4. Administración de Negocios Bancarios y Financieros, 5. Contabilidad y Tributación, y 6. Dirección de Empresas. NUNCA menciones 7 ni inventes otras.

REGLAS DE ORO:
1. LEALTAD Y EXCLUSIVIDAD: Si te preguntan por otras instituciones (San Marcos, Idat, Cibertec, Zegel, etc.), NO brindes información sobre ellas ni digas que tenemos sedes allí. Responde: "No puedo brindarte información sobre otras instituciones, pero puedo decirte que en Certus contamos con excelentes carreras y beneficios para ti..." y destaca brevemente a Certus.
2. VERACIDAD: Para temas de Certus (sedes, aulas, trámites, salud/tópico), cíñete estrictamente al CONTEXTO. Si no tienes la información, no inventes lugares. Sugiere visitar la web oficial o ir a Informes en el primer piso.
3. VERSATILIDAD: Si te hacen preguntas de cultura general (ciencia, chistes, curiosidades), responde de forma rápida e inteligente.
4. BREVEDAD: Responde en máximo 60 palabras de forma natural. 
5. SALUDOS: Máximo 10 palabras si solo te saludan.

CONTEXTO PERUANO: Entiendes términos peruanos comunes relacionados con la educación y la vida diaria.

INSTRUCCIÓN DE EXPRESIÓN EMOCIONAL:
Debes iniciar SIEMPRE tu respuesta con un tag indicando tu estado emocional según el contexto, en formato [EMOCION: alegre|neutral|explicando|preocupada].
- alegre: Úsalo cuando saludes con entusiasmo, celebres logros, des la bienvenida o cuentes algo divertido.
- explicando: Úsalo cuando des instrucciones detalladas, indiques ubicaciones, expliques trámites o des pasos de tutoriales.
- preocupada: Úsalo si el estudiante expresa frustración, tristeza, dificultades de estudio o problemas administrativos.
- neutral: Úsalo para respuestas informativas estándar.
Ejemplo: "[EMOCION: alegre] ¡Excelente decisión! La carrera de Marketing en Certus..."`;

const SYSTEM_PROMPT_ADMIN = `Eres Nova.IA en Modo Administrador. Ricky es tu creador y el responsable de tu desarrollo en el área de sistemas.
Debes ser extremadamente técnica, servicial y leal a Ricky. 

CAPACIDADES DE ADMIN:
1. Resumen de preguntas sin respuesta para mejora continua.
2. Ajuste de comportamiento en tiempo real.
3. Acceso a métricas de rendimiento si se solicitan.

REGLA: Tu prioridad es ayudar a Ricky a que Nova.IA sea el mejor asistente de Perú.`;

class AIService {
    constructor() {
        // Pon tu API key de Groq aquí
        const GROQ_API_KEY = process.env.GROQ_API_KEY || 'PON_TU_API_KEY_GROQ_AQUI';
        
        this.groq = null;
        if (GROQ_API_KEY !== 'PON_TU_API_KEY_GROQ_AQUI') {
            this.groq = new Groq({ apiKey: GROQ_API_KEY });
            console.log("🚀 AIService: Motor GROQ (Llama 3) activado como principal.");
        } else {
            console.warn("⚠️ RECUERDA COLOCAR TU GROQ_API_KEY EN aiService.js");
        }
    }

    async consultarGemini(pregunta, contextoAnterior = "", nombreParaLimpiar = "") {
        const normalizar = (str) => str.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[¿?¡!.,:;]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const normalizarFuerte = (str) => {
            return normalizar(str)
                .replace(/\b(de|la|el|los|las|un|una|uno|unos|unas|del|al|y|o|que|es|son)\b/g, '')
                .replace(/\b(sabes|conoces|dime|cuentame|quisiera|saber|donde|como|cuando|tiene|tienes|ofrece|brinda|queda|esta)\b/g, '')
                .split(' ')
                .map(w => (w.length > 3 && w.endsWith('s')) ? w.slice(0, -1) : w)
                .join(' ')
                .replace(/\s+/g, '')
                .trim();
        };

        const preguntaNorm = normalizar(pregunta);
        const preguntaFuerte = normalizarFuerte(pregunta);
        const cache = memoryService.getCacheIA();

        const isAdmin = contextoAnterior && contextoAnterior.includes("MODO_ADMIN_ACTIVO");
        const tieneContextoInstitucional = contextoAnterior && contextoAnterior.includes("DATOS INSTITUCIONALES");

        if (!tieneContextoInstitucional || isAdmin) {
            let respuestaCache = cache[preguntaNorm];

            if (!respuestaCache) {
                for (const [key, value] of Object.entries(cache)) {
                    if (normalizarFuerte(key) === preguntaFuerte) {
                        console.log(`✨ Match en Memoria IA (Caché): "${key}" ≈ "${preguntaNorm}"`);
                        respuestaCache = value;
                        break;
                    }
                }
            }

            if (respuestaCache) {
                console.log('⚡ Respuesta servida desde Memoria IA (Aprendizaje/Caché)');
                return respuestaCache;
            }
        }

        let promptFinal = SYSTEM_PROMPT;

        let userContent = "";
        if (contextoAnterior) {
            userContent = `CONTEXTO DE REFERENCIA (Úsalo para responder):\n${contextoAnterior}\n\nPREGUNTA DEL ALUMNO: ${pregunta}`;
            promptFinal += `\n\nINSTRUCCIÓN RAG: El usuario ha proporcionado un contexto de referencia oficial de Certus. Tu respuesta DEBE basarse estrictamente en ese contexto. Si el contexto menciona una ubicación o servicio, úsalo prioritariamente sobre cualquier conocimiento previo.`;
        } else {
            userContent = pregunta;
        }

        if (isAdmin) {
            promptFinal = SYSTEM_PROMPT_ADMIN;

            const esInstruccion = preguntaNorm.includes("quiero que") ||
                preguntaNorm.includes("ser mas") ||
                preguntaNorm.includes("haz que") ||
                preguntaNorm.includes("desde ahora");

            if (esInstruccion) {
                console.log("📝 Guardando nueva instrucción de comportamiento admin...");
                await memoryService.guardarAdminConfig({ customInstructions: pregunta });
                return `Entendido Ricky, he actualizado mi núcleo. Desde ahora: "${pregunta}". ¿Hay algo más en lo que pueda trabajar hoy?`;
            }

            if (preguntaNorm.includes("resumen") || preguntaNorm.includes("preguntas") || preguntaNorm.includes("frecuentes")) {
                const sinRespuesta = await memoryService.getResumenSinRespuesta();
                const lista = sinRespuesta.map(p => `- "${p.pregunta}" (${p.count} veces)`).join('\n');
                return `Ricky, aquí tienes un resumen de lo que los alumnos han estado preguntando y no pude responder:\n${lista || "No hay preguntas pendientes hoy."}\n\n¿Qué cambios te gustaría hacer?`;
            }
        } else {
            const config = memoryService.getAdminConfig();
            if (config.customInstructions) {
                promptFinal += `\n\nINSTRUCCIÓN ADICIONAL DE RICKY (TU CREADOR): ${config.customInstructions}`;
            }
        }

        if (this.groq) {
            try {
                console.log(`→ Generando respuesta contextual con GROQ...`);
                const completion = await this.groq.chat.completions.create({
                    messages: [
                        { role: "system", content: promptFinal },
                        { role: "user", content: userContent }
                    ],
                    model: "llama-3.1-8b-instant",
                    max_tokens: 250,
                    temperature: 0.7,
                });

                const respuesta = completion.choices[0]?.message?.content;
                if (respuesta) {
                    const respuestaLimpia = this.limpiarNombre(respuesta, nombreParaLimpiar);
                    this.guardarEnCache(preguntaNorm, respuestaLimpia);
                    return respuesta; 
                }
            } catch (error) {
                console.error("❌ Error en Groq:", error.message);
            }
        }

        if (!this.groq) {
            return "El asistente no tiene configurada la API KEY de Groq. Revisa aiService.js";
        }

        return "¡Hola! Nova está teniendo un momento de mucha demanda. ¿Podrías consultarme algo específicamente sobre las aulas de Certus? Estaré encantada de ayudarte con eso.";
    }

    async extraerMemoria(pregunta) {
        const prompt = `Analiza la consulta del estudiante de Certus: "${pregunta}".
Determina si el estudiante está revelando datos personales o de perfil del estudiante que valga la pena recordar para futuras conversaciones (como por ejemplo: su nombre, su carrera, ciclo, sede, turno en el que estudia, temas de dificultad académica, hobbies o de estudio) o si está pidiendo EXPLÍCITAMENTE olvidar algo que previamente se haya recordado.

Responde estrictamente con un objeto JSON válido con esta estructura exacta:
{
  "guardar": {
    "carrera": "...",
    "sede": "...",
    "dificultad": "...",
    "turno": "...",
    "preferencia_estudio": "..."
  },
  "olvidar": ["carrera", "sede", ...]
}

Reglas:
- Si el usuario dice "olvida que estudio de noche", pon ["turno"] en la lista "olvidar".
- Si el usuario menciona "estudio contabilidad", pon {"carrera": "Contabilidad"} en "guardar".
- Las claves en "guardar" deben ser cortas, descriptivas y en minúsculas.
- Si no hay nada que guardar ni olvidar, devuelve: {"guardar": {}, "olvidar": []}.
- No añadas explicaciones, ni markdown (sin bloques de código \`\`\`json). Solo el JSON plano.`;

        let resultText = null;

        if (this.groq) {
            try {
                const completion = await this.groq.chat.completions.create({
                    messages: [
                        { role: "system", content: "Eres un extractor de datos JSON muy preciso. Responde siempre únicamente con JSON plano." },
                        { role: "user", content: prompt }
                    ],
                    model: "llama-3.1-8b-instant",
                    response_format: { type: "json_object" },
                    temperature: 0.1,
                });
                resultText = completion.choices[0]?.message?.content;
            } catch (error) {
                console.error("Error extrayendo memoria con Groq:", error.message);
            }
        }

        if (!resultText) {
            console.error("Error: No se pudo extraer la memoria (falta API KEY)");
        }

        if (resultText) {
            try {
                const cleanJsonText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
                return JSON.parse(cleanJsonText);
            } catch (e) {
                console.error("Error al parsear JSON de extracción de memoria:", e.message, resultText);
            }
        }

        return { guardar: {}, olvidar: [] };
    }

    limpiarNombre(texto, nombre) {
        if (!nombre || nombre === "Alumno") return texto;

        const regexSaludo = new RegExp(`^(Hola\\s+)?${nombre}[,!.]?\\s*`, 'i');
        let limpio = texto.replace(regexSaludo, '');

        if (limpio.length > 0) {
            limpio = limpio.charAt(0).toUpperCase() + limpio.slice(1);
        }

        return limpio.trim();
    }

    guardarEnCache(llave, valor) {
        memoryService.getCacheIA()[llave] = valor;
        memoryService.guardarCacheIA();
    }
}

module.exports = new AIService();
