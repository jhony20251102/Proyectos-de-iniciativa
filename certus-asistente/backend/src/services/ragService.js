const fs = require('fs').promises;
const path = require('path');

class RagService {
    constructor() {
        this.documentsPath = path.join(__dirname, '../../data/reglamento_chunks.json');
        this.chunks = [];
        this.idf = {};
        this.tfidfVectors = [];
    }

    async init() {
        try {
            await this.loadChunks();
            this.buildTfidf();
            console.log(`✓ RAG local inicializado: ${this.chunks.length} fragmentos de conocimiento indexados`);
        } catch (error) {
            console.error('❌ Error al inicializar RAG:', error);
        }
    }

    async loadChunks() {
        try {
            const data = await fs.readFile(this.documentsPath, 'utf8');
            this.chunks = JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.chunks = [
                    {
                        id: 1,
                        category: "notas",
                        title: "Nota mínima aprobatoria y promedios",
                        content: "La nota mínima aprobatoria para cualquier unidad didáctica o curso en Certus es trece (13). En el sistema de calificación vigesimal (0 a 20), la fracción de nota de 0.5 o más se redondea al entero inmediato superior solo para el promedio final."
                    },
                    {
                        id: 2,
                        category: "tramites",
                        title: "Certificado de estudios y constancias",
                        content: "Los certificados de estudios o constancia de egresado se solicitan a través del Campus Digital. La secretaría académica procesa los certificados en un plazo máximo de cinco (5) días hábiles tras confirmar el pago del trámite."
                    },
                    {
                        id: 3,
                        category: "asistencia",
                        title: "Porcentaje de inasistencias límite (Inhabilitación)",
                        content: "El límite de inasistencia permitido en un curso es del 30%. Si el alumno acumula más del 30% de inasistencias en las clases dictadas, el sistema lo inhabilitará automáticamente (aparecerá con estado DPI: Desaprobado por Inasistencia), perdiendo el derecho a rendir examen final."
                    },
                    {
                        id: 4,
                        category: "matricula",
                        title: "Reingreso y traslados de sede",
                        content: "Para solicitar un reingreso o traslado de sede/carrera, debes realizar el trámite en el Campus Digital en las fechas establecidas en el calendario académico. No debes tener deudas pendientes y se requiere el pago por derecho de trámite."
                    },
                    {
                        id: 5,
                        category: "sede_ate",
                        title: "Sede Ate: Ubicación y Laboratorios",
                        content: "La Sede Ate de Certus está ubicada en la Carretera Central Km 3.5 (frente al Real Plaza Puruchuco). Cuenta con 5 pisos de aulas multimedia, laboratorios de cómputo de última generación en el 3er y 4to piso, y la biblioteca estudiantil en el 2do piso."
                    },
                    {
                        id: 6,
                        category: "evaluaciones",
                        title: "Evaluación sustitutoria",
                        content: "La evaluación sustitutoria reemplaza la nota más baja obtenida en las evaluaciones continuas o parciales. Se rinde en la última semana del ciclo académico. No aplica para proyectos finales o talleres prácticos de alta especialización."
                    },
                    {
                        id: 7,
                        category: "pagos",
                        title: "Fechas de pago y mora de pensiones",
                        content: "Las pensiones de Certus vencen los días 5 de cada mes. El pago fuera de fecha genera una mora acumulativa diaria por gastos administrativos. Puedes realizar los pagos por la app móvil del banco BCP, BBVA, Interbank o Scotiabank sin comisión."
                    }
                ];
                const dir = path.dirname(this.documentsPath);
                await fs.mkdir(dir, { recursive: true });
                await fs.writeFile(this.documentsPath, JSON.stringify(this.chunks, null, 2));
            } else {
                throw error;
            }
        }
    }

    tokenize(text) {
        return text.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2); 
    }

    buildTfidf() {
        const numDocs = this.chunks.length;
        const docTerms = this.chunks.map(chunk => this.tokenize(chunk.title + " " + chunk.content));

        const df = {};
        docTerms.forEach(terms => {
            const uniqueTerms = new Set(terms);
            uniqueTerms.forEach(term => {
                df[term] = (df[term] || 0) + 1;
            });
        });

        this.idf = {};
        for (const term in df) {
            this.idf[term] = Math.log(numDocs / df[term]) + 1;
        }

        this.tfidfVectors = docTerms.map((terms, docIdx) => {
            const termCounts = {};
            terms.forEach(term => {
                termCounts[term] = (termCounts[term] || 0) + 1;
            });

            const vector = {};
            const docLength = terms.length;
            for (const term in termCounts) {
                const tf = termCounts[term] / docLength;
                const idfValue = this.idf[term] || 1;
                vector[term] = tf * idfValue;
            }
            return {
                id: this.chunks[docIdx].id,
                title: this.chunks[docIdx].title,
                content: this.chunks[docIdx].content,
                vector
            };
        });
    }

    search(queryText, topK = 2) {
        const queryTerms = this.tokenize(queryText);
        if (queryTerms.length === 0) return [];

        const queryTermCounts = {};
        queryTerms.forEach(term => {
            queryTermCounts[term] = (queryTermCounts[term] || 0) + 1;
        });

        const queryVector = {};
        const queryLength = queryTerms.length;
        for (const term in queryTermCounts) {
            const tf = queryTermCounts[term] / queryLength;
            const idfValue = this.idf[term] || 0; 
            queryVector[term] = tf * idfValue;
        }

        const results = this.tfidfVectors.map(doc => {
            let dotProduct = 0;
            let queryNorm = 0;
            let docNorm = 0;

            for (const term in queryVector) {
                queryNorm += queryVector[term] * queryVector[term];
            }
            queryNorm = Math.sqrt(queryNorm);

            for (const term in doc.vector) {
                docNorm += doc.vector[term] * doc.vector[term];
            }
            docNorm = Math.sqrt(docNorm);

            if (queryNorm === 0 || docNorm === 0) return { score: 0, doc };

            for (const term in queryVector) {
                if (doc.vector[term]) {
                    dotProduct += queryVector[term] * doc.vector[term];
                }
            }

            const score = dotProduct / (queryNorm * docNorm);
            return {
                score,
                id: doc.id,
                title: doc.title,
                content: doc.content
            };
        });

        return results
            .filter(r => r.score > 0.08) 
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }
}

module.exports = new RagService();
