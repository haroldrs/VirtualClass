const express = require('express');
const router = express.Router();
const calificacionesController = require('./calificaciones.controller');

router.get('/alumno/:idUsuario/:idClase', calificacionesController.obtenerNotasAlumno);
router.get('/docente/:idClase', calificacionesController.obtenerAlumnosDocente);
router.post('/calificar', calificacionesController.registrarNota);

// Rutas de resumen global
router.get('/global/alumno/:idUsuario', calificacionesController.resumenGlobalAlumno);
router.get('/global/docente/:idUsuario', calificacionesController.resumenGlobalDocente);

module.exports = router;
