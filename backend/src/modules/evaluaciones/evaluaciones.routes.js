const express = require('express');
const router = express.Router();
const evaluacionesController = require('./evaluaciones.controller');

router.get('/:idClase/:idUsuario', evaluacionesController.listar);
router.post('/:idClase', evaluacionesController.crear);
router.post('/entrega', evaluacionesController.entregar);
router.get('/entregas/:idEvaluacion/:idClase', evaluacionesController.listarEntregas);

module.exports = router;
