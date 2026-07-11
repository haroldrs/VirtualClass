const express = require('express');
const router = express.Router();
const claseController = require('./clase.controller');

router.get('/:idClase', claseController.obtenerDetalle);
router.get('/:idClase/sesiones', claseController.listarSesiones);
router.post('/:idClase/sesiones', claseController.nuevaSesion);
router.put('/sesiones/:idSesion', claseController.modificarSesion);
router.delete('/sesiones/:idSesion', claseController.borrarSesion);
router.put('/:idClase/enlaces', claseController.actualizarEnlaces);

module.exports = router;
