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

const obtenerAsistenciaPorSesion = async (idClase, idModulo) => {
    const query = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, COALESCE(A.ESTADO, 'sin marcar') AS ESTADO, A.ID_ASISTENCIA
        FROM MATRICULA M
        JOIN USUARIO U ON M.ID_USUARIO = U.ID_USUARIO
        LEFT JOIN ASISTENCIA A ON A.ID_USUARIO = U.ID_USUARIO AND A.ID_MODULO = $2
        WHERE M.ID_CLASE = $1 AND M.ESTADO_MATRICULA = 'ACTIVO'
        ORDER BY U.APELLIDOS, U.NOMBRES;
    `;
    const { rows } = await pool.query(query, [idClase, idModulo]);
    return rows;
};

const marcarAsistencia = async (idModulo, idUsuario, estado) => {
    // Verificar si ya existe
    const checkQuery = `SELECT ID_ASISTENCIA FROM ASISTENCIA WHERE ID_MODULO = $1 AND ID_USUARIO = $2`;
    const checkRes = await pool.query(checkQuery, [idModulo, idUsuario]);

    if (checkRes.rows.length > 0) {
        // Actualizar
        const updateQuery = `UPDATE ASISTENCIA SET ESTADO = $1, FECHA = CURRENT_DATE WHERE ID_MODULO = $2 AND ID_USUARIO = $3 RETURNING *`;
        const { rows } = await pool.query(updateQuery, [estado, idModulo, idUsuario]);
        return rows[0];
    } else {
        // Insertar
        const insertQuery = `INSERT INTO ASISTENCIA (ID_MODULO, ID_USUARIO, ESTADO, FECHA) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING *`;
        const { rows } = await pool.query(insertQuery, [idModulo, idUsuario, estado]);
        return rows[0];
    }
};

const obtenerPorcentajeAlumno = async (idClase, idUsuario) => {
    // Obtener total de semanas de la clase
    const totalSesionesQuery = `SELECT COUNT(*) FROM MODULO_CLASE WHERE ID_CLASE = $1`;
    const totalRes = await pool.query(totalSesionesQuery, [idClase]);
    const totalSesiones = parseInt(totalRes.rows[0].count) || 0;

    if (totalSesiones === 0) return { porcentaje: 0, mensaje: 'No hay semanas registradas' };

    const asistidasQuery = `
        SELECT COUNT(*) 
        FROM ASISTENCIA A 
        JOIN MODULO_CLASE S ON A.ID_MODULO = S.ID_MODULO
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
