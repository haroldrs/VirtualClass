const usuarioModel = require('./usuario.model');
const bcrypt = require('bcryptjs');
const pool = require('../../config/db');

const registrarUsuario = async (req, res) => {
    // Recibimos los datos del frontend
    const { nombres, apellidos, correo, contrasena } = req.body;

    try {
        // 1. Encriptar la contraseña (seguridad de nivel industrial)
        const salt = await bcrypt.genSalt(10);
        const contrasenaEncriptada = await bcrypt.hash(contrasena, salt);

        // 2. Llamar al modelo para guardar
        const nuevoUsuario = await usuarioModel.crearUsuario(nombres, apellidos, correo, contrasenaEncriptada);

        // 3. Responder al frontend con éxito
        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            usuario: nuevoUsuario
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar usuario', error: error.message });
    }
};

const loginUsuario = async (req, res) => {
    const { correo, contrasena } = req.body;

    try {
        // 1. Buscar usuario por correo (esto también traerá su rol)
        const usuario = await usuarioModel.obtenerUsuarioConRolPorCorreo(correo);

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // 2. Verificar contraseña
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!contrasenaValida) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        // Si está inactivo o pendiente
        if (usuario.estado === 'PENDIENTE') {
            return res.status(403).json({ mensaje: 'Tu cuenta está pendiente de aprobación por un administrador.' });
        }
        if (usuario.estado !== 'Activo' && usuario.estado !== 'ACTIVO') {
            return res.status(403).json({ mensaje: 'Usuario inactivo. Contacte al administrador.' });
        }

        // 3. Responder con datos (sin la contraseña)
        delete usuario.contrasena;

        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso',
            usuario: usuario
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al iniciar sesión', error: error.message });
    }
};

const obtenerPerfil = async (req, res) => {
    const { id } = req.params;
    try {
        const usuario = await usuarioModel.obtenerUsuarioPorId(id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        res.status(200).json(usuario);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el perfil', error: error.message });
    }
};

const actualizarPerfil = async (req, res) => {
    const { id } = req.params;
    const { nombres, apellidos, correo, telefono } = req.body;
    try {
        const usuario = await usuarioModel.actualizarPerfil(id, nombres, apellidos, correo, telefono);
        res.status(200).json({ mensaje: 'Perfil actualizado', usuario });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el perfil', error: error.message });
    }
};

const cambiarContrasena = async (req, res) => {
    const { id } = req.params;
    const { contrasenaActual, nuevaContrasena } = req.body;
    try {
        // First get the user to check the current password
        const dbRes = await pool.query('SELECT CONTRASENA FROM USUARIO WHERE ID_USUARIO = $1', [id]);
        if (dbRes.rows.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        
        const contrasenaValida = await bcrypt.compare(contrasenaActual, dbRes.rows[0].contrasena);
        if (!contrasenaValida) return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta' });

        const salt = await bcrypt.genSalt(10);
        const contrasenaEncriptada = await bcrypt.hash(nuevaContrasena, salt);

        await usuarioModel.cambiarContrasena(id, contrasenaEncriptada);
        res.status(200).json({ mensaje: 'Contraseña cambiada exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cambiar la contraseña', error: error.message });
    }
};

const crearIncidencia = async (req, res) => {
    const { id } = req.params;
    const { asunto, descripcion } = req.body;
    try {
        const incidencia = await usuarioModel.crearIncidencia(id, asunto, descripcion);
        res.status(201).json({ mensaje: 'Incidencia creada', incidencia });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear la incidencia', error: error.message });
    }
};

module.exports = { registrarUsuario, loginUsuario, obtenerPerfil, actualizarPerfil, cambiarContrasena, crearIncidencia };