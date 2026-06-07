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

const registrarNota = async (req, res) => {
    const { idEvaluacion, idUsuario, calificacion, comentario } = req.body;
    try {
        const nota = await calificacionesModel.registrarOActualizarNota(idEvaluacion, idUsuario, calificacion, comentario);
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

        const resumen = Object.values(cursosMap).map(c => {
            const promedio = c.porcentajeTotal > 0 ? (c.sumaPonderada / (c.porcentajeTotal/100)).toFixed(2) : null;
            return {
                ...c,
                promedio
            };
        });

        res.json(resumen);
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

module.exports = {
    obtenerNotasAlumno,
    obtenerAlumnosDocente,
    registrarNota,
    resumenGlobalAlumno,
    resumenGlobalDocente
};
