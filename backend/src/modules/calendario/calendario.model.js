const pool = require('../../config/db');

// =============================================
// 1. OBTENER EVENTOS DEL ALUMNO (por sus clases matriculadas)
// =============================================
const obtenerEventosDeAlumno = async (idUsuario, mes, anio) => {
    const query = `
        SELECT CA.ID_EVENTO, CA.TITULO_EVENTO, CA.DESCRIPCION, 
               CA.FECHA_INICIO, CA.FECHA_FIN, CA.TIPO_EVENTO,
               CA.ID_CLASE, C.CODIGO, C.NOMBRE AS NOMBRE_CURSO, CL.SECCION
        FROM CALENDARIO_ACADEMICO CA
        JOIN CLASE CL ON CA.ID_CLASE = CL.ID_CLASE
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        JOIN MATRICULA M ON M.ID_CLASE = CL.ID_CLASE
        WHERE M.ID_USUARIO = $1 AND M.ESTADO_MATRICULA = 'ACTIVO'
          AND EXTRACT(MONTH FROM CA.FECHA_INICIO) = $2
          AND EXTRACT(YEAR FROM CA.FECHA_INICIO) = $3
          
        UNION ALL
        
        SELECT A.ID_ASESORIA AS ID_EVENTO, 
               'Asesoría: ' || A.MOTIVO AS TITULO_EVENTO, 
               COALESCE(A.DESCRIPCION, 'Reunión programada') AS DESCRIPCION,
               A.FECHA_HORA AS FECHA_INICIO, 
               A.FECHA_HORA + INTERVAL '1 hour' AS FECHA_FIN, 
               'reunion' AS TIPO_EVENTO,
               NULL AS ID_CLASE, 
               'ASE' AS CODIGO, 
               'Asesoría Académica' AS NOMBRE_CURSO, 
               '-' AS SECCION
        FROM ASESORIA A
        WHERE (A.ID_SOLICITANTE = $1 OR A.ID_ASESORIA IN (SELECT PA.ID_ASESORIA FROM PARTICIPANTE_ASESORIA PA WHERE PA.ID_USUARIO = $1))
          AND A.ESTADO = 'confirmada'
          AND EXTRACT(MONTH FROM A.FECHA_HORA) = $2
          AND EXTRACT(YEAR FROM A.FECHA_HORA) = $3
          
        ORDER BY FECHA_INICIO ASC;
    `;
    const { rows } = await pool.query(query, [idUsuario, mes, anio]);
    return rows;
};

// =============================================
// 2. OBTENER EVENTOS DEL DOCENTE (por sus clases asignadas)
// =============================================
const obtenerEventosDeDocente = async (idUsuario, mes, anio) => {
    const query = `
        SELECT CA.ID_EVENTO, CA.TITULO_EVENTO, CA.DESCRIPCION,
               CA.FECHA_INICIO, CA.FECHA_FIN, CA.TIPO_EVENTO,
               CA.ID_CLASE, C.CODIGO, C.NOMBRE AS NOMBRE_CURSO, CL.SECCION
        FROM CALENDARIO_ACADEMICO CA
        JOIN CLASE CL ON CA.ID_CLASE = CL.ID_CLASE
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        JOIN CLASE_DOCENTE CD ON CD.ID_CLASE = CL.ID_CLASE
        WHERE CD.ID_USUARIO = $1
          AND EXTRACT(MONTH FROM CA.FECHA_INICIO) = $2
          AND EXTRACT(YEAR FROM CA.FECHA_INICIO) = $3
          
        UNION ALL
        
        SELECT A.ID_ASESORIA AS ID_EVENTO, 
               'Asesoría: ' || A.MOTIVO AS TITULO_EVENTO, 
               COALESCE(A.DESCRIPCION, 'Reunión programada') AS DESCRIPCION,
               A.FECHA_HORA AS FECHA_INICIO, 
               A.FECHA_HORA + INTERVAL '1 hour' AS FECHA_FIN, 
               'reunion' AS TIPO_EVENTO,
               NULL AS ID_CLASE, 
               'ASE' AS CODIGO, 
               'Asesoría Académica' AS NOMBRE_CURSO, 
               '-' AS SECCION
        FROM ASESORIA A
        WHERE A.ID_DOCENTE = $1
          AND A.ESTADO = 'confirmada'
          AND EXTRACT(MONTH FROM A.FECHA_HORA) = $2
          AND EXTRACT(YEAR FROM A.FECHA_HORA) = $3
          
        ORDER BY FECHA_INICIO ASC;
    `;
    const { rows } = await pool.query(query, [idUsuario, mes, anio]);
    return rows;
};

// =============================================
// 3. OBTENER PRÓXIMOS EVENTOS (para el panel lateral)
// =============================================
const obtenerProximosEventosAlumno = async (idUsuario, limite = 5) => {
    const query = `
        SELECT CA.ID_EVENTO, CA.TITULO_EVENTO, CA.DESCRIPCION,
               CA.FECHA_INICIO, CA.FECHA_FIN, CA.TIPO_EVENTO,
               C.CODIGO, C.NOMBRE AS NOMBRE_CURSO
        FROM CALENDARIO_ACADEMICO CA
        JOIN CLASE CL ON CA.ID_CLASE = CL.ID_CLASE
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        JOIN MATRICULA M ON M.ID_CLASE = CL.ID_CLASE
        WHERE M.ID_USUARIO = $1 AND M.ESTADO_MATRICULA = 'ACTIVO'
          AND CA.FECHA_INICIO >= NOW()
          
        UNION ALL
        
        SELECT A.ID_ASESORIA AS ID_EVENTO, 
               'Asesoría: ' || A.MOTIVO AS TITULO_EVENTO, 
               COALESCE(A.DESCRIPCION, 'Reunión programada') AS DESCRIPCION,
               A.FECHA_HORA AS FECHA_INICIO, 
               A.FECHA_HORA + INTERVAL '1 hour' AS FECHA_FIN, 
               'reunion' AS TIPO_EVENTO,
               'ASE' AS CODIGO, 
               'Asesoría Académica' AS NOMBRE_CURSO
        FROM ASESORIA A
        WHERE (A.ID_SOLICITANTE = $1 OR A.ID_ASESORIA IN (SELECT PA.ID_ASESORIA FROM PARTICIPANTE_ASESORIA PA WHERE PA.ID_USUARIO = $1))
          AND A.ESTADO = 'confirmada'
          AND A.FECHA_HORA >= NOW()
          
        ORDER BY FECHA_INICIO ASC
        LIMIT $2;
    `;
    const { rows } = await pool.query(query, [idUsuario, limite]);
    return rows;
};

const obtenerProximosEventosDocente = async (idUsuario, limite = 5) => {
    const query = `
        SELECT CA.ID_EVENTO, CA.TITULO_EVENTO, CA.DESCRIPCION,
               CA.FECHA_INICIO, CA.FECHA_FIN, CA.TIPO_EVENTO,
               C.CODIGO, C.NOMBRE AS NOMBRE_CURSO
        FROM CALENDARIO_ACADEMICO CA
        JOIN CLASE CL ON CA.ID_CLASE = CL.ID_CLASE
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        JOIN CLASE_DOCENTE CD ON CD.ID_CLASE = CL.ID_CLASE
        WHERE CD.ID_USUARIO = $1
          AND CA.FECHA_INICIO >= NOW()
          
        UNION ALL
        
        SELECT A.ID_ASESORIA AS ID_EVENTO, 
               'Asesoría: ' || A.MOTIVO AS TITULO_EVENTO, 
               COALESCE(A.DESCRIPCION, 'Reunión programada') AS DESCRIPCION,
               A.FECHA_HORA AS FECHA_INICIO, 
               A.FECHA_HORA + INTERVAL '1 hour' AS FECHA_FIN, 
               'reunion' AS TIPO_EVENTO,
               'ASE' AS CODIGO, 
               'Asesoría Académica' AS NOMBRE_CURSO
        FROM ASESORIA A
        WHERE A.ID_DOCENTE = $1
          AND A.ESTADO = 'confirmada'
          AND A.FECHA_HORA >= NOW()
          
        ORDER BY FECHA_INICIO ASC
        LIMIT $2;
    `;
    const { rows } = await pool.query(query, [idUsuario, limite]);
    return rows;
};

// =============================================
// 4. OBTENER CLASES DEL DOCENTE (para el selector al crear evento)
// =============================================
const obtenerClasesDelDocente = async (idUsuario) => {
    const query = `
        SELECT CL.ID_CLASE, C.CODIGO, C.NOMBRE AS NOMBRE_CURSO, CL.SECCION
        FROM CLASE_DOCENTE CD
        JOIN CLASE CL ON CD.ID_CLASE = CL.ID_CLASE
        JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
        WHERE CD.ID_USUARIO = $1
        ORDER BY C.CODIGO;
    `;
    const { rows } = await pool.query(query, [idUsuario]);
    return rows;
};

// =============================================
// 5. CREAR EVENTO (solo docentes)
// =============================================
const crearEvento = async (idClase, titulo, descripcion, fechaInicio, fechaFin, tipoEvento) => {
    const query = `
        INSERT INTO CALENDARIO_ACADEMICO (ID_CLASE, TITULO_EVENTO, DESCRIPCION, FECHA_INICIO, FECHA_FIN, TIPO_EVENTO)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idClase, titulo, descripcion, fechaInicio, fechaFin, tipoEvento]);
    return rows[0];
};

// =============================================
// 6. ACTUALIZAR EVENTO
// =============================================
const actualizarEvento = async (idEvento, titulo, descripcion, fechaInicio, fechaFin, tipoEvento) => {
    const query = `
        UPDATE CALENDARIO_ACADEMICO
        SET TITULO_EVENTO = $1, DESCRIPCION = $2, FECHA_INICIO = $3, FECHA_FIN = $4, TIPO_EVENTO = $5
        WHERE ID_EVENTO = $6
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [titulo, descripcion, fechaInicio, fechaFin, tipoEvento, idEvento]);
    return rows[0];
};

// =============================================
// 7. ELIMINAR EVENTO
// =============================================
const eliminarEvento = async (idEvento) => {
    const query = `DELETE FROM CALENDARIO_ACADEMICO WHERE ID_EVENTO = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [idEvento]);
    return rows[0];
};

module.exports = {
    obtenerEventosDeAlumno,
    obtenerEventosDeDocente,
    obtenerProximosEventosAlumno,
    obtenerProximosEventosDocente,
    obtenerClasesDelDocente,
    crearEvento,
    actualizarEvento,
    eliminarEvento
};
