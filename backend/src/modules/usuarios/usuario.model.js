const pool = require('../../config/db');

const crearUsuario = async (nombres, apellidos, correo, contrasena) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const query = `
            INSERT INTO USUARIO (nombres, apellidos, correo, contrasena, estado)
            VALUES ($1, $2, $3, $4, 'PENDIENTE')
            RETURNING id_usuario, nombres, apellidos, correo, estado;
        `;
        const respuesta = await client.query(query, [nombres, apellidos, correo, contrasena]);
        const newUser = respuesta.rows[0];

        // Assign default role "Alumno Regular"
        const roleRes = await client.query("SELECT ID_ROL FROM ROL WHERE NOMBRE_ROL = 'Alumno Regular'");
        if (roleRes.rows.length > 0) {
            await client.query(
                "INSERT INTO USUARIO_ROL (ID_USUARIO, ID_ROL) VALUES ($1, $2)",
                [newUser.id_usuario, roleRes.rows[0].id_rol]
            );
        }

        await client.query('COMMIT');
        return newUser;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en el modelo de usuario:', error);
        throw error;
    } finally {
        client.release();
    }
};

const obtenerUsuarioConRolPorCorreo = async (correo) => {
    const query = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, U.CORREO, U.CONTRASENA, U.ESTADO, R.NOMBRE_ROL as ROL, U.TELEFONO, U.FECHA_REGISTRO
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

const obtenerUsuarioPorId = async (id) => {
    const query = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, U.CORREO, U.ESTADO, R.NOMBRE_ROL as ROL, U.TELEFONO, U.FECHA_REGISTRO
        FROM USUARIO U
        LEFT JOIN USUARIO_ROL UR ON U.ID_USUARIO = UR.ID_USUARIO
        LEFT JOIN ROL R ON UR.ID_ROL = R.ID_ROL
        WHERE U.ID_USUARIO = $1;
    `;
    
    try {
        const respuesta = await pool.query(query, [id]);
        return respuesta.rows[0];
    } catch (error) {
        console.error('Error al obtener usuario por id:', error);
        throw error;
    }
};

const actualizarPerfil = async (id, nombres, apellidos, correo, telefono) => {
    const query = `
        UPDATE USUARIO
        SET NOMBRES = $1, APELLIDOS = $2, CORREO = $3, TELEFONO = $4
        WHERE ID_USUARIO = $5
        RETURNING ID_USUARIO, NOMBRES, APELLIDOS, CORREO, TELEFONO;
    `;
    
    try {
        const respuesta = await pool.query(query, [nombres, apellidos, correo, telefono, id]);
        return respuesta.rows[0];
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        throw error;
    }
};

const cambiarContrasena = async (id, nuevaContrasena) => {
    const query = `
        UPDATE USUARIO
        SET CONTRASENA = $1
        WHERE ID_USUARIO = $2
        RETURNING ID_USUARIO;
    `;
    
    try {
        const respuesta = await pool.query(query, [nuevaContrasena, id]);
        return respuesta.rows[0];
    } catch (error) {
        console.error('Error al cambiar contrasena:', error);
        throw error;
    }
};

module.exports = { crearUsuario, obtenerUsuarioConRolPorCorreo, obtenerUsuarioPorId, actualizarPerfil, cambiarContrasena };