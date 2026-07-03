class SessionController {
    constructor() {
        this.sesionesTemporales = {};
        setInterval(() => this.cleanup(), 10000);
    }

    cleanup() {
        const ahora = Date.now();
        Object.keys(this.sesionesTemporales).forEach(sessionId => {
            if (ahora - this.sesionesTemporales[sessionId].ultimaActividad > 60000) {
                delete this.sesionesTemporales[sessionId];
                console.log(`→ Sesión ${sessionId} limpiada por inactividad`);
            }
        });
    }

    crearSesion(req, res) {
        const { sessionId, nombre, contexto } = req.body;
        if (!sessionId) return res.status(400).json({ error: 'sessionId requerido' });
        this.sesionesTemporales[sessionId] = {
            nombre: nombre || null,
            contexto: contexto || '',
            ultimaActividad: Date.now()
        };
        res.json({ success: true, sesion: this.sesionesTemporales[sessionId] });
    }

    getSesion(req, res) {
        const { sessionId } = req.params;
        const sesion = this.sesionesTemporales[sessionId];
        if (!sesion) return res.json({ existe: false, sesion: null });
        sesion.ultimaActividad = Date.now();
        res.json({ existe: true, sesion });
    }

    eliminarSesion(req, res) {
        const { sessionId } = req.params;
        if (this.sesionesTemporales[sessionId]) {
            delete this.sesionesTemporales[sessionId];
            console.log(`→ Sesión ${sessionId} eliminada (despedida)`);
        }
        res.json({ success: true, mensaje: 'Sesión limpiada' });
    }

    updateSessionActivity(sessionId) {
        if (this.sesionesTemporales[sessionId]) {
            this.sesionesTemporales[sessionId].ultimaActividad = Date.now();
        } else {
            this.sesionesTemporales[sessionId] = {
                nombre: null,
                contexto: '',
                ultimaActividad: Date.now()
            };
        }
    }

    getSessionContext(sessionId) {
        return this.sesionesTemporales[sessionId]?.contexto || "";
    }

    setSessionContext(sessionId, context) {
        if (this.sesionesTemporales[sessionId]) {
            this.sesionesTemporales[sessionId].contexto = context.slice(-500);
        }
    }

    getSessionName(sessionId) {
        return this.sesionesTemporales[sessionId]?.nombre || null;
    }

    loginAdmin(req, res) {
        const { sessionId, password } = req.body;
        if (password === '147896') {
            if (this.sesionesTemporales[sessionId]) {
                this.sesionesTemporales[sessionId].esAdmin = true;
                this.sesionesTemporales[sessionId].nombre = "Ricky";
                console.log(`🔓 MODO ADMINISTRADOR ACTIVADO para sesión: ${sessionId}`);
                return res.json({ success: true, mensaje: 'Modo Administrador activado' });
            }
        }
        res.status(401).json({ success: false, mensaje: 'Contraseña incorrecta' });
    }

    logoutAdmin(req, res) {
        const { sessionId } = req.params;
        if (this.sesionesTemporales[sessionId]) {
            this.sesionesTemporales[sessionId].esAdmin = false;
        }
        res.json({ success: true, mensaje: 'Modo Administrador desactivado' });
    }
}

module.exports = new SessionController();
