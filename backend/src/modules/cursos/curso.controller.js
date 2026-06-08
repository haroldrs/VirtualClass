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

module.exports = {
    obtenerMisCursos
};
