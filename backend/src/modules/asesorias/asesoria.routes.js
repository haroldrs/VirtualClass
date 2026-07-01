const express = require('express');
const router = express.Router();
const asesoriaController = require('./asesoria.controller');

// Detalle de una asesoría (con participantes) -- MUST be before /:idUsuario/:rol
router.get('/detalle/:idAsesoria', asesoriaController.obtenerDetalle);

// Docentes del alumno (para selector al solicitar) -- MUST be before /:idUsuario/:rol
router.get('/docentes/:idAlumno', asesoriaController.obtenerDocentes);

// Listar asesorías del usuario (según rol) -- catch-all LAST
router.get('/:idUsuario/:rol', asesoriaController.obtenerAsesorias);

// Crear nueva asesoría (alumno solicita)
router.post('/', asesoriaController.crearAsesoria);

// Actualizar estado (confirmar/rechazar)
router.put('/:idAsesoria/estado', asesoriaController.actualizarEstado);

// Unirse como participante
router.post('/:idAsesoria/unirse', asesoriaController.unirseAsesoria);

// Salir de una asesoría
router.delete('/:idAsesoria/salir/:idUsuario', asesoriaController.salirDeAsesoria);

// Eliminar asesoría
router.delete('/:idAsesoria', asesoriaController.eliminarAsesoria);

module.exports = router;
