const express = require('express');
const router = express.Router();
const recursosController = require('./recursos.controller');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/:idClase', recursosController.listarRecursos);
router.post('/:idClase', upload.single('archivo'), recursosController.nuevoRecurso);
router.delete('/:idRecurso', recursosController.borrarRecurso);

module.exports = router;
