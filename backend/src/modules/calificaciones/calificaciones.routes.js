const express = require('express');
const router = express.Router();
const calificacionesController = require('./calificaciones.controller');

router.get('/alumno/:idUsuario/:idClase', calificacionesController.obtenerNotasAlumno);
router.get('/docente/:idClase', calificacionesController.obtenerAlumnosDocente);
router.post('/calificar', calificacionesController.calificar);

module.exports = router;
