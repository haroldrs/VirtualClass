const express = require('express');
const router = express.Router();
const foroController = require('./foro.controller');

// Obtener foros del usuario (según rol)
router.get('/mis-foros/:idUsuario/:rol', foroController.obtenerMisForos);

// Obtener temas de un foro
router.get('/:idForo/temas', foroController.obtenerTemas);

// Buscar temas en un foro (?q=palabra)
router.get('/:idForo/buscar', foroController.buscarEnForo);

// Obtener un tema con sus respuestas (discusión completa)
router.get('/temas/:idTema/discusion', foroController.obtenerDiscusion);

// Publicar un nuevo tema en un foro
router.post('/:idForo/temas', foroController.publicarTema);

// Responder a un tema
router.post('/temas/:idTema/respuestas', foroController.responderTema);

// Obtener avisos de una clase
router.get('/avisos/:idClase', foroController.obtenerAvisosClase);

// Publicar un nuevo aviso (solo docente/admin)
router.post('/:idForo/avisos', foroController.publicarAvisoClase);

module.exports = router;
