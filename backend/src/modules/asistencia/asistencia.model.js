const pool = require('../../config/db');

const obtenerAlumnosPorClase = async (idClase) => {
    const query = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, U.CORREO
        FROM MATRICULA M
        JOIN USUARIO U ON M.ID_USUARIO = U.ID_USUARIO
        WHERE M.ID_CLASE = $1 AND M.ESTADO_MATRICULA = 'ACTIVO'
        ORDER BY U.APELLIDOS, U.NOMBRES;
    `;
    const { rows } = await pool.query(query, [idClase]);
    return rows;
};

const obtenerAsistenciaPorSesion = async (idClase, idSesion) => {
    const query = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, COALESCE(A.ESTADO, 'sin marcar') AS ESTADO, A.ID_ASISTENCIA
        FROM MATRICULA M
        JOIN USUARIO U ON M.ID_USUARIO = U.ID_USUARIO
        LEFT JOIN ASISTENCIA A ON A.ID_USUARIO = U.ID_USUARIO AND A.ID_SESION = $2
        WHERE M.ID_CLASE = $1 AND M.ESTADO_MATRICULA = 'ACTIVO'
        ORDER BY U.APELLIDOS, U.NOMBRES;
    `;
    const { rows } = await pool.query(query, [idClase, idSesion]);
    return rows;
};

const marcarAsistencia = async (idSesion, idUsuario, estado) => {
    // Verificar si ya existe
    const checkQuery = `SELECT ID_ASISTENCIA FROM ASISTENCIA WHERE ID_SESION = $1 AND ID_USUARIO = $2`;
    const checkRes = await pool.query(checkQuery, [idSesion, idUsuario]);

    if (checkRes.rows.length > 0) {
        // Actualizar
        const updateQuery = `UPDATE ASISTENCIA SET ESTADO = $1, FECHA = CURRENT_DATE WHERE ID_SESION = $2 AND ID_USUARIO = $3 RETURNING *`;
        const { rows } = await pool.query(updateQuery, [estado, idSesion, idUsuario]);
        return rows[0];
    } else {
        // Insertar
        const insertQuery = `INSERT INTO ASISTENCIA (ID_SESION, ID_USUARIO, ESTADO, FECHA) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING *`;
        const { rows } = await pool.query(insertQuery, [idSesion, idUsuario, estado]);
        return rows[0];
    }
};

const obtenerPorcentajeAlumno = async (idClase, idUsuario) => {
    // Obtener total de sesiones de la clase que tienen asistencia tomada (al menos un alumno marcado)
    // Para simplificar: total de sesiones
    const totalSesionesQuery = `SELECT COUNT(*) FROM SESION_CLASE WHERE ID_CLASE = $1`;
    const totalRes = await pool.query(totalSesionesQuery, [idClase]);
    const totalSesiones = parseInt(totalRes.rows[0].count) || 0;

    if (totalSesiones === 0) return { porcentaje: 0, mensaje: 'No hay sesiones registradas' };

    const asistidasQuery = `
        SELECT COUNT(*) 
        FROM ASISTENCIA A 
        JOIN SESION_CLASE S ON A.ID_SESION = S.ID_SESION
        WHERE S.ID_CLASE = $1 AND A.ID_USUARIO = $2 AND A.ESTADO IN ('presente', 'tardanza')
    `;
    const asisRes = await pool.query(asistidasQuery, [idClase, idUsuario]);
    const asistidas = parseInt(asisRes.rows[0].count) || 0;

    const porcentaje = Math.round((asistidas / totalSesiones) * 100);
    return { porcentaje, asistidas, totalSesiones };
};

module.exports = {
    obtenerAlumnosPorClase,
    obtenerAsistenciaPorSesion,
    marcarAsistencia,
    obtenerPorcentajeAlumno
};
