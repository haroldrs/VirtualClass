const express = require('express');
const router = express.Router();
const anuncioController = require('./anuncio.controller');

// Ruta pública: anuncios activos para la página de Inicio
router.get('/activos', anuncioController.obtenerActivos);

// Rutas de administración
router.get('/', anuncioController.obtenerTodos);
router.post('/', anuncioController.crear);
router.put('/:id', anuncioController.actualizar);
router.put('/:id/toggle', anuncioController.toggleActivo);
router.delete('/:id', anuncioController.eliminar);
router.post('/reorder', anuncioController.reordenar);

module.exports = router;
