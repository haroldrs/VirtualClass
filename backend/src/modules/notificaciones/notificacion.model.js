const pool = require('../../config/db');

const crearNotificacion = async (idUsuarioDestino, titulo, mensaje, enlace = null) => {
    const query = `
        INSERT INTO NOTIFICACION (id_usuario_destino, titulo, mensaje, enlace_opcional)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const res = await pool.query(query, [idUsuarioDestino, titulo, mensaje, enlace]);
    return res.rows[0];
};

const obtenerNotificacionesPorUsuario = async (idUsuario) => {
    const query = `
        SELECT * FROM NOTIFICACION
        WHERE id_usuario_destino = $1
        ORDER BY fecha_creacion DESC
        LIMIT 50;
    `;
    const res = await pool.query(query, [idUsuario]);
    return res.rows;
};

const obtenerNoLeidas = async (idUsuario) => {
    const query = `
        SELECT COUNT(*) as unread_count 
        FROM NOTIFICACION
        WHERE id_usuario_destino = $1 AND leida = FALSE;
    `;
    const res = await pool.query(query, [idUsuario]);
    return parseInt(res.rows[0].unread_count, 10);
};

const marcarComoLeidas = async (idUsuario) => {
    const query = `
        UPDATE NOTIFICACION
        SET leida = TRUE
        WHERE id_usuario_destino = $1 AND leida = FALSE;
    `;
    await pool.query(query, [idUsuario]);
    return true;
};

const marcarUnaComoLeida = async (idNotificacion) => {
    const query = `
        UPDATE NOTIFICACION
        SET leida = TRUE
        WHERE id_notificacion = $1;
    `;
    await pool.query(query, [idNotificacion]);
    return true;
};

const eliminarNotificacion = async (idNotificacion) => {
    const query = `
        DELETE FROM NOTIFICACION
        WHERE id_notificacion = $1;
    `;
    await pool.query(query, [idNotificacion]);
    return true;
};

module.exports = {
    crearNotificacion,
    obtenerNotificacionesPorUsuario,
    obtenerNoLeidas,
    marcarComoLeidas,
    marcarUnaComoLeida,
    eliminarNotificacion
};
