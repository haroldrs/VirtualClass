const express = require('express');
const router = express.Router();
const asistenciaController = require('./asistencia.controller');

router.get('/:idClase/alumnos', asistenciaController.listarAlumnos);
router.get('/:idClase/modulo/:idModulo', asistenciaController.listarAsistenciaSesion);
router.post('/marcar', asistenciaController.registrarAsistencia);
router.get('/:idClase/alumno/:idUsuario', asistenciaController.porcentajeAlumno);

module.exports = router;
