const express = require('express');
const router = express.Router();
const usuarioController = require('./usuario.controller');

// Definimos la ruta para el registro
router.post('/registro', usuarioController.registrarUsuario);
// Definimos la ruta para el login
router.post('/login', usuarioController.loginUsuario);

module.exports = router;