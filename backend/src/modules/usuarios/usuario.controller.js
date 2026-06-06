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

module.exports = { registrarUsuario };
