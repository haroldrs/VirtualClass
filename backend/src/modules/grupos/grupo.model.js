const pool = require('../../config/db');

// Obtener grupos de una clase
const obtenerGruposDeClase = async (idClase) => {
    const queryGrupos = `
        SELECT ID_GRUPO, NOMBRE_GRUPO, FECHA_CREACION 
        FROM GRUPO 
        WHERE ID_CLASE = $1 
        ORDER BY ID_GRUPO ASC;
    `;
    const { rows: grupos } = await pool.query(queryGrupos, [idClase]);

    for (let grupo of grupos) {
        const queryEstudiantes = `
            SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, U.CORREO
            FROM GRUPO_ESTUDIANTE GE
            JOIN USUARIO U ON GE.ID_USUARIO = U.ID_USUARIO
            WHERE GE.ID_GRUPO = $1
            ORDER BY U.APELLIDOS, U.NOMBRES ASC;
        `;
        const { rows: estudiantes } = await pool.query(queryEstudiantes, [grupo.id_grupo]);
        grupo.estudiantes = estudiantes;
    }
    return grupos;
};

// Crear un grupo
const crearGrupo = async (idClase, nombre_grupo) => {
    const query = `
        INSERT INTO GRUPO (ID_CLASE, NOMBRE_GRUPO, FECHA_CREACION)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idClase, nombre_grupo]);
    return rows[0];
};

// Eliminar un grupo
const eliminarGrupo = async (idGrupo) => {
    // Delete students from group first
    await pool.query('DELETE FROM GRUPO_ESTUDIANTE WHERE ID_GRUPO = $1', [idGrupo]);
    
    // Delete group
    const query = `DELETE FROM GRUPO WHERE ID_GRUPO = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [idGrupo]);
    return rows[0];
};

// Asignar estudiante a grupo
const asignarEstudiante = async (idGrupo, id_usuario) => {
    const query = `
        INSERT INTO GRUPO_ESTUDIANTE (ID_GRUPO, ID_USUARIO)
        VALUES ($1, $2)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idGrupo, id_usuario]);
    return rows[0];
};

// Remover estudiante de grupo
const removerEstudiante = async (idGrupo, idUsuario) => {
    const query = `
        DELETE FROM GRUPO_ESTUDIANTE 
        WHERE ID_GRUPO = $1 AND ID_USUARIO = $2
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idGrupo, idUsuario]);
    return rows[0];
};

// Obtener alumnos sin grupo
const obtenerAlumnosSinGrupo = async (idClase) => {
    const query = `
        SELECT U.ID_USUARIO, U.NOMBRES, U.APELLIDOS, U.CORREO
        FROM MATRICULA M
        JOIN USUARIO U ON M.ID_ESTUDIANTE = U.ID_USUARIO
        WHERE M.ID_CLASE = $1
        AND U.ID_USUARIO NOT IN (
            SELECT GE.ID_USUARIO 
            FROM GRUPO_ESTUDIANTE GE
            JOIN GRUPO G ON GE.ID_GRUPO = G.ID_GRUPO
            WHERE G.ID_CLASE = $1
        )
        ORDER BY U.APELLIDOS, U.NOMBRES ASC;
    `;
    const { rows } = await pool.query(query, [idClase]);
    return rows;
};

module.exports = {
    obtenerGruposDeClase,
    crearGrupo,
    eliminarGrupo,
    asignarEstudiante,
    removerEstudiante,
    obtenerAlumnosSinGrupo
};
