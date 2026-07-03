const fs = require('fs').promises;
const path = require('path');

class MemoryService {
    constructor() {
        this.MEMORY_FILE = path.join(__dirname, '../../data/memoria_permanente.json');
        this.CACHE_IA_FILE = path.join(__dirname, '../../data/memoria_ia.json');
        this.UNANSWERED_FILE = path.join(__dirname, '../../data/registro_consultas.json');
        this.ADMIN_CONFIG_FILE = path.join(__dirname, '../../data/admin_config.json');
        this.memoriaPermanente = { conocimiento: {}, bloqueado: false };
        this.cacheIA = {};
        this.preguntasSinRespuesta = [];
        this.adminConfig = { customInstructions: '', lastLogin: null };
    }

    async cargarMemoria() {
        try {
            const data = await fs.readFile(this.MEMORY_FILE, 'utf8');
            try {
                this.memoriaPermanente = JSON.parse(data);
                console.log('✓ Memoria permanente cargada');
            } catch (parseError) {
                console.error('❌ ERROR CRÍTICO: El archivo de memoria tiene errores de sintaxis JSON.');
                return;
            }

            try {
                const unansweredData = await fs.readFile(this.UNANSWERED_FILE, 'utf8');
                this.preguntasSinRespuesta = JSON.parse(unansweredData);
            } catch (e) {
                this.preguntasSinRespuesta = [];
            }

            try {
                const cacheData = await fs.readFile(this.CACHE_IA_FILE, 'utf8');
                this.cacheIA = JSON.parse(cacheData);
                console.log('✓ Memoria IA (Caché) cargada');
            } catch (e) {
                console.log('→ Iniciando nueva Memoria IA');
                this.cacheIA = {};
            }

            try {
                const adminData = await fs.readFile(this.ADMIN_CONFIG_FILE, 'utf8');
                this.adminConfig = JSON.parse(adminData);
                console.log('✓ Configuración Admin cargada');
            } catch (e) {
                this.adminConfig = { customInstructions: '', lastLogin: null };
            }

            if (!this.watcherInitialized) {
                const fsExtra = require('fs');

                fsExtra.watchFile(this.MEMORY_FILE, { interval: 1000 }, async (curr, prev) => {
                    if (curr.mtime !== prev.mtime) {
                        console.log('🔄 Detectado cambio manual en memoria_permanente.json. Recargando...');
                        const newData = await fs.readFile(this.MEMORY_FILE, 'utf8');
                        try {
                            this.memoriaPermanente = JSON.parse(newData);
                            console.log('✅ Memoria permanente actualizada en tiempo real.');
                        } catch (e) {
                            console.error('❌ Error al recargar memoria_permanente: JSON inválido.');
                        }
                    }
                });

                fsExtra.watchFile(this.CACHE_IA_FILE, { interval: 1000 }, async (curr, prev) => {
                    if (curr.mtime !== prev.mtime) {
                        console.log('🔄 Detectado cambio manual en memoria_ia.json. Recargando...');
                        const newData = await fs.readFile(this.CACHE_IA_FILE, 'utf8');
                        try {
                            this.cacheIA = JSON.parse(newData);
                            console.log('✅ Memoria IA (Caché) actualizada en tiempo real.');
                        } catch (e) {
                            console.error('❌ Error al recargar memoria_ia: JSON inválido.');
                        }
                    }
                });
                this.watcherInitialized = true;
            }

        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('→ Creando nueva memoria permanente (Archivo no encontrado)');
                await this.guardarMemoria();
            } else {
                console.error('Error cargando memoria:', error);
            }
        }
    }

    async guardarMemoria() {
        try {
            await fs.writeFile(this.MEMORY_FILE, JSON.stringify(this.memoriaPermanente, null, 2));
            console.log('✓ Memoria permanente guardada');
        } catch (error) {
            console.error('Error guardando memoria:', error);
        }
    }

    async guardarCacheIA() {
        try {
            await fs.writeFile(this.CACHE_IA_FILE, JSON.stringify(this.cacheIA, null, 2));
        } catch (error) {
            console.error('Error guardando caché IA:', error);
        }
    }

    getMemoria() {
        return this.memoriaPermanente;
    }

    getCacheIA() {
        return this.cacheIA;
    }

    setBloqueado(bloqueado) {
        this.memoriaPermanente.bloqueado = bloqueado;
    }

    aprender(pregunta, respuesta) {
        const key = pregunta.toLowerCase().trim();
        this.memoriaPermanente.conocimiento[key] = respuesta.trim();
    }

    cargarDatos(datos) {
        this.memoriaPermanente.conocimiento = {
            ...this.memoriaPermanente.conocimiento,
            ...datos
        };
    }

    async registrarHistorialConsultas(pregunta, respuesta) {
        try {
            let actual = { historial: [] };
            try {
                const data = await fs.readFile(this.UNANSWERED_FILE, 'utf8');
                actual = JSON.parse(data);
                if (!actual.historial) actual = { historial: [] };
            } catch (e) {
                actual = { historial: [] };
            }

            const fecha = new Date().toLocaleString('es-PE', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            });

            const index = actual.historial.findIndex(p => p.pregunta.toLowerCase() === pregunta.toLowerCase());

            if (index !== -1) {
                actual.historial[index].conteo += 1;
                actual.historial[index].ultima_vez = fecha;
                actual.historial[index].respuesta = respuesta; 
            } else {
                actual.historial.push({
                    pregunta,
                    respuesta,
                    conteo: 1,
                    primera_vez: fecha,
                    ultima_vez: fecha
                });
            }

            await fs.writeFile(this.UNANSWERED_FILE, JSON.stringify(actual, null, 2));
        } catch (error) {
            console.error('Error registrando historial:', error);
        }
    }

    borrarMemoria() {
        this.memoriaPermanente.conocimiento = {};
    }

    getAdminConfig() {
        return this.adminConfig;
    }

    async guardarAdminConfig(config) {
        this.adminConfig = { ...this.adminConfig, ...config };
        try {
            await fs.writeFile(this.ADMIN_CONFIG_FILE, JSON.stringify(this.adminConfig, null, 2));
        } catch (error) {
            console.error('Error guardando config admin:', error);
        }
    }

    async getResumenSinRespuesta() {
        try {
            const data = await fs.readFile(this.UNANSWERED_FILE, 'utf8');
            const preguntas = JSON.parse(data);
            const top5 = preguntas.sort((a, b) => b.count - a.count).slice(0, 5);
            return top5;
        } catch (e) {
            return [];
        }
    }

    async getUserMemories(userId) {
        const db = require('./dbService');
        try {
            return await db.all('SELECT key, value FROM user_memories WHERE user_id = ?', [userId]);
        } catch (error) {
            console.error('Error en memoryService.getUserMemories:', error);
            return [];
        }
    }

    async saveUserMemory(userId, key, value) {
        const db = require('./dbService');
        try {
            return await db.run(
                'INSERT OR REPLACE INTO user_memories (user_id, key, value) VALUES (?, ?, ?)',
                [userId, key.toLowerCase().trim(), value.trim()]
            );
        } catch (error) {
            console.error('Error en memoryService.saveUserMemory:', error);
            throw error;
        }
    }

    async deleteUserMemory(userId, key) {
        const db = require('./dbService');
        try {
            return await db.run(
                'DELETE FROM user_memories WHERE user_id = ? AND key = ?',
                [userId, key.toLowerCase().trim()]
            );
        } catch (error) {
            console.error('Error en memoryService.deleteUserMemory:', error);
            throw error;
        }
    }
}

module.exports = new MemoryService();
