const calificacionesModel = require('./calificaciones.model');

const obtenerNotasAlumno = async (req, res) => {
    const { idUsuario, idClase } = req.params;
    try {
        const notas = await calificacionesModel.obtenerNotasDeAlumno(idUsuario, idClase);
        res.status(200).json(notas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener notas' });
    }
};

const obtenerAlumnosDocente = async (req, res) => {
    const { idClase } = req.params;
    try {
        const alumnos = await calificacionesModel.obtenerAlumnosParaDocente(idClase);
        // Agrupar por alumno para que el frontend lo maneje más fácil
        const alumnosAgrupados = {};
        alumnos.forEach(row => {
            if (!alumnosAgrupados[row.id_usuario]) {
                alumnosAgrupados[row.id_usuario] = {
                    id_usuario: row.id_usuario,
                    nombres: row.nombres,
                    apellidos: row.apellidos,
                    evaluaciones: []
                };
            }
            if (row.id_evaluacion) {
                alumnosAgrupados[row.id_usuario].evaluaciones.push({
                    id_evaluacion: row.id_evaluacion,
                    nombre_eva: row.nombre_eva,
                    porcentaje: row.porcentaje,
                    calificacion: row.calificacion,
                    id_nota: row.id_nota,
                    id_entrega: row.id_entrega,
                    archivo_url: row.archivo_url,
                    fecha_entrega: row.fecha_entrega
                });
            }
        });
        
        res.status(200).json(Object.values(alumnosAgrupados));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener alumnos' });
    }
};

const notificacionModel = require('../notificaciones/notificacion.model');
const pool = require('../../config/db');

const registrarNota = async (req, res) => {
    const { idEvaluacion, idUsuario, calificacion, comentario } = req.body;
    try {
        const nota = await calificacionesModel.registrarOActualizarNota(idEvaluacion, idUsuario, calificacion, comentario);
        
        // Obtener el nombre de la evaluación
        const query = 'SELECT nombre_eva, id_clase FROM EVALUACION WHERE id_evaluacion = $1';
        const evaRes = await pool.query(query, [idEvaluacion]);
        const evaName = evaRes.rows.length > 0 ? evaRes.rows[0].nombre_eva : 'una evaluación';
        
        await notificacionModel.crearNotificacion(
            idUsuario, 
            'Nueva Calificación', 
            `El profesor ha calificado tu entrega para: ${evaName}. Tienes: ${calificacion}.`,
            'calificaciones.html'
        );
        
        res.json(nota);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar nota' });
    }
};

const resumenGlobalAlumno = async (req, res) => {
    try {
        const datos = await calificacionesModel.obtenerResumenGlobalAlumno(req.params.idUsuario);
        // Agrupar por curso y calcular promedio
        const cursosMap = {};
        datos.forEach(row => {
            const idC = row.id_clase;
            if (!cursosMap[idC]) {
                cursosMap[idC] = {
                    id_clase: idC,
                    curso: row.curso,
                    seccion: row.seccion,
                    sumaPonderada: 0,
                    porcentajeTotal: 0
                };
            }
            if (row.calificacion !== null) {
                cursosMap[idC].sumaPonderada += parseFloat(row.calificacion) * (row.porcentaje / 100);
                cursosMap[idC].porcentajeTotal += parseFloat(row.porcentaje);
            }
        });

        // Evaluamos DPI por cada clase
        const pool = require('../../config/db');
        const resumenFinal = [];

        for (const c of Object.values(cursosMap)) {
            let promedio = c.porcentajeTotal > 0 ? (c.sumaPonderada / (c.porcentajeTotal / 100)).toFixed(2) : null;
            let desaprobadoPorFaltas = false;

            // Verificar asistencia (DPI)
            const totalSesionesQuery = `SELECT COUNT(*) FROM MODULO_CLASE WHERE ID_CLASE = $1`;
            const totalRes = await pool.query(totalSesionesQuery, [c.id_clase]);
            const totalSesiones = parseInt(totalRes.rows[0].count) || 0;

            if (totalSesiones > 0) {
                const asistidasQuery = `
                    SELECT COUNT(*) 
                    FROM ASISTENCIA A 
                    JOIN MODULO_CLASE S ON A.ID_MODULO = S.ID_MODULO
                    WHERE S.ID_CLASE = $1 AND A.ID_USUARIO = $2 AND A.ESTADO IN ('presente', 'tardanza')
                `;
                const asisRes = await pool.query(asistidasQuery, [c.id_clase, req.params.idUsuario]);
                const asistidas = parseInt(asisRes.rows[0].count) || 0;

                const porcentajeAsistenciaReal = Math.round((asistidas / totalSesiones) * 100);
                
                if (porcentajeAsistenciaReal < 70) {
                    desaprobadoPorFaltas = true;
                    promedio = 'DPI';
                }
            }

            resumenFinal.push({
                ...c,
                promedio,
                desaprobadoPorFaltas
            });
        }

        res.json(resumenFinal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener resumen global' });
    }
};

const resumenGlobalDocente = async (req, res) => {
    try {
        const resumen = await calificacionesModel.obtenerResumenGlobalDocente(req.params.idUsuario);
        res.json(resumen);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener resumen global' });
    }
};

// ===================== NOTAS POR UNIDAD =====================

const notasAlumnoPorUnidad = async (req, res) => {
    const { idUsuario, idClase } = req.params;
    try {
        const rows = await calificacionesModel.obtenerNotasAlumnoPorUnidad(idUsuario, idClase);

        // Agrupar filas planas en jerarquía: Unidad → Evaluaciones
        const unidadesMap = {};
        rows.forEach(row => {
            const idU = row.id_unidad;
            if (!unidadesMap[idU]) {
                unidadesMap[idU] = {
                    id_unidad: idU,
                    titulo: row.unidad_titulo,
                    numero: row.unidad_numero,
                    evaluaciones: [],
                    sumaPonderada: 0,
                    sumaPesos: 0
                };
            }
            if (row.id_evaluacion) {
                unidadesMap[idU].evaluaciones.push({
                    id_evaluacion: row.id_evaluacion,
                    nombre_eva: row.nombre_eva,
                    porcentaje: row.porcentaje,
                    fecha_evaluacion: row.fecha_evaluacion,
                    semana_titulo: row.semana_titulo,
                    semana_orden: row.semana_orden,
                    calificacion: row.calificacion,
                    comentario: row.comentario,
                    id_entrega: row.id_entrega,
                    archivo_url: row.archivo_url,
                    fecha_entrega: row.fecha_entrega
                });
                if (row.calificacion !== null) {
                    unidadesMap[idU].sumaPonderada += parseFloat(row.calificacion) * parseFloat(row.porcentaje);
                    unidadesMap[idU].sumaPesos += parseFloat(row.porcentaje);
                }
            }
        });

        const unidades = Object.values(unidadesMap).map(u => {
            const promedio = u.sumaPesos > 0 ? Math.round((u.sumaPonderada / u.sumaPesos) * 100) / 100 : null;
            const calificadas = u.evaluaciones.filter(e => e.calificacion !== null).length;
            const pesoCalificado = u.evaluaciones.filter(e => e.calificacion !== null).reduce((s, e) => s + parseFloat(e.porcentaje), 0);
            const pesoTotal = u.evaluaciones.reduce((s, e) => s + parseFloat(e.porcentaje), 0);
            return {
                id_unidad: u.id_unidad,
                titulo: u.titulo,
                numero: u.numero,
                evaluaciones: u.evaluaciones,
                promedio,
                calificadas,
                total: u.evaluaciones.length,
                pesoCalificado,
                pesoTotal
            };
        });

        // Nota final = promedio simple de promedios de unidades con nota
        const unidadesConNota = unidades.filter(u => u.promedio !== null);
        let notaFinal = unidadesConNota.length > 0
            ? Math.round((unidadesConNota.reduce((s, u) => s + u.promedio, 0) / unidadesConNota.length) * 100) / 100
            : null;

        let desaprobadoPorFaltas = false;
        
        // Verificar asistencia (DPI)
        const pool = require('../../config/db');
        const totalSesionesQuery = `SELECT COUNT(*) FROM MODULO_CLASE WHERE ID_CLASE = $1`;
        const totalRes = await pool.query(totalSesionesQuery, [idClase]);
        const totalSesiones = parseInt(totalRes.rows[0].count) || 0;

        if (totalSesiones > 0) {
            const asistidasQuery = `
                SELECT COUNT(*) 
                FROM ASISTENCIA A 
                JOIN MODULO_CLASE S ON A.ID_MODULO = S.ID_MODULO
                WHERE S.ID_CLASE = $1 AND A.ID_USUARIO = $2 AND A.ESTADO IN ('presente', 'tardanza')
            `;
            const asisRes = await pool.query(asistidasQuery, [idClase, idUsuario]);
            const asistidas = parseInt(asisRes.rows[0].count) || 0;

            const porcentajeAsistenciaReal = Math.round((asistidas / totalSesiones) * 100);
            
            if (porcentajeAsistenciaReal < 70) {
                desaprobadoPorFaltas = true;
                notaFinal = 'DPI';
            }
        }

        res.json({ unidades, notaFinal, desaprobadoPorFaltas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener notas por unidad' });
    }
};

const notasDocentePorUnidad = async (req, res) => {
    const { idClase } = req.params;
    try {
        const rows = await calificacionesModel.obtenerAlumnosDocentePorUnidad(idClase);

        // Agrupar: Unidad → { evaluaciones_meta, alumnos → { notas } }
        const unidadesMap = {};
        rows.forEach(row => {
            const idU = row.id_unidad;
            if (!unidadesMap[idU]) {
                unidadesMap[idU] = {
                    id_unidad: idU,
                    titulo: row.unidad_titulo,
                    numero: row.unidad_numero,
                    evaluaciones_meta: {},
                    alumnos: {}
                };
            }

            // Registrar evaluación meta (nombre, porcentaje, semana_orden)
            if (row.id_evaluacion && !unidadesMap[idU].evaluaciones_meta[row.id_evaluacion]) {
                unidadesMap[idU].evaluaciones_meta[row.id_evaluacion] = {
                    id_evaluacion: row.id_evaluacion,
                    nombre_eva: row.nombre_eva,
                    porcentaje: row.porcentaje,
                    fecha_evaluacion: row.fecha_evaluacion,
                    semana_orden: row.semana_orden
                };
            }

            // Registrar alumno
            if (row.id_usuario) {
                if (!unidadesMap[idU].alumnos[row.id_usuario]) {
                    unidadesMap[idU].alumnos[row.id_usuario] = {
                        id_usuario: row.id_usuario,
                        nombres: row.nombres,
                        apellidos: row.apellidos,
                        notas: {}
                    };
                }
                if (row.id_evaluacion) {
                    unidadesMap[idU].alumnos[row.id_usuario].notas[row.id_evaluacion] = {
                        calificacion: row.calificacion,
                        id_nota: row.id_nota,
                        id_entrega: row.id_entrega,
                        archivo_url: row.archivo_url,
                        fecha_entrega: row.fecha_entrega
                    };
                }
            }
        });

        // Convertir a arrays y calcular promedios por alumno por unidad
        const unidades = Object.values(unidadesMap).map(u => {
            const evaluaciones = Object.values(u.evaluaciones_meta);
            const alumnos = Object.values(u.alumnos).map(al => {
                let sumaPond = 0, sumaPesos = 0;
                evaluaciones.forEach(ev => {
                    const nota = al.notas[ev.id_evaluacion];
                    if (nota && nota.calificacion !== null) {
                        sumaPond += parseFloat(nota.calificacion) * parseFloat(ev.porcentaje);
                        sumaPesos += parseFloat(ev.porcentaje);
                    }
                });
                const promedio = sumaPesos > 0 ? Math.round((sumaPond / sumaPesos) * 100) / 100 : null;
                return { ...al, promedio };
            });
            return {
                id_unidad: u.id_unidad,
                titulo: u.titulo,
                numero: u.numero,
                evaluaciones,
                alumnos
            };
        });

        res.json({ unidades });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener notas docente por unidad' });
    }
};

module.exports = {
    obtenerNotasAlumno,
    obtenerAlumnosDocente,
    registrarNota,
    resumenGlobalAlumno,
    resumenGlobalDocente,
    notasAlumnoPorUnidad,
    notasDocentePorUnidad
};
