const express = require('express');
const router = express.Router();
const notificacionController = require('./notificacion.controller');

// Rutas base: /api/notificaciones
router.get('/:idUsuario', notificacionController.obtenerMisNotificaciones);
router.put('/:idUsuario/leer-todas', notificacionController.marcarTodasComoLeidas);
router.put('/leida/:idNotificacion', notificacionController.marcarUnaComoLeida);
router.delete('/:idNotificacion', notificacionController.eliminar);

module.exports = router;
