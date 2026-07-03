const memoryService = require('../services/memoryService');

class MemoryController {
    getMemoria(req, res) {
        res.json(memoryService.getMemoria());
    }

    async cargarMemoria(req, res) {
        const { datos } = req.body;
        if (!datos || typeof datos !== 'object') {
            return res.status(400).json({ error: 'Datos inválidos' });
        }
        memoryService.cargarDatos(datos);
        await memoryService.guardarMemoria();
        res.json({
            success: true,
            mensaje: `Información cargada: ${Object.keys(datos).length} items`,
            total: Object.keys(memoryService.getMemoria().conocimiento).length
        });
    }

    async aprender(req, res) {
        const { pregunta, respuesta } = req.body;
        if (memoryService.getMemoria().bloqueado) {
            return res.status(403).json({ error: 'Aprendizaje bloqueado' });
        }
        if (!pregunta || !respuesta) {
            return res.status(400).json({ error: 'Faltan datos' });
        }
        memoryService.aprender(pregunta, respuesta);
        await memoryService.guardarMemoria();
        res.json({ success: true, mensaje: 'Información aprendida correctamente' });
    }

    async bloquear(req, res) {
        const { bloqueado } = req.body;
        memoryService.setBloqueado(bloqueado);
        await memoryService.guardarMemoria();
        res.json({ success: true, bloqueado: memoryService.getMemoria().bloqueado });
    }

    async borrar(req, res) {
        memoryService.borrarMemoria();
        await memoryService.guardarMemoria();
        res.json({ success: true, mensaje: 'Memoria borrada' });
    }
}

module.exports = new MemoryController();
