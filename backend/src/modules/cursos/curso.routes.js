const express = require('express');
const router = express.Router();
const cursoController = require('./curso.controller');

router.get('/mis-cursos/:idUsuario/:rol', cursoController.obtenerMisCursos);

module.exports = router;
