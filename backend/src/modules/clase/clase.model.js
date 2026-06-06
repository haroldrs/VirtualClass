const pool = require('../../config/db');

const obtenerDetalleClase = async (idClase) => {
    const query = `
        SELECT CL.ID_CLASE, CL.NOMBRE_CLASE, CL.SECCION, C.CODIGO, C.NOMBRE as NOMBRE_CURSO,
               U.NOMBRES as DOCENTE_NOMBRES, U.APELLIDOS as DOCENTE_APELLIDOS
        FROM CLASE CL
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        LEFT JOIN CLASE_DOCENTE CD ON CL.ID_CLASE = CD.ID_CLASE
        LEFT JOIN USUARIO U ON CD.ID_USUARIO = U.ID_USUARIO
        WHERE CL.ID_CLASE = $1;
    `;
    const { rows } = await pool.query(query, [idClase]);
    return rows[0];
};

const obtenerSesiones = async (idClase) => {
    const query = `
        SELECT ID_SESION, TEMA, DESCRIPCION, FECHA 
        FROM SESION_CLASE 
        WHERE ID_CLASE = $1 
        ORDER BY ID_SESION ASC;
    `;
    const { rows } = await pool.query(query, [idClase]);
    return rows;
};

const crearSesion = async (idClase, tema, descripcion) => {
    const query = `
        INSERT INTO SESION_CLASE (ID_CLASE, TEMA, DESCRIPCION) 
        VALUES ($1, $2, $3) 
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idClase, tema, descripcion]);
    return rows[0];
};

const actualizarSesion = async (idSesion, tema, descripcion) => {
    const query = `
        UPDATE SESION_CLASE 
        SET TEMA = $1, DESCRIPCION = $2 
        WHERE ID_SESION = $3 
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [tema, descripcion, idSesion]);
    return rows[0];
};

const eliminarSesion = async (idSesion) => {
    // Nota: Si hay asistencias ligadas, fallaría por foreign key.
    // Como es prueba, intentamos borrar. Si falla el controller lo atrapará.
    const query = `DELETE FROM SESION_CLASE WHERE ID_SESION = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [idSesion]);
    return rows[0];
};

module.exports = {
    obtenerDetalleClase,
    obtenerSesiones,
    crearSesion,
    actualizarSesion,
    eliminarSesion
};
