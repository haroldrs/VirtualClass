const pool = require('../../config/db');

// ===================== UNIDADES =====================

const obtenerUnidadesPorClase = async (idClase) => {
    const query = `
        SELECT ID_UNIDAD, ID_CLASE, TITULO, NUMERO
        FROM UNIDAD
        WHERE ID_CLASE = $1
        ORDER BY NUMERO ASC;
    `;
    const { rows } = await pool.query(query, [idClase]);
    return rows;
};

const crearUnidad = async (idClase, titulo, numero) => {
    const query = `
        INSERT INTO UNIDAD (ID_CLASE, TITULO, NUMERO)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idClase, titulo, numero]);
    return rows[0];
};

const eliminarUnidad = async (idUnidad) => {
    // Primero eliminar semanas hijas, recursos y evaluaciones huérfanas
    // Los recursos/evaluaciones con ID_MODULO de semanas de esta unidad se deben desvincular
    const semanas = await pool.query('SELECT ID_MODULO FROM MODULO_CLASE WHERE ID_UNIDAD = $1', [idUnidad]);
    for (const s of semanas.rows) {
        await pool.query('UPDATE RECURSOS SET ID_MODULO = NULL WHERE ID_MODULO = $1', [s.id_modulo]);
        await pool.query('UPDATE EVALUACION SET ID_MODULO = NULL WHERE ID_MODULO = $1', [s.id_modulo]);
    }
    await pool.query('DELETE FROM MODULO_CLASE WHERE ID_UNIDAD = $1', [idUnidad]);
    const { rows } = await pool.query('DELETE FROM UNIDAD WHERE ID_UNIDAD = $1 RETURNING *', [idUnidad]);
    return rows[0];
};

// ===================== SEMANAS (MODULO_CLASE) =====================

const obtenerSemanasPorUnidad = async (idUnidad) => {
    const query = `
        SELECT ID_MODULO, ID_CLASE, ID_UNIDAD, TITULO, DESCRIPCION, ORDEN
        FROM MODULO_CLASE
        WHERE ID_UNIDAD = $1
        ORDER BY ORDEN ASC;
    `;
    const { rows } = await pool.query(query, [idUnidad]);
    return rows;
};

const obtenerSemanasPorClase = async (idClase) => {
    const query = `
        SELECT M.ID_MODULO, M.ID_CLASE, M.ID_UNIDAD, M.TITULO, M.DESCRIPCION, M.ORDEN,
               U.TITULO as UNIDAD_TITULO, U.NUMERO as UNIDAD_NUMERO
        FROM MODULO_CLASE M
        LEFT JOIN UNIDAD U ON M.ID_UNIDAD = U.ID_UNIDAD
        WHERE M.ID_CLASE = $1
        ORDER BY U.NUMERO ASC, M.ORDEN ASC;
    `;
    const { rows } = await pool.query(query, [idClase]);
    return rows;
};

const crearSemana = async (idClase, idUnidad, titulo, descripcion, orden) => {
    const query = `
        INSERT INTO MODULO_CLASE (ID_CLASE, ID_UNIDAD, TITULO, DESCRIPCION, ORDEN)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idClase, idUnidad, titulo, descripcion, orden]);
    return rows[0];
};

const eliminarSemana = async (idModulo) => {
    await pool.query('UPDATE RECURSOS SET ID_MODULO = NULL WHERE ID_MODULO = $1', [idModulo]);
    await pool.query('UPDATE EVALUACION SET ID_MODULO = NULL WHERE ID_MODULO = $1', [idModulo]);
    const { rows } = await pool.query('DELETE FROM MODULO_CLASE WHERE ID_MODULO = $1 RETURNING *', [idModulo]);
    return rows[0];
};

const actualizarSemana = async (idModulo, titulo, descripcion, orden) => {
    const query = `
        UPDATE MODULO_CLASE
        SET TITULO = $1, DESCRIPCION = $2, ORDEN = $3
        WHERE ID_MODULO = $4
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [titulo, descripcion, orden, idModulo]);
    return rows[0];
};

// ===================== RECURSOS POR SEMANA =====================

const obtenerRecursosPorSemana = async (idModulo) => {
    const query = `
        SELECT ID_RECURSO, TITULO, DESCRIPCION, TIPO_RECURSO, URL_ARCHIVO, FECHA_PUBLICACION
        FROM RECURSOS
        WHERE ID_MODULO = $1
        ORDER BY FECHA_PUBLICACION DESC;
    `;
    const { rows } = await pool.query(query, [idModulo]);
    return rows;
};

const crearRecursoEnSemana = async (idClase, idModulo, titulo, descripcion, tipoRecurso, urlArchivo, driveFileId = null, driveUrl = null) => {
    const query = `
        INSERT INTO RECURSOS (ID_CLASE, ID_MODULO, TITULO, DESCRIPCION, TIPO_RECURSO, URL_ARCHIVO, DRIVE_FILE_ID, DRIVE_URL)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idClase, idModulo, titulo, descripcion, tipoRecurso, urlArchivo, driveFileId, driveUrl]);
    return rows[0];
};

// ===================== EVALUACIONES POR SEMANA =====================

const obtenerEvaluacionesPorSemana = async (idModulo) => {
    const query = `
        SELECT ID_EVALUACION, NOMBRE_EVA, PORCENTAJE, FECHA_EVALUACION, ARCHIVO_URL as ARCHIVO_URL_DOCENTE
        FROM EVALUACION
        WHERE ID_MODULO = $1
        ORDER BY FECHA_EVALUACION ASC;
    `;
    const { rows } = await pool.query(query, [idModulo]);
    return rows;
};

const crearEvaluacionEnSemana = async (idClase, idModulo, nombre, porcentaje, fecha, urlArchivo = null, driveFileId = null, driveUrl = null) => {
    const query = `
        INSERT INTO EVALUACION (ID_CLASE, ID_MODULO, NOMBRE_EVA, PORCENTAJE, FECHA_EVALUACION, ARCHIVO_URL, DRIVE_FILE_ID, DRIVE_URL)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [idClase, idModulo, nombre, porcentaje, fecha, urlArchivo, driveFileId, driveUrl]);
    const nuevaEva = rows[0];

    if (nuevaEva) {
        const calQuery = `
            INSERT INTO CALENDARIO_ACADEMICO (ID_CLASE, TITULO_EVENTO, DESCRIPCION, FECHA_INICIO, FECHA_FIN, TIPO_EVENTO, ID_EVALUACION)
            VALUES ($1, $2, $3, $4, $4, 'entrega', $5)
        `;
        await pool.query(calQuery, [idClase, `Evaluación: ${nombre}`, `Evaluación con peso de ${porcentaje}%`, fecha, nuevaEva.id_evaluacion]);
    }

    return nuevaEva;
};

// ===================== CALCULO DE NOTAS =====================

const obtenerPromediosPorUnidad = async (idClase, idUsuario) => {
    // Obtener todas las unidades
    const unidades = await obtenerUnidadesPorClase(idClase);
    const resultado = [];

    for (const unidad of unidades) {
        // Obtener evaluaciones de esta unidad (todas las semanas)
        const query = `
            SELECT E.ID_EVALUACION, E.NOMBRE_EVA, E.PORCENTAJE, E.FECHA_EVALUACION,
                   N.CALIFICACION, N.COMENTARIO,
                   M.TITULO as SEMANA_TITULO
            FROM EVALUACION E
            JOIN MODULO_CLASE M ON E.ID_MODULO = M.ID_MODULO
            LEFT JOIN NOTA N ON E.ID_EVALUACION = N.ID_EVALUACION AND N.ID_USUARIO = $2
            WHERE M.ID_UNIDAD = $1
            ORDER BY M.ORDEN ASC, E.FECHA_EVALUACION ASC;
        `;
        const { rows: evaluaciones } = await pool.query(query, [unidad.id_unidad, idUsuario]);

        let sumaPonderada = 0;
        let sumaPesos = 0;
        let totalEvaluaciones = evaluaciones.length;
        let evaluacionesCalificadas = 0;

        evaluaciones.forEach(ev => {
            if (ev.calificacion !== null && ev.calificacion !== undefined) {
                sumaPonderada += parseFloat(ev.calificacion) * parseFloat(ev.porcentaje);
                sumaPesos += parseFloat(ev.porcentaje);
                evaluacionesCalificadas++;
            }
        });

        const promedio = sumaPesos > 0 ? (sumaPonderada / sumaPesos) : null;

        resultado.push({
            ...unidad,
            evaluaciones,
            promedio: promedio !== null ? Math.round(promedio * 100) / 100 : null,
            totalEvaluaciones,
            evaluacionesCalificadas
        });
    }

    // Nota final: promedio simple de las unidades
    const unidadesConNota = resultado.filter(u => u.promedio !== null);
    const notaFinal = unidadesConNota.length > 0
        ? Math.round((unidadesConNota.reduce((acc, u) => acc + u.promedio, 0) / unidadesConNota.length) * 100) / 100
        : null;

    return { unidades: resultado, notaFinal };
};

// ===================== ESTRUCTURA COMPLETA DE CLASE =====================

const obtenerEstructuraCompleta = async (idClase, idUsuario) => {
    const unidades = await obtenerUnidadesPorClase(idClase);
    const estructura = [];

    for (const unidad of unidades) {
        const semanas = await obtenerSemanasPorUnidad(unidad.id_unidad);
        const semanasConContenido = [];

        for (const semana of semanas) {
            const recursos = await obtenerRecursosPorSemana(semana.id_modulo);

            // Evaluaciones con nota del alumno si se pasa idUsuario
            let evaluaciones;
            if (idUsuario) {
                const qEval = `
                    SELECT E.ID_EVALUACION, E.NOMBRE_EVA, E.PORCENTAJE, E.FECHA_EVALUACION, E.ARCHIVO_URL as ARCHIVO_URL_DOCENTE,
                           EE.ID_ENTREGA, EE.ARCHIVO_URL,
                           N.CALIFICACION, N.COMENTARIO
                    FROM EVALUACION E
                    LEFT JOIN ENTREGA_EVALUACION EE ON E.ID_EVALUACION = EE.ID_EVALUACION AND EE.ID_USUARIO = $2
                    LEFT JOIN NOTA N ON E.ID_EVALUACION = N.ID_EVALUACION AND N.ID_USUARIO = $2
                    WHERE E.ID_MODULO = $1
                    ORDER BY E.FECHA_EVALUACION ASC;
                `;
                const { rows } = await pool.query(qEval, [semana.id_modulo, idUsuario]);
                evaluaciones = rows;
            } else {
                evaluaciones = await obtenerEvaluacionesPorSemana(semana.id_modulo);
            }

            semanasConContenido.push({
                ...semana,
                recursos,
                evaluaciones
            });
        }

        // Calcular promedio de la unidad
        let sumaPonderada = 0;
        let sumaPesos = 0;
        semanasConContenido.forEach(s => {
            s.evaluaciones.forEach(ev => {
                if (ev.calificacion !== null && ev.calificacion !== undefined) {
                    sumaPonderada += parseFloat(ev.calificacion) * parseFloat(ev.porcentaje);
                    sumaPesos += parseFloat(ev.porcentaje);
                }
            });
        });

        const promedio = sumaPesos > 0 ? Math.round((sumaPonderada / sumaPesos) * 100) / 100 : null;

        estructura.push({
            ...unidad,
            semanas: semanasConContenido,
            promedio
        });
    }

    const unidadesConNota = estructura.filter(u => u.promedio !== null);
    const notaFinal = unidadesConNota.length > 0
        ? Math.round((unidadesConNota.reduce((acc, u) => acc + u.promedio, 0) / unidadesConNota.length) * 100) / 100
        : null;

    return { estructura, notaFinal };
};

module.exports = {
    obtenerUnidadesPorClase,
    crearUnidad,
    eliminarUnidad,
    obtenerSemanasPorUnidad,
    obtenerSemanasPorClase,
    crearSemana,
    actualizarSemana,
    eliminarSemana,
    obtenerRecursosPorSemana,
    crearRecursoEnSemana,
    obtenerEvaluacionesPorSemana,
    crearEvaluacionEnSemana,
    obtenerPromediosPorUnidad,
    obtenerEstructuraCompleta
};
