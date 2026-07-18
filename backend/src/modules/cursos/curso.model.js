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
        WHERE M.ID_USUARIO = $1 AND M.ESTADO_MATRICULA = 'ACTIVO' AND C.ESTADO = 'Activo' AND CL.ESTADO = 'Activo';
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
        WHERE CD.ID_USUARIO = $1 AND C.ESTADO = 'Activo' AND CL.ESTADO = 'Activo';
    `;
    const { rows } = await pool.query(query, [idUsuario]);
    return rows;
};

const obtenerCursosDisponibles = async (idUsuario) => {
    // Check if auto-matricula is enabled
    const { rows: configRows } = await pool.query("SELECT VALOR FROM CONFIGURACION_GLOBAL WHERE CLAVE = 'auto_matricula'");
    if (configRows.length === 0 || configRows[0].valor !== 'true') {
        throw new Error('La auto-matrícula no está habilitada en este momento.');
    }

    const { rows: periodoRows } = await pool.query("SELECT VALOR FROM CONFIGURACION_GLOBAL WHERE CLAVE = 'periodo_activo'");
    const periodo = periodoRows.length > 0 ? periodoRows[0].valor : '';

    const query = `
        SELECT C.ID_CURSO, C.CODIGO, C.NOMBRE, C.DESCRIPCION, C.CREDITOS,
               CL.ID_CLASE, CL.NOMBRE_CLASE, CL.SECCION, CL.AULA,
               U.NOMBRES as DOCENTE_NOMBRES, U.APELLIDOS as DOCENTE_APELLIDOS,
               (CASE WHEN M.ID_MATRICULA IS NOT NULL THEN true ELSE false END) as ESTA_MATRICULADO
        FROM CLASE CL
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        LEFT JOIN CLASE_DOCENTE CD ON CL.ID_CLASE = CD.ID_CLASE
        LEFT JOIN USUARIO U ON CD.ID_USUARIO = U.ID_USUARIO
        LEFT JOIN MATRICULA M ON M.ID_CLASE = CL.ID_CLASE AND M.ID_USUARIO = $1 AND M.ESTADO_MATRICULA ILIKE 'ACTIVO'
        WHERE CL.PERIODO = $2 AND C.ESTADO ILIKE 'ACTIVO' AND CL.ESTADO ILIKE 'ACTIVO';
    `;
    const { rows } = await pool.query(query, [idUsuario, periodo]);
    return rows;
};

const matricularEnClase = async (idUsuario, idClase) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if auto-matricula is enabled
        const { rows: configRows } = await client.query("SELECT VALOR FROM CONFIGURACION_GLOBAL WHERE CLAVE = 'auto_matricula'");
        if (configRows.length === 0 || configRows[0].valor !== 'true') {
            throw new Error('La auto-matrícula no está habilitada.');
        }

        // Verify credit limits (e.g. max 22)
        const { rows: periodoRows } = await client.query("SELECT VALOR FROM CONFIGURACION_GLOBAL WHERE CLAVE = 'periodo_activo'");
        const periodo = periodoRows.length > 0 ? periodoRows[0].valor : '';

        // Get current credits
        const creditosQuery = `
            SELECT COALESCE(SUM(C.CREDITOS), 0) as TOTAL_CREDITOS
            FROM MATRICULA M
            JOIN CLASE CL ON M.ID_CLASE = CL.ID_CLASE
            JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
            WHERE M.ID_USUARIO = $1 AND CL.PERIODO = $2 AND M.ESTADO_MATRICULA = 'ACTIVO'
        `;
        const credRes = await client.query(creditosQuery, [idUsuario, periodo]);
        const creditosActuales = parseInt(credRes.rows[0].total_creditos) || 0;

        // Get credits for the class they want to enroll in
        const claseQuery = `SELECT C.CREDITOS FROM CLASE CL JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO WHERE CL.ID_CLASE = $1`;
        const claseRes = await client.query(claseQuery, [idClase]);
        if (claseRes.rows.length === 0) throw new Error('La clase no existe.');
        const creditosNuevos = parseInt(claseRes.rows[0].creditos) || 0;

        if (creditosActuales + creditosNuevos > 22) { // Max 22 creditos (podría venir de config)
            throw new Error(`Límite de créditos excedido. Tienes ${creditosActuales} y este curso vale ${creditosNuevos}. Máximo permitido: 22.`);
        }

        // Check if already enrolled in the SAME CLASS
        const checkM = await client.query("SELECT 1 FROM MATRICULA WHERE ID_USUARIO = $1 AND ID_CLASE = $2 AND ESTADO_MATRICULA = 'ACTIVO'", [idUsuario, idClase]);
        if (checkM.rows.length > 0) throw new Error('Ya estás matriculado en esta clase.');

        // Proceed to enroll
        const matQuery = `
            INSERT INTO MATRICULA (ID_USUARIO, ID_CLASE, FECHA_MATRICULA, ESTADO_MATRICULA)
            VALUES ($1, $2, NOW(), 'ACTIVO')
            RETURNING *;
        `;
        const res = await client.query(matQuery, [idUsuario, idClase]);

        await client.query('COMMIT');
        return res.rows[0];
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

module.exports = {
    obtenerCursosDeAlumno,
    obtenerCursosDeDocente,
    obtenerCursosDisponibles,
    matricularEnClase
};
