const pool = require('../../config/db');

const obtenerNotasDeAlumno = async (idUsuario, idClase) => {
    const query = `
        SELECT E.ID_EVALUACION, E.NOMBRE_EVA, E.PORCENTAJE, E.FECHA_EVALUACION, N.CALIFICACION, N.COMENTARIO
        FROM EVALUACION E
        LEFT JOIN NOTA N ON E.ID_EVALUACION = N.ID_EVALUACION AND N.ID_USUARIO = $1
        WHERE E.ID_CLASE = $2
        ORDER BY E.FECHA_EVALUACION ASC;
    `;
    const { rows } = await pool.query(query, [idUsuario, idClase]);
    return rows;
};

const obtenerAlumnosParaDocente = async (idClase) => {
    const query = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, E.ID_EVALUACION, E.NOMBRE_EVA, E.PORCENTAJE, N.CALIFICACION, N.ID_NOTA
        FROM MATRICULA M
        JOIN USUARIO U ON M.ID_USUARIO = U.ID_USUARIO
        JOIN EVALUACION E ON E.ID_CLASE = M.ID_CLASE
        LEFT JOIN NOTA N ON E.ID_EVALUACION = N.ID_EVALUACION AND N.ID_USUARIO = U.ID_USUARIO
        WHERE M.ID_CLASE = $1 AND M.ESTADO_MATRICULA = 'ACTIVO'
        ORDER BY U.APELLIDOS, U.NOMBRES, E.FECHA_EVALUACION;
    `;
    const { rows } = await pool.query(query, [idClase]);
    return rows;
};

const registrarOActualizarNota = async (idEvaluacion, idUsuario, calificacion, comentario) => {
    const checkQuery = 'SELECT ID_NOTA FROM NOTA WHERE ID_EVALUACION = $1 AND ID_USUARIO = $2';
    const checkRes = await pool.query(checkQuery, [idEvaluacion, idUsuario]);

    if (checkRes.rows.length > 0) {
        // Actualizar
        const updateQuery = 'UPDATE NOTA SET CALIFICACION = $1, COMENTARIO = $2 WHERE ID_EVALUACION = $3 AND ID_USUARIO = $4 RETURNING *';
        const res = await pool.query(updateQuery, [calificacion, comentario, idEvaluacion, idUsuario]);
        return res.rows[0];
    } else {
        // Insertar
        const insertQuery = 'INSERT INTO NOTA (ID_EVALUACION, ID_USUARIO, CALIFICACION, COMENTARIO) VALUES ($1, $2, $3, $4) RETURNING *';
        const res = await pool.query(insertQuery, [idEvaluacion, idUsuario, calificacion, comentario]);
        return res.rows[0];
    }
};

module.exports = {
    obtenerNotasDeAlumno,
    obtenerAlumnosParaDocente,
    registrarOActualizarNota
};
