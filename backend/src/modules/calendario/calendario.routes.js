const express = require('express');
const router = express.Router();
const calendarioController = require('./calendario.controller');

// Obtener eventos del mes (?mes=6&anio=2026)
router.get('/eventos/:idUsuario/:rol', calendarioController.obtenerEventos);

// Obtener próximos eventos (panel lateral)
router.get('/proximos/:idUsuario/:rol', calendarioController.obtenerProximos);

// Obtener clases del docente (para selector al crear evento)
router.get('/clases/:idUsuario', calendarioController.obtenerClases);

// Crear evento (docente)
router.post('/eventos', calendarioController.crearEvento);

// Actualizar evento (docente)
router.put('/eventos/:idEvento', calendarioController.actualizarEvento);

// Eliminar evento (docente)
router.delete('/eventos/:idEvento', calendarioController.eliminarEvento);

module.exports = router;
