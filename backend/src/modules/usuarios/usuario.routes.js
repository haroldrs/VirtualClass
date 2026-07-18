const express = require('express');
const router = express.Router();
const usuarioController = require('./usuario.controller');

// Definimos la ruta para el registro
router.post('/registro', usuarioController.registrarUsuario);
// Definimos la ruta para el login
router.post('/login', usuarioController.loginUsuario);

// Obtener perfil de usuario
router.get('/:id', usuarioController.obtenerPerfil);

// Actualizar perfil de usuario
router.put('/:id', usuarioController.actualizarPerfil);

// Cambiar contraseña
router.put('/:id/password', usuarioController.cambiarContrasena);

// Crear incidencia / ticket de soporte
router.post('/:id/incidencias', usuarioController.crearIncidencia);

module.exports = router;