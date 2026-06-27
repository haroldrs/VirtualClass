const grupoModel = require('./grupo.model');

// Obtener grupos de una clase
const obtenerGrupos = async (req, res) => {
    const { idClase } = req.params;
    try {
        const grupos = await grupoModel.obtenerGruposDeClase(idClase);
        res.status(200).json(grupos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener grupos', error: error.message });
    }
};

// Crear un grupo
const crearGrupo = async (req, res) => {
    const { idClase } = req.params;
    const { nombre_grupo } = req.body;
    try {
        const nuevoGrupo = await grupoModel.crearGrupo(idClase, nombre_grupo);
        res.status(201).json({ mensaje: 'Grupo creado exitosamente', grupo: nuevoGrupo });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear grupo', error: error.message });
    }
};

// Eliminar un grupo
const eliminarGrupo = async (req, res) => {
    const { idGrupo } = req.params;
    try {
        await grupoModel.eliminarGrupo(idGrupo);
        res.status(200).json({ mensaje: 'Grupo eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar grupo', error: error.message });
    }
};

// Asignar estudiante a grupo
const asignarEstudiante = async (req, res) => {
    const { idGrupo } = req.params;
    const { id_usuario } = req.body;
    try {
        await grupoModel.asignarEstudiante(idGrupo, id_usuario);
        res.status(201).json({ mensaje: 'Estudiante asignado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al asignar estudiante', error: error.message });
    }
};

// Remover estudiante de grupo
const removerEstudiante = async (req, res) => {
    const { idGrupo, idUsuario } = req.params;
    try {
        await grupoModel.removerEstudiante(idGrupo, idUsuario);
        res.status(200).json({ mensaje: 'Estudiante removido exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al remover estudiante', error: error.message });
    }
};

// Obtener alumnos sin grupo
const obtenerAlumnosSinGrupo = async (req, res) => {
    const { idClase } = req.params;
    try {
        const alumnos = await grupoModel.obtenerAlumnosSinGrupo(idClase);
        res.status(200).json(alumnos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener alumnos', error: error.message });
    }
};

module.exports = {
    obtenerGrupos,
    crearGrupo,
    eliminarGrupo,
    asignarEstudiante,
    removerEstudiante,
    obtenerAlumnosSinGrupo
};
