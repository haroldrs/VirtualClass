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
        SELECT C.ID_CURSO, C.CODIGO, C.NOMBRE, C.CREDITOS, C.DESCRIPCION, C.ESTADO, COUNT(CL.ID_CLASE) AS TOTAL_CLASES
        FROM CURSO C
        LEFT JOIN CLASE CL ON C.ID_CURSO = CL.ID_CURSO
        GROUP BY C.ID_CURSO, C.CODIGO, C.NOMBRE, C.CREDITOS, C.DESCRIPCION, C.ESTADO
        ORDER BY C.ID_CURSO ASC
    `;
    const result = await pool.query(query);
    return result.rows;
};

const createCourse = async (codigo, nombre, descripcion, creditos) => {
    const query = `
        INSERT INTO CURSO (CODIGO, NOMBRE, DESCRIPCION, CREDITOS, ESTADO) 
        VALUES ($1, $2, $3, $4, 'Activo') RETURNING *
    `;
    const result = await pool.query(query, [codigo, nombre, descripcion, creditos]);
    return result.rows[0];
};

const updateCourse = async (idCurso, codigo, nombre, descripcion, creditos) => {
    const query = `
        UPDATE CURSO 
        SET CODIGO = $1, NOMBRE = $2, DESCRIPCION = $3, CREDITOS = $4
        WHERE ID_CURSO = $5
        RETURNING *
    `;
    const result = await pool.query(query, [codigo, nombre, descripcion, creditos, idCurso]);
    return result.rows[0];
};

const changeCourseStatus = async (idCurso, estado) => {
    const query = `
        UPDATE CURSO SET ESTADO = $1 WHERE ID_CURSO = $2 RETURNING *
    `;
    const result = await pool.query(query, [estado, idCurso]);
    return result.rows[0];
};

const createClass = async (idCurso, nombreClase, periodo, ciclo, seccion, aula, driveFolderId = null) => {
    const query = `
        INSERT INTO CLASE (ID_CURSO, NOMBRE_CLASE, PERIODO, CICLO, SECCION, AULA, DRIVE_FOLDER_ID) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const result = await pool.query(query, [idCurso, nombreClase, periodo, ciclo, seccion, aula, driveFolderId]);
    return result.rows[0];
};

const updateClass = async (idClase, nombreClase, periodo, ciclo, seccion, aula) => {
    const query = `
        UPDATE CLASE 
        SET NOMBRE_CLASE = $1, PERIODO = $2, CICLO = $3, SECCION = $4, AULA = $5
        WHERE ID_CLASE = $6 RETURNING *
    `;
    const result = await pool.query(query, [nombreClase, periodo, ciclo, seccion, aula, idClase]);
    return result.rows[0];
};

const changeClassStatus = async (idClase, estado) => {
    const query = `
        UPDATE CLASE SET ESTADO = $1 WHERE ID_CLASE = $2 RETURNING *
    `;
    const result = await pool.query(query, [estado, idClase]);
    return result.rows[0];
};

// Matriculas (Para los selects)
const getAvailableClasses = async () => {
    const query = `
        SELECT CL.ID_CLASE, CL.ID_CURSO, C.NOMBRE, CL.NOMBRE_CLASE, CL.SECCION, CL.PERIODO, CL.CICLO, CL.AULA, CL.ESTADO
        FROM CLASE CL
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        ORDER BY CL.ID_CLASE DESC
    `;
    const result = await pool.query(query);
    return result.rows;
};

const enrollStudent = async (idUsuario, idClase) => {
    // 1. Verificar el rol del usuario
    const roleQuery = `
        SELECT R.NOMBRE_ROL 
        FROM USUARIO_ROL UR
        JOIN ROL R ON UR.ID_ROL = R.ID_ROL
        WHERE UR.ID_USUARIO = $1
    `;
    const roleResult = await pool.query(roleQuery, [idUsuario]);
    
    // Si es docente
    if (roleResult.rows.length > 0 && roleResult.rows[0].nombre_rol.includes('Docente')) {
        // Verificar duplicados
        const check = await pool.query('SELECT * FROM CLASE_DOCENTE WHERE ID_CLASE = $1 AND ID_USUARIO = $2', [idClase, idUsuario]);
        if (check.rows.length > 0) throw new Error('El docente ya está asignado a esta clase.');

        const query = `
            INSERT INTO CLASE_DOCENTE (ID_CLASE, ID_USUARIO) 
            VALUES ($1, $2) RETURNING *
        `;
        const result = await pool.query(query, [idClase, idUsuario]);
        return result.rows[0];
    } else {
        // Verificar duplicados
        const check = await pool.query('SELECT * FROM MATRICULA WHERE ID_CLASE = $1 AND ID_USUARIO = $2', [idClase, idUsuario]);
        if (check.rows.length > 0) throw new Error('El alumno ya está matriculado en esta clase.');

        const query = `
            INSERT INTO MATRICULA (ID_CLASE, ID_USUARIO, ESTADO_MATRICULA) 
            VALUES ($1, $2, 'ACTIVO') RETURNING *
        `;
        const result = await pool.query(query, [idClase, idUsuario]);
        return result.rows[0];
    }
};

const assignClassTeacher = async (idClase, idDocenteNuevo) => {
    // 1. Borrar todos los docentes actuales de esta clase
    await pool.query('DELETE FROM CLASE_DOCENTE WHERE ID_CLASE = $1', [idClase]);
    // 2. Insertar el nuevo docente
    const result = await pool.query('INSERT INTO CLASE_DOCENTE (ID_CLASE, ID_USUARIO) VALUES ($1, $2) RETURNING *', [idClase, idDocenteNuevo]);
    return result.rows[0];
};

const getClassParticipants = async (idClase) => {
    // Traer docentes
    const docentesQuery = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, U.CORREO 
        FROM CLASE_DOCENTE CD
        JOIN USUARIO U ON CD.ID_USUARIO = U.ID_USUARIO
        WHERE CD.ID_CLASE = $1
    `;
    const docentes = await pool.query(docentesQuery, [idClase]);

    // Traer alumnos
    const alumnosQuery = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, U.CORREO 
        FROM MATRICULA M
        JOIN USUARIO U ON M.ID_USUARIO = U.ID_USUARIO
        WHERE M.ID_CLASE = $1 AND M.ESTADO_MATRICULA = 'ACTIVO'
    `;
    const alumnos = await pool.query(alumnosQuery, [idClase]);

    return {
        docentes: docentes.rows,
        alumnos: alumnos.rows
    };
};

const changeEnrollmentStatus = async (idClase, idUsuario, estado) => {
    const query = `
        UPDATE MATRICULA 
        SET ESTADO_MATRICULA = $1 
        WHERE ID_CLASE = $2 AND ID_USUARIO = $3 
        RETURNING *
    `;
    const result = await pool.query(query, [estado, idClase, idUsuario]);
    return result.rows[0];
};

const generarReporteCSV = async (tipo) => {
    let csv = '';
    if (tipo === 'matriculas') {
        const query = `
            SELECT C.NOMBRE, CL.SECCION, CL.PERIODO, U.NOMBRES, U.APELLIDOS, U.CORREO, M.ESTADO_MATRICULA
            FROM MATRICULA M 
            JOIN CLASE CL ON M.ID_CLASE = CL.ID_CLASE 
            JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
            JOIN USUARIO U ON M.ID_USUARIO = U.ID_USUARIO
            ORDER BY CL.PERIODO DESC, C.NOMBRE, U.APELLIDOS
        `;
        const { rows } = await pool.query(query);
        csv = 'CURSO,SECCION,PERIODO,ALUMNO_NOMBRES,ALUMNO_APELLIDOS,CORREO,ESTADO_MATRICULA\n';
        rows.forEach(r => csv += `"${r.nombre}","${r.seccion}","${r.periodo}","${r.nombres}","${r.apellidos}","${r.correo}","${r.estado_matricula}"\n`);
    } else if (tipo === 'carga_docente') {
        const query = `
            SELECT U.NOMBRES, U.APELLIDOS, U.CORREO, C.NOMBRE as CURSO, CL.SECCION, CL.PERIODO
            FROM CLASE_DOCENTE CD
            JOIN USUARIO U ON CD.ID_USUARIO = U.ID_USUARIO
            JOIN CLASE CL ON CD.ID_CLASE = CL.ID_CLASE
            JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
            ORDER BY U.APELLIDOS, CL.PERIODO DESC
        `;
        const { rows } = await pool.query(query);
        csv = 'DOCENTE_NOMBRES,DOCENTE_APELLIDOS,CORREO,CURSO_ASIGNADO,SECCION,PERIODO\n';
        rows.forEach(r => csv += `"${r.nombres}","${r.apellidos}","${r.correo}","${r.curso}","${r.seccion}","${r.periodo}"\n`);
    } else if (tipo === 'usuarios') {
        const query = `
            SELECT U.NOMBRES, U.APELLIDOS, U.CORREO, R.NOMBRE_ROL, U.ESTADO
            FROM USUARIO U
            LEFT JOIN USUARIO_ROL UR ON U.ID_USUARIO = UR.ID_USUARIO
            LEFT JOIN ROL R ON UR.ID_ROL = R.ID_ROL
            ORDER BY R.NOMBRE_ROL, U.APELLIDOS
        `;
        const { rows } = await pool.query(query);
        csv = 'NOMBRES,APELLIDOS,CORREO,ROL,ESTADO_CUENTA\n';
        rows.forEach(r => csv += `"${r.nombres}","${r.apellidos}","${r.correo}","${r.nombre_rol || 'Sin Rol'}","${r.estado}"\n`);
    }
    return csv;
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
    updateCourse,
    changeCourseStatus,
    createClass,
    updateClass,
    changeClassStatus,
    getAvailableClasses,
    enrollStudent,
    assignClassTeacher,
    getClassParticipants,
    changeEnrollmentStatus,
    generarReporteCSV
};
