const pool = require('../../config/db');

const listarEvaluacionesAlumno = async (idClase, idUsuario) => {
    // Retorna las actividades y si el alumno entregó o no
    const query = `
        SELECT E.ID_EVALUACION, E.NOMBRE_EVA, E.PORCENTAJE, E.FECHA_EVALUACION,
               EE.ID_ENTREGA, EE.ARCHIVO_URL, EE.FECHA_ENTREGA,
               N.CALIFICACION, N.COMENTARIO
        FROM EVALUACION E
        LEFT JOIN ENTREGA_EVALUACION EE ON E.ID_EVALUACION = EE.ID_EVALUACION AND EE.ID_USUARIO = $2
        LEFT JOIN NOTA N ON E.ID_EVALUACION = N.ID_EVALUACION AND N.ID_USUARIO = $2
        WHERE E.ID_CLASE = $1
        ORDER BY E.FECHA_EVALUACION ASC;
    `;
    const { rows } = await pool.query(query, [idClase, idUsuario]);
    return rows;
};

const listarEvaluacionesClase = async (idClase) => {
    const query = `
        SELECT ID_EVALUACION, NOMBRE_EVA, PORCENTAJE, FECHA_EVALUACION
        FROM EVALUACION
        WHERE ID_CLASE = $1
        ORDER BY FECHA_EVALUACION ASC;
    `;
    const { rows } = await pool.query(query, [idClase]);
    return rows;
};

const crearEvaluacion = async (idClase, nombre, porcentaje, fecha) => {
    const query = `
        INSERT INTO EVALUACION (ID_CLASE, NOMBRE_EVA, PORCENTAJE, FECHA_EVALUACION)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idClase, nombre, porcentaje, fecha]);
    return rows[0];
};

const subirEntrega = async (idEvaluacion, idUsuario, archivoUrl) => {
    const checkQuery = `SELECT ID_ENTREGA FROM ENTREGA_EVALUACION WHERE ID_EVALUACION = $1 AND ID_USUARIO = $2`;
    const checkRes = await pool.query(checkQuery, [idEvaluacion, idUsuario]);

    if (checkRes.rows.length > 0) {
        // Update
        const updateQuery = `UPDATE ENTREGA_EVALUACION SET ARCHIVO_URL = $1, FECHA_ENTREGA = CURRENT_TIMESTAMP WHERE ID_EVALUACION = $2 AND ID_USUARIO = $3 RETURNING *`;
        const { rows } = await pool.query(updateQuery, [archivoUrl, idEvaluacion, idUsuario]);
        return rows[0];
    } else {
        // Insert
        const insertQuery = `INSERT INTO ENTREGA_EVALUACION (ID_EVALUACION, ID_USUARIO, ARCHIVO_URL) VALUES ($1, $2, $3) RETURNING *`;
        const { rows } = await pool.query(insertQuery, [idEvaluacion, idUsuario, archivoUrl]);
        return rows[0];
    }
};

const listarEntregasDocente = async (idEvaluacion, idClase) => {
    // Obtiene alumnos, su entrega y su nota (si hay)
    const query = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS,
               EE.ID_ENTREGA, EE.ARCHIVO_URL, EE.FECHA_ENTREGA,
               N.ID_NOTA, N.CALIFICACION, N.COMENTARIO
        FROM MATRICULA M
        JOIN USUARIO U ON M.ID_USUARIO = U.ID_USUARIO
        LEFT JOIN ENTREGA_EVALUACION EE ON U.ID_USUARIO = EE.ID_USUARIO AND EE.ID_EVALUACION = $1
        LEFT JOIN NOTA N ON U.ID_USUARIO = N.ID_USUARIO AND N.ID_EVALUACION = $1
        WHERE M.ID_CLASE = $2 AND M.ESTADO_MATRICULA = 'ACTIVO'
        ORDER BY U.APELLIDOS, U.NOMBRES;
    `;
    const { rows } = await pool.query(query, [idEvaluacion, idClase]);
    return rows;
};

module.exports = {
    listarEvaluacionesAlumno,
    listarEvaluacionesClase,
    crearEvaluacion,
    subirEntrega,
    listarEntregasDocente
};
