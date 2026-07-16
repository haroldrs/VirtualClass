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
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, 
               E.ID_EVALUACION, E.NOMBRE_EVA, E.PORCENTAJE, 
               N.CALIFICACION, N.ID_NOTA,
               EE.ID_ENTREGA, EE.ARCHIVO_URL, EE.FECHA_ENTREGA
        FROM MATRICULA M
        JOIN USUARIO U ON M.ID_USUARIO = U.ID_USUARIO
        LEFT JOIN EVALUACION E ON E.ID_CLASE = M.ID_CLASE
        LEFT JOIN NOTA N ON E.ID_EVALUACION = N.ID_EVALUACION AND N.ID_USUARIO = U.ID_USUARIO
        LEFT JOIN ENTREGA_EVALUACION EE ON E.ID_EVALUACION = EE.ID_EVALUACION AND EE.ID_USUARIO = U.ID_USUARIO
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

const obtenerResumenGlobalAlumno = async (idUsuario) => {
    const query = `
        SELECT C.ID_CLASE, CU.NOMBRE AS CURSO, C.SECCION,
               E.ID_EVALUACION, E.PORCENTAJE, N.CALIFICACION
        FROM MATRICULA M
        JOIN CLASE C ON M.ID_CLASE = C.ID_CLASE
        JOIN CURSO CU ON C.ID_CURSO = CU.ID_CURSO
        LEFT JOIN EVALUACION E ON E.ID_CLASE = C.ID_CLASE
        LEFT JOIN NOTA N ON N.ID_EVALUACION = E.ID_EVALUACION AND N.ID_USUARIO = $1
        WHERE M.ID_USUARIO = $1 AND M.ESTADO_MATRICULA = 'ACTIVO';
    `;
    const { rows } = await pool.query(query, [idUsuario]);
    return rows;
};

const obtenerResumenGlobalDocente = async (idUsuario) => {
    // Para cada clase del docente, necesitamos:
    // 1. Número de alumnos matriculados
    // 2. Número de entregas pendientes por revisar (ENTREGA_EVALUACION sin NOTA)
    // 3. Promedio general del aula
    const query = `
        SELECT C.ID_CLASE, CU.NOMBRE AS CURSO, C.SECCION,
               (SELECT COUNT(*) FROM MATRICULA M2 WHERE M2.ID_CLASE = C.ID_CLASE AND M2.ESTADO_MATRICULA = 'ACTIVO') AS TOTAL_ALUMNOS,
               (SELECT COUNT(*) 
                FROM EVALUACION E 
                JOIN ENTREGA_EVALUACION EE ON E.ID_EVALUACION = EE.ID_EVALUACION 
                LEFT JOIN NOTA N ON EE.ID_EVALUACION = N.ID_EVALUACION AND EE.ID_USUARIO = N.ID_USUARIO 
                WHERE E.ID_CLASE = C.ID_CLASE AND N.ID_NOTA IS NULL) AS ENTREGAS_PENDIENTES,
               (SELECT AVG(N.CALIFICACION) 
                FROM EVALUACION E 
                JOIN NOTA N ON E.ID_EVALUACION = N.ID_EVALUACION 
                WHERE E.ID_CLASE = C.ID_CLASE) AS PROMEDIO_AULA
        FROM CLASE_DOCENTE CD
        JOIN CLASE C ON CD.ID_CLASE = C.ID_CLASE
        JOIN CURSO CU ON C.ID_CURSO = CU.ID_CURSO
        WHERE CD.ID_USUARIO = $1;
    `;
    const { rows } = await pool.query(query, [idUsuario]);
    return rows;
};

// ===================== NOTAS POR UNIDAD (ALUMNO) =====================

const obtenerNotasAlumnoPorUnidad = async (idUsuario, idClase) => {
    const query = `
        SELECT U.ID_UNIDAD, U.TITULO AS UNIDAD_TITULO, U.NUMERO AS UNIDAD_NUMERO,
               E.ID_EVALUACION, E.NOMBRE_EVA, E.PORCENTAJE, E.FECHA_EVALUACION,
               M.TITULO AS SEMANA_TITULO, M.ORDEN AS SEMANA_ORDEN,
               N.CALIFICACION, N.COMENTARIO,
               EE.ID_ENTREGA, EE.ARCHIVO_URL, EE.FECHA_ENTREGA
        FROM UNIDAD U
        LEFT JOIN MODULO_CLASE M ON M.ID_UNIDAD = U.ID_UNIDAD
        LEFT JOIN EVALUACION E ON E.ID_MODULO = M.ID_MODULO
        LEFT JOIN NOTA N ON E.ID_EVALUACION = N.ID_EVALUACION AND N.ID_USUARIO = $1
        LEFT JOIN ENTREGA_EVALUACION EE ON E.ID_EVALUACION = EE.ID_EVALUACION AND EE.ID_USUARIO = $1
        WHERE U.ID_CLASE = $2
        ORDER BY U.NUMERO ASC, M.ORDEN ASC, E.FECHA_EVALUACION ASC;
    `;
    const { rows } = await pool.query(query, [idUsuario, idClase]);
    return rows;
};

// ===================== NOTAS POR UNIDAD (DOCENTE) =====================

const obtenerAlumnosDocentePorUnidad = async (idClase) => {
    const query = `
        SELECT U2.ID_UNIDAD, U2.TITULO AS UNIDAD_TITULO, U2.NUMERO AS UNIDAD_NUMERO,
               E.ID_EVALUACION, E.NOMBRE_EVA, E.PORCENTAJE, E.FECHA_EVALUACION,
               M.ORDEN AS SEMANA_ORDEN,
               US.ID_USUARIO, US.NOMBRES, US.APELLIDOS,
               N.CALIFICACION, N.ID_NOTA,
               EE.ID_ENTREGA, EE.ARCHIVO_URL, EE.FECHA_ENTREGA
        FROM UNIDAD U2
        LEFT JOIN MODULO_CLASE M ON M.ID_UNIDAD = U2.ID_UNIDAD
        LEFT JOIN EVALUACION E ON E.ID_MODULO = M.ID_MODULO
        CROSS JOIN (
            SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS
            FROM MATRICULA MA
            JOIN USUARIO U ON MA.ID_USUARIO = U.ID_USUARIO
            WHERE MA.ID_CLASE = $1 AND MA.ESTADO_MATRICULA = 'ACTIVO'
        ) US
        LEFT JOIN NOTA N ON E.ID_EVALUACION = N.ID_EVALUACION AND N.ID_USUARIO = US.ID_USUARIO
        LEFT JOIN ENTREGA_EVALUACION EE ON E.ID_EVALUACION = EE.ID_EVALUACION AND EE.ID_USUARIO = US.ID_USUARIO
        WHERE U2.ID_CLASE = $1
        ORDER BY U2.NUMERO ASC, US.APELLIDOS ASC, US.NOMBRES ASC, M.ORDEN ASC, E.FECHA_EVALUACION ASC;
    `;
    const { rows } = await pool.query(query, [idClase]);
    return rows;
};

module.exports = {
    obtenerNotasDeAlumno,
    obtenerAlumnosParaDocente,
    registrarOActualizarNota,
    obtenerResumenGlobalAlumno,
    obtenerResumenGlobalDocente,
    obtenerNotasAlumnoPorUnidad,
    obtenerAlumnosDocentePorUnidad
};
