const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memoryController');
const sessionController = require('../controllers/sessionController');
const aiController = require('../controllers/aiController');
const appointmentController = require('../controllers/appointmentController');

router.get('/memoria', memoryController.getMemoria);
router.post('/memoria/cargar', memoryController.cargarMemoria);
router.post('/memoria/aprender', memoryController.aprender);
router.post('/memoria/bloquear', memoryController.bloquear);
router.delete('/memoria', memoryController.borrar);

router.post('/sesion', (req, res) => sessionController.crearSesion(req, res));
router.get('/sesion/:sessionId', (req, res) => sessionController.getSesion(req, res));
router.delete('/sesion/:sessionId', (req, res) => sessionController.eliminarSesion(req, res));
router.post('/sesion/admin/login', (req, res) => sessionController.loginAdmin(req, res));
router.post('/sesion/admin/logout/:sessionId', (req, res) => sessionController.logoutAdmin(req, res));

router.post('/buscar', (req, res) => aiController.buscar(req, res));
router.post('/tts', (req, res) => aiController.tts(req, res));

router.post('/citas/reservar', (req, res) => appointmentController.reservarCita(req, res));

const authRoutes = require('./auth');
router.use('/auth', authRoutes);

module.exports = router;
