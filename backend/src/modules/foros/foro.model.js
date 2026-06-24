const pool = require('../../config/db');

// =============================================
// 1. OBTENER FOROS DEL USUARIO (según su rol)
// =============================================

// Foros de las clases donde el alumno está matriculado
const obtenerForosDeAlumno = async (idUsuario) => {
    const query = `
        SELECT F.ID_FORO, F.TITULO_FORO, F.DESCRIPCION, F.FECHA_CREACION,
               C.CODIGO, C.NOMBRE AS NOMBRE_CURSO,
               CL.ID_CLASE, CL.SECCION,
               (SELECT COUNT(*) FROM TEMA_FORO TF WHERE TF.ID_FORO = F.ID_FORO) AS TOTAL_TEMAS
        FROM MATRICULA M
        JOIN CLASE CL ON M.ID_CLASE = CL.ID_CLASE
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        JOIN FORO F ON F.ID_CLASE = CL.ID_CLASE
        WHERE M.ID_USUARIO = $1 AND M.ESTADO_MATRICULA = 'ACTIVO'
        ORDER BY F.FECHA_CREACION DESC;
    `;
    const { rows } = await pool.query(query, [idUsuario]);
    return rows;
};

// Foros de las clases que el docente dicta
const obtenerForosDeDocente = async (idUsuario) => {
    const query = `
        SELECT F.ID_FORO, F.TITULO_FORO, F.DESCRIPCION, F.FECHA_CREACION,
               C.CODIGO, C.NOMBRE AS NOMBRE_CURSO,
               CL.ID_CLASE, CL.SECCION,
               (SELECT COUNT(*) FROM TEMA_FORO TF WHERE TF.ID_FORO = F.ID_FORO) AS TOTAL_TEMAS
        FROM CLASE_DOCENTE CD
        JOIN CLASE CL ON CD.ID_CLASE = CL.ID_CLASE
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        JOIN FORO F ON F.ID_CLASE = CL.ID_CLASE
        WHERE CD.ID_USUARIO = $1
        ORDER BY F.FECHA_CREACION DESC;
    `;
    const { rows } = await pool.query(query, [idUsuario]);
    return rows;
};

// =============================================
// 2. OBTENER TEMAS DE UN FORO
// =============================================
const obtenerTemasDelForo = async (idForo) => {
    const query = `
        SELECT TF.ID_TEMA, TF.TITULO_TEMA, TF.MENSAJE_INICIAL, TF.FECHA_CREACION,
               U.ID_USUARIO, U.NOMBRES, U.APELLIDOS,
               (SELECT COUNT(*) FROM RESPUESTA_FORO RF WHERE RF.ID_TEMA = TF.ID_TEMA) AS TOTAL_RESPUESTAS
        FROM TEMA_FORO TF
        JOIN USUARIO U ON TF.ID_USUARIO = U.ID_USUARIO
        WHERE TF.ID_FORO = $1
        ORDER BY TF.FECHA_CREACION DESC;
    `;
    const { rows } = await pool.query(query, [idForo]);
    return rows;
};

// =============================================
// 3. OBTENER UN TEMA CON SUS RESPUESTAS
// =============================================
const obtenerTemaConRespuestas = async (idTema) => {
    // Primero obtenemos el tema
    const queryTema = `
        SELECT TF.ID_TEMA, TF.ID_FORO, TF.TITULO_TEMA, TF.MENSAJE_INICIAL, TF.FECHA_CREACION,
               U.ID_USUARIO, U.NOMBRES, U.APELLIDOS
        FROM TEMA_FORO TF
        JOIN USUARIO U ON TF.ID_USUARIO = U.ID_USUARIO
        WHERE TF.ID_TEMA = $1;
    `;
    const resultTema = await pool.query(queryTema, [idTema]);

    if (resultTema.rows.length === 0) return null;

    // Luego obtenemos las respuestas
    const queryRespuestas = `
        SELECT RF.ID_RESPUESTA, RF.CONTENIDO, RF.FECHA_RESPUESTA,
               U.ID_USUARIO, U.NOMBRES, U.APELLIDOS
        FROM RESPUESTA_FORO RF
        JOIN USUARIO U ON RF.ID_USUARIO = U.ID_USUARIO
        WHERE RF.ID_TEMA = $1
        ORDER BY RF.FECHA_RESPUESTA ASC;
    `;
    const resultRespuestas = await pool.query(queryRespuestas, [idTema]);

    return {
        tema: resultTema.rows[0],
        respuestas: resultRespuestas.rows
    };
};

// =============================================
// 4. CREAR UN NUEVO TEMA
// =============================================
const crearTema = async (idForo, idUsuario, tituloTema, mensajeInicial) => {
    const query = `
        INSERT INTO TEMA_FORO (ID_FORO, ID_USUARIO, TITULO_TEMA, MENSAJE_INICIAL)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idForo, idUsuario, tituloTema, mensajeInicial]);
    return rows[0];
};

// =============================================
// 5. CREAR UNA RESPUESTA A UN TEMA
// =============================================
const crearRespuesta = async (idTema, idUsuario, contenido) => {
    const query = `
        INSERT INTO RESPUESTA_FORO (ID_TEMA, ID_USUARIO, CONTENIDO)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idTema, idUsuario, contenido]);
    return rows[0];
};

// =============================================
// 6. BUSCAR TEMAS POR PALABRA CLAVE
// =============================================
const buscarTemas = async (idForo, palabraClave) => {
    const query = `
        SELECT TF.ID_TEMA, TF.TITULO_TEMA, TF.MENSAJE_INICIAL, TF.FECHA_CREACION,
               U.ID_USUARIO, U.NOMBRES, U.APELLIDOS,
               (SELECT COUNT(*) FROM RESPUESTA_FORO RF WHERE RF.ID_TEMA = TF.ID_TEMA) AS TOTAL_RESPUESTAS
        FROM TEMA_FORO TF
        JOIN USUARIO U ON TF.ID_USUARIO = U.ID_USUARIO
        WHERE TF.ID_FORO = $1
          AND (TF.TITULO_TEMA ILIKE $2 OR TF.MENSAJE_INICIAL ILIKE $2)
        ORDER BY TF.FECHA_CREACION DESC;
    `;
    const { rows } = await pool.query(query, [idForo, `%${palabraClave}%`]);
    return rows;
};

module.exports = {
    obtenerForosDeAlumno,
    obtenerForosDeDocente,
    obtenerTemasDelForo,
    obtenerTemaConRespuestas,
    crearTema,
    crearRespuesta,
    buscarTemas
};
