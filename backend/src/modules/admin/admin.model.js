const pool = require('../../config/db');
const bcrypt = require('bcryptjs');

const getDashboardStats = async () => {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM USUARIO');
    const activeCourses = await pool.query('SELECT COUNT(*) FROM CURSO');
    const totalEnrollments = await pool.query('SELECT COUNT(*) FROM MATRICULA WHERE ESTADO_MATRICULA = $1', ['ACTIVO']);
    const issues = await pool.query("SELECT COUNT(*) FROM ASESORIA WHERE ESTADO = 'pendiente'");

    return {
        totalUsuarios: parseInt(totalUsers.rows[0].count),
        cursosActivos: parseInt(activeCourses.rows[0].count),
        matriculasTotales: parseInt(totalEnrollments.rows[0].count),
        incidencias: parseInt(issues.rows[0].count)
    };
};

// Usuarios
const getAllUsers = async () => {
    const query = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, U.CORREO, U.ESTADO, R.NOMBRE_ROL, R.ID_ROL
        FROM USUARIO U 
        LEFT JOIN USUARIO_ROL UR ON U.ID_USUARIO = UR.ID_USUARIO 
        LEFT JOIN ROL R ON UR.ID_ROL = R.ID_ROL 
        ORDER BY U.ID_USUARIO ASC
    `;
    const result = await pool.query(query);
    return result.rows;
};

const getRoles = async () => {
    const result = await pool.query('SELECT ID_ROL, NOMBRE_ROL FROM ROL ORDER BY ID_ROL');
    return result.rows;
};

const createUser = async (nombres, apellidos, correo, contrasena, idRol) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const salt = await bcrypt.genSalt(10);
        const contrasenaEncriptada = await bcrypt.hash(contrasena, salt);

        const insertUserQuery = `
            INSERT INTO USUARIO (NOMBRES, APELLIDOS, CORREO, CONTRASENA, ESTADO) 
            VALUES ($1, $2, $3, $4, 'Activo') RETURNING ID_USUARIO
        `;
        const userResult = await client.query(insertUserQuery, [nombres, apellidos, correo, contrasenaEncriptada]);
        const idUsuario = userResult.rows[0].id_usuario;

        if (idRol) {
            await client.query('INSERT INTO USUARIO_ROL (ID_USUARIO, ID_ROL) VALUES ($1, $2)', [idUsuario, idRol]);
        }

        await client.query('COMMIT');
        return { id_usuario: idUsuario, nombres, apellidos, correo };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const toggleUserStatus = async (idUsuario, estado) => {
    const query = 'UPDATE USUARIO SET ESTADO = $1 WHERE ID_USUARIO = $2 RETURNING ID_USUARIO, ESTADO';
    const result = await pool.query(query, [estado, idUsuario]);
    return result.rows[0];
};

const deleteUser = async (idUsuario) => {
    // Soft delete o delete total? Para un sistema académico, mejor no borrar físicamente por las FKs, lo cambiaremos a inactivo o eliminamos las referencias.
    // Como es "delete", intentaremos borrar si no tiene FKs o si no solo desactivar.
    // Para simplificar, cambiaremos a Inactivo
    const query = "UPDATE USUARIO SET ESTADO = 'Inactivo' WHERE ID_USUARIO = $1 RETURNING ID_USUARIO";
    const result = await pool.query(query, [idUsuario]);
    return result.rows[0];
}

// Cursos
const getAllCourses = async () => {
    const query = `
        SELECT C.ID_CURSO, C.CODIGO, C.NOMBRE, C.CREDITOS, COUNT(CL.ID_CLASE) AS TOTAL_CLASES
        FROM CURSO C
        LEFT JOIN CLASE CL ON C.ID_CURSO = CL.ID_CURSO
        GROUP BY C.ID_CURSO, C.CODIGO, C.NOMBRE, C.CREDITOS
        ORDER BY C.ID_CURSO ASC
    `;
    const result = await pool.query(query);
    return result.rows;
};

const createCourse = async (codigo, nombre, descripcion, creditos) => {
    const query = `
        INSERT INTO CURSO (CODIGO, NOMBRE, DESCRIPCION, CREDITOS) 
        VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const result = await pool.query(query, [codigo, nombre, descripcion, creditos]);
    return result.rows[0];
};

// Matriculas (Para los selects)
const getAvailableClasses = async () => {
    const query = `
        SELECT CL.ID_CLASE, C.NOMBRE, CL.SECCION, CL.PERIODO
        FROM CLASE CL
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        ORDER BY CL.ID_CLASE DESC
    `;
    const result = await pool.query(query);
    return result.rows;
};

const enrollStudent = async (idUsuario, idClase) => {
    const query = `
        INSERT INTO MATRICULA (ID_CLASE, ID_USUARIO, ESTADO_MATRICULA) 
        VALUES ($1, $2, 'ACTIVO') RETURNING *
    `;
    const result = await pool.query(query, [idClase, idUsuario]);
    return result.rows[0];
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    getRoles,
    createUser,
    toggleUserStatus,
    deleteUser,
    getAllCourses,
    createCourse,
    getAvailableClasses,
    enrollStudent
};
