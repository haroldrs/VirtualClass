const express = require('express');
const router = express.Router();
const recursosController = require('./recursos.controller');

router.get('/:idClase', recursosController.listarRecursos);
router.post('/:idClase', recursosController.nuevoRecurso);
router.delete('/:idRecurso', recursosController.borrarRecurso);

module.exports = router;
