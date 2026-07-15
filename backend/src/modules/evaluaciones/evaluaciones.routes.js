const express = require('express');
const router = express.Router();
const evaluacionesController = require('./evaluaciones.controller');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/:idClase/:idUsuario', evaluacionesController.listar);
router.post('/entrega', upload.single('archivo'), evaluacionesController.entregar);
router.post('/:idClase', evaluacionesController.crear);
router.get('/entregas/:idEvaluacion/:idClase', evaluacionesController.listarEntregas);

module.exports = router;
