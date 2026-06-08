const usuarioModel = require('./usuario.model');
const bcrypt = require('bcryptjs');

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

        // Si está inactivo
        if (usuario.estado !== 'Activo') {
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

module.exports = { registrarUsuario, loginUsuario };