const pool = require('../../config/db');

// Obtener anuncios activos (para la página de Inicio de todos los usuarios)
const obtenerAnunciosActivos = async () => {
    const query = `
        SELECT A.ID_ANUNCIO, A.TITULO, A.CONTENIDO, A.NIVEL, A.FECHA_PUBLICACION, A.IMAGEN_URL,
               U.NOMBRES AS AUTOR_NOMBRES, U.APELLIDOS AS AUTOR_APELLIDOS
        FROM ANUNCIO A
        LEFT JOIN USUARIO U ON A.ID_AUTOR = U.ID_USUARIO
        WHERE A.ACTIVO = TRUE
        ORDER BY A.FECHA_PUBLICACION DESC
        LIMIT 20;
    `;
    const { rows } = await pool.query(query);
    return rows;
};

// Obtener todos los anuncios (para el panel de admin)
const obtenerTodos = async () => {
    const query = `
        SELECT A.ID_ANUNCIO, A.TITULO, A.CONTENIDO, A.NIVEL, A.FECHA_PUBLICACION, A.ACTIVO, A.IMAGEN_URL,
               U.NOMBRES AS AUTOR_NOMBRES, U.APELLIDOS AS AUTOR_APELLIDOS
        FROM ANUNCIO A
        LEFT JOIN USUARIO U ON A.ID_AUTOR = U.ID_USUARIO
        ORDER BY A.FECHA_PUBLICACION DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
};

// Crear un anuncio (admin)
const crearAnuncio = async (titulo, contenido, nivel, idAutor, imagen_url = null) => {
    const query = `
        INSERT INTO ANUNCIO (TITULO, CONTENIDO, NIVEL, ID_AUTOR, IMAGEN_URL)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [titulo, contenido, nivel || 'info', idAutor || null, imagen_url]);
    return rows[0];
};

// Actualizar un anuncio (admin)
const actualizarAnuncio = async (idAnuncio, titulo, contenido, nivel, imagen_url = null) => {
    const query = `
        UPDATE ANUNCIO SET TITULO = $1, CONTENIDO = $2, NIVEL = $3, IMAGEN_URL = $4
        WHERE ID_ANUNCIO = $5
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [titulo, contenido, nivel, imagen_url, idAnuncio]);
    return rows[0];
};

// Cambiar estado activo/inactivo (admin)
const toggleActivo = async (idAnuncio, activo) => {
    const query = `UPDATE ANUNCIO SET ACTIVO = $1 WHERE ID_ANUNCIO = $2 RETURNING *;`;
    const { rows } = await pool.query(query, [activo, idAnuncio]);
    return rows[0];
};

// Eliminar un anuncio (admin)
const eliminarAnuncio = async (idAnuncio) => {
    const query = `DELETE FROM ANUNCIO WHERE ID_ANUNCIO = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [idAnuncio]);
    return rows[0];
};

module.exports = {
    obtenerAnunciosActivos,
    obtenerTodos,
    crearAnuncio,
    actualizarAnuncio,
    toggleActivo,
    eliminarAnuncio
};
