const express = require('express');
const router = express.Router();
const cursoController = require('./curso.controller');

router.get('/mis-cursos/:idUsuario/:rol', cursoController.obtenerMisCursos);
router.get('/disponibles/:idUsuario', cursoController.obtenerCursosDisponibles);
router.post('/matricular', cursoController.matricularEnClase);

module.exports = router;
