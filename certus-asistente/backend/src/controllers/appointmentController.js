const emailService = require('../services/emailService');

class AppointmentController {
    async reservarCita(req, res) {
        const { nombre, dni, motivo, tipo } = req.body;

        if (!nombre || !dni) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (nombre y dni)' });
        }

        try {
            if (tipo === 'psicologia') {
                const result = await emailService.enviarCitaPsicologia({
                    nombre,
                    dni,
                    motivo,
                    fecha: new Date().toLocaleString()
                });

                return res.json({
                    success: true,
                    mensaje: `Cita reservada con éxito para ${nombre}. Se ha enviado la notificación al área de psicología.`,
                    simulado: result.simulation || false
                });
            } else {
                return res.status(400).json({ error: 'Tipo de cita no soportado' });
            }
        } catch (error) {
            console.error('❌ Error crítico en reservarCita:', error);
            res.status(500).json({ error: `Error interno: ${error.message}` });
        }
    }
}

module.exports = new AppointmentController();
