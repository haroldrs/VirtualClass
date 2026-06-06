const pool = require('../../config/db');

const obtenerCursosDeAlumno = async (idUsuario) => {
    const query = `
        SELECT C.ID_CURSO, C.CODIGO, C.NOMBRE, C.DESCRIPCION,
               CL.ID_CLASE, CL.NOMBRE_CLASE, CL.SECCION,
               U.NOMBRES as DOCENTE_NOMBRES, U.APELLIDOS as DOCENTE_APELLIDOS
        FROM MATRICULA M
        JOIN CLASE CL ON M.ID_CLASE = CL.ID_CLASE
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        LEFT JOIN CLASE_DOCENTE CD ON CL.ID_CLASE = CD.ID_CLASE
        LEFT JOIN USUARIO U ON CD.ID_USUARIO = U.ID_USUARIO
        WHERE M.ID_USUARIO = $1 AND M.ESTADO_MATRICULA = 'ACTIVO';
    `;
    const { rows } = await pool.query(query, [idUsuario]);
    return rows;
};

const obtenerCursosDeDocente = async (idUsuario) => {
    const query = `
        SELECT C.ID_CURSO, C.CODIGO, C.NOMBRE, C.DESCRIPCION,
               CL.ID_CLASE, CL.NOMBRE_CLASE, CL.SECCION
        FROM CLASE_DOCENTE CD
        JOIN CLASE CL ON CD.ID_CLASE = CL.ID_CLASE
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        WHERE CD.ID_USUARIO = $1;
    `;
    const { rows } = await pool.query(query, [idUsuario]);
    return rows;
};

module.exports = {
    obtenerCursosDeAlumno,
    obtenerCursosDeDocente
};
