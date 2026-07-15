const pool = require('../../config/db');

const obtenerRecursos = async (idClase) => {
    const query = `
        SELECT ID_RECURSO, TITULO, DESCRIPCION, TIPO_RECURSO, URL_ARCHIVO, FECHA_PUBLICACION
        FROM RECURSOS
        WHERE ID_CLASE = $1
        ORDER BY FECHA_PUBLICACION DESC;
    `;
    const { rows } = await pool.query(query, [idClase]);
    return rows;
};

const crearRecurso = async (idClase, titulo, descripcion, tipoRecurso, urlArchivo, driveFileId = null) => {
    const query = `
        INSERT INTO RECURSOS (ID_CLASE, TITULO, DESCRIPCION, TIPO_RECURSO, URL_ARCHIVO, DRIVE_FILE_ID, DRIVE_URL)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idClase, titulo, descripcion, tipoRecurso, urlArchivo, driveFileId, urlArchivo]);
    return rows[0];
};

const eliminarRecurso = async (idRecurso) => {
    const query = `DELETE FROM RECURSOS WHERE ID_RECURSO = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [idRecurso]);
    return rows[0];
};

module.exports = {
    obtenerRecursos,
    crearRecurso,
    eliminarRecurso
};
