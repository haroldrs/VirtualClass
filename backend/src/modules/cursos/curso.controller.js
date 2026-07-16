const cursoModel = require('./curso.model');

const obtenerMisCursos = async (req, res) => {
    const { idUsuario, rol } = req.params;

    try {
        let cursos = [];
        if (rol.toLowerCase().includes('docente')) {
            cursos = await cursoModel.obtenerCursosDeDocente(idUsuario);
        } else {
            cursos = await cursoModel.obtenerCursosDeAlumno(idUsuario);
        }

        res.status(200).json(cursos);
    } catch (error) {
        console.error('Error al obtener cursos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const obtenerCursosDisponibles = async (req, res) => {
    const { idUsuario } = req.params;
    try {
        const cursos = await cursoModel.obtenerCursosDisponibles(idUsuario);
        res.status(200).json(cursos);
    } catch (error) {
        if (error.message.includes('auto-matrícula no está habilitada')) {
            return res.status(403).json({ mensaje: error.message });
        }
        res.status(500).json({ mensaje: 'Error al obtener cursos disponibles', error: error.message });
    }
};

const matricularEnClase = async (req, res) => {
    const { idUsuario, idClase } = req.body;
    try {
        const matricula = await cursoModel.matricularEnClase(idUsuario, idClase);
        res.status(200).json({ mensaje: 'Matricula exitosa', matricula });
    } catch (error) {
        if (error.message.includes('Límite de créditos') || error.message.includes('Ya estás matriculado') || error.message.includes('auto-matrícula no está habilitada')) {
            return res.status(400).json({ mensaje: error.message });
        }
        res.status(500).json({ mensaje: 'Error al matricular', error: error.message });
    }
};

module.exports = {
    obtenerMisCursos,
    obtenerCursosDisponibles,
    matricularEnClase
};
