const pool = require('../../config/db');

// =============================================
// 1. OBTENER ASESORÍAS DEL DOCENTE (las que le han solicitado)
// =============================================
const obtenerAsesoriasDocente = async (idDocente) => {
    const query = `
        SELECT A.*, 
               SOL.NOMBRES AS SOLICITANTE_NOMBRES, SOL.APELLIDOS AS SOLICITANTE_APELLIDOS, SOL.CORREO AS SOLICITANTE_CORREO,
               G.NOMBRE_GRUPO
        FROM ASESORIA A
        JOIN USUARIO SOL ON A.ID_SOLICITANTE = SOL.ID_USUARIO
        LEFT JOIN GRUPO G ON A.ID_GRUPO = G.ID_GRUPO
        WHERE A.ID_DOCENTE = $1
        ORDER BY 
            CASE A.ESTADO 
                WHEN 'pendiente' THEN 1 
                WHEN 'confirmada' THEN 2 
                WHEN 'rechazada' THEN 3 
            END,
            A.FECHA_HORA DESC;
    `;
    const { rows } = await pool.query(query, [idDocente]);
    return rows;
};

// =============================================
// 2. OBTENER ASESORÍAS DEL ALUMNO (las que ha solicitado + donde participa)
// =============================================
const obtenerAsesoriasAlumno = async (idAlumno) => {
    const query = `
        SELECT A.ID_ASESORIA, A.ID_DOCENTE, A.ID_SOLICITANTE, A.ID_GRUPO,
               A.MOTIVO, A.DESCRIPCION, A.FECHA_HORA, A.ENLACE_REUNION, A.ESTADO,
               DOC.NOMBRES AS DOCENTE_NOMBRES, DOC.APELLIDOS AS DOCENTE_APELLIDOS,
               SOL.NOMBRES AS SOLICITANTE_NOMBRES, SOL.APELLIDOS AS SOLICITANTE_APELLIDOS,
               G.NOMBRE_GRUPO,
               CASE WHEN A.ID_SOLICITANTE = $1 THEN true ELSE false END AS es_solicitante
        FROM ASESORIA A
        JOIN USUARIO DOC ON A.ID_DOCENTE = DOC.ID_USUARIO
        JOIN USUARIO SOL ON A.ID_SOLICITANTE = SOL.ID_USUARIO
        LEFT JOIN GRUPO G ON A.ID_GRUPO = G.ID_GRUPO
        WHERE A.ID_SOLICITANTE = $1 
           OR A.ID_ASESORIA IN (SELECT PA.ID_ASESORIA FROM PARTICIPANTE_ASESORIA PA WHERE PA.ID_USUARIO = $1)
        ORDER BY 
            CASE A.ESTADO 
                WHEN 'pendiente' THEN 1 
                WHEN 'confirmada' THEN 2 
                WHEN 'rechazada' THEN 3 
            END,
            A.FECHA_HORA DESC;
    `;
    const { rows } = await pool.query(query, [idAlumno]);
    return rows;
};

// =============================================
// 3. OBTENER DOCENTES DEL ALUMNO (para el selector al solicitar)
// =============================================
const obtenerDocentesDelAlumno = async (idAlumno) => {
    const query = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, C.NOMBRE AS NOMBRE_CURSO, C.CODIGO
        FROM MATRICULA M
        JOIN CLASE CL ON M.ID_CLASE = CL.ID_CLASE
        JOIN CLASE_DOCENTE CD ON CD.ID_CLASE = CL.ID_CLASE
        JOIN USUARIO U ON CD.ID_USUARIO = U.ID_USUARIO
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        WHERE M.ID_USUARIO = $1 AND M.ESTADO_MATRICULA = 'ACTIVO'
        ORDER BY U.APELLIDOS, C.CODIGO;
    `;
    const { rows } = await pool.query(query, [idAlumno]);
    return rows;
};

// =============================================
// 4. CREAR ASESORÍA (alumno solicita)
// =============================================
const crearAsesoria = async (idDocente, idSolicitante, idGrupo, motivo, descripcion, fechaHora, enlaceReunion) => {
    const query = `
        INSERT INTO ASESORIA (ID_DOCENTE, ID_SOLICITANTE, ID_GRUPO, MOTIVO, DESCRIPCION, FECHA_HORA, ENLACE_REUNION, ESTADO)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente')
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idDocente, idSolicitante, idGrupo || null, motivo, descripcion || '', fechaHora, enlaceReunion || '']);
    return rows[0];
};

// =============================================
// 5. ACTUALIZAR ESTADO (docente confirma/rechaza)
// =============================================
const actualizarEstado = async (idAsesoria, estado, enlaceReunion) => {
    let query;
    let params;
    if (enlaceReunion !== undefined) {
        query = `UPDATE ASESORIA SET ESTADO = $1, ENLACE_REUNION = $2 WHERE ID_ASESORIA = $3 RETURNING *;`;
        params = [estado, enlaceReunion, idAsesoria];
    } else {
        query = `UPDATE ASESORIA SET ESTADO = $1 WHERE ID_ASESORIA = $2 RETURNING *;`;
        params = [estado, idAsesoria];
    }
    const { rows } = await pool.query(query, params);
    return rows[0];
};

// =============================================
// 6. OBTENER PARTICIPANTES DE UNA ASESORÍA
// =============================================
const obtenerParticipantes = async (idAsesoria) => {
    const query = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, U.CORREO
        FROM PARTICIPANTE_ASESORIA PA
        JOIN USUARIO U ON PA.ID_USUARIO = U.ID_USUARIO
        WHERE PA.ID_ASESORIA = $1
        ORDER BY U.APELLIDOS;
    `;
    const { rows } = await pool.query(query, [idAsesoria]);
    return rows;
};

// =============================================
// 7. UNIRSE COMO PARTICIPANTE
// =============================================
const unirseAsesoria = async (idAsesoria, idUsuario) => {
    const query = `
        INSERT INTO PARTICIPANTE_ASESORIA (ID_ASESORIA, ID_USUARIO)
        VALUES ($1, $2)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idAsesoria, idUsuario]);
    return rows[0];
};

// =============================================
// 8. SALIR DE UNA ASESORÍA
// =============================================
const salirDeAsesoria = async (idAsesoria, idUsuario) => {
    const query = `DELETE FROM PARTICIPANTE_ASESORIA WHERE ID_ASESORIA = $1 AND ID_USUARIO = $2 RETURNING *;`;
    const { rows } = await pool.query(query, [idAsesoria, idUsuario]);
    return rows[0];
};

// =============================================
// 9. ELIMINAR ASESORÍA (limpia participantes primero)
// =============================================
const eliminarAsesoria = async (idAsesoria) => {
    await pool.query('DELETE FROM PARTICIPANTE_ASESORIA WHERE ID_ASESORIA = $1', [idAsesoria]);
    const query = `DELETE FROM ASESORIA WHERE ID_ASESORIA = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [idAsesoria]);
    return rows[0];
};

// =============================================
// 10. OBTENER DETALLE DE UNA ASESORÍA
// =============================================
const obtenerDetalle = async (idAsesoria) => {
    const query = `
        SELECT A.*,
               DOC.NOMBRES AS DOCENTE_NOMBRES, DOC.APELLIDOS AS DOCENTE_APELLIDOS, DOC.CORREO AS DOCENTE_CORREO,
               SOL.NOMBRES AS SOLICITANTE_NOMBRES, SOL.APELLIDOS AS SOLICITANTE_APELLIDOS, SOL.CORREO AS SOLICITANTE_CORREO,
               G.NOMBRE_GRUPO
        FROM ASESORIA A
        JOIN USUARIO DOC ON A.ID_DOCENTE = DOC.ID_USUARIO
        JOIN USUARIO SOL ON A.ID_SOLICITANTE = SOL.ID_USUARIO
        LEFT JOIN GRUPO G ON A.ID_GRUPO = G.ID_GRUPO
        WHERE A.ID_ASESORIA = $1;
    `;
    const { rows } = await pool.query(query, [idAsesoria]);
    return rows[0];
};

module.exports = {
    obtenerAsesoriasDocente,
    obtenerAsesoriasAlumno,
    obtenerDocentesDelAlumno,
    crearAsesoria,
    actualizarEstado,
    obtenerParticipantes,
    unirseAsesoria,
    salirDeAsesoria,
    eliminarAsesoria,
    obtenerDetalle
};
