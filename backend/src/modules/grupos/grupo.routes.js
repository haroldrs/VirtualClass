const express = require('express');
const router = express.Router();
const grupoController = require('./grupo.controller');

// Obtener grupos y crear grupos en una clase
router.get('/clase/:idClase', grupoController.obtenerGrupos);
router.post('/clase/:idClase', grupoController.crearGrupo);

// Alumnos sin grupo en una clase
router.get('/clase/:idClase/sin-grupo', grupoController.obtenerAlumnosSinGrupo);

// Gestionar un grupo específico
router.delete('/:idGrupo', grupoController.eliminarGrupo);

// Gestionar estudiantes en un grupo
router.post('/:idGrupo/estudiantes', grupoController.asignarEstudiante);
router.delete('/:idGrupo/estudiantes/:idUsuario', grupoController.removerEstudiante);

module.exports = router;
