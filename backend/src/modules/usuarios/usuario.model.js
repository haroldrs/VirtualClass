const pool = require('../../config/db');

const crearUsuario = async (nombres, apellidos, correo, contrasena) => {
    const query = `
        INSERT INTO USUARIO (nombres, apellidos, correo, contrasena)
        VALUES ($1, $2, $3, $4)
        RETURNING id_usuario, nombres, apellidos, correo;
    `;

    const values = [nombres, apellidos, correo, contrasena];

    try {
        const respuesta = await pool.query(query, values);
        return respuesta.rows[0];
    } catch (error) {
        console.error('Error en el modelo de usuario:', error);
        throw error;
    }
};

const obtenerUsuarioConRolPorCorreo = async (correo) => {
    const query = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, U.CORREO, U.CONTRASENA, U.ESTADO, R.NOMBRE_ROL as ROL
        FROM USUARIO U
        LEFT JOIN USUARIO_ROL UR ON U.ID_USUARIO = UR.ID_USUARIO
        LEFT JOIN ROL R ON UR.ID_ROL = R.ID_ROL
        WHERE U.CORREO = $1;
    `;
    
    try {
        const respuesta = await pool.query(query, [correo]);
        return respuesta.rows[0];
    } catch (error) {
        console.error('Error al obtener usuario por correo:', error);
        throw error;
    }
};

module.exports = { crearUsuario, obtenerUsuarioConRolPorCorreo };