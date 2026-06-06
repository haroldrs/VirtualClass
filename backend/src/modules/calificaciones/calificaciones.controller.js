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
            alumnosAgrupados[row.id_usuario].evaluaciones.push({
                id_evaluacion: row.id_evaluacion,
                nombre_eva: row.nombre_eva,
                porcentaje: row.porcentaje,
                calificacion: row.calificacion,
                id_nota: row.id_nota
            });
        });
        
        res.status(200).json(Object.values(alumnosAgrupados));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener alumnos' });
    }
};

const calificar = async (req, res) => {
    const { idEvaluacion, idUsuario, calificacion, comentario } = req.body;
    try {
        const nota = await calificacionesModel.registrarOActualizarNota(idEvaluacion, idUsuario, calificacion, comentario);
        res.status(200).json({ mensaje: 'Calificación guardada', nota });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al guardar calificación' });
    }
};

module.exports = {
    obtenerNotasAlumno,
    obtenerAlumnosDocente,
    calificar
};
