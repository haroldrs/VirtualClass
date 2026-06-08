const recursosModel = require('./recursos.model');

const listarRecursos = async (req, res) => {
    try {
        const recursos = await recursosModel.obtenerRecursos(req.params.idClase);
        res.json(recursos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener recursos' });
    }
};

const nuevoRecurso = async (req, res) => {
    const { titulo, descripcion, tipo_recurso, url_archivo } = req.body;
    try {
        const recurso = await recursosModel.crearRecurso(req.params.idClase, titulo, descripcion, tipo_recurso, url_archivo);
        res.status(201).json(recurso);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear recurso' });
    }
};

const borrarRecurso = async (req, res) => {
    try {
        const recurso = await recursosModel.eliminarRecurso(req.params.idRecurso);
        if (!recurso) return res.status(404).json({ mensaje: 'Recurso no encontrado' });
        res.json({ mensaje: 'Recurso eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar recurso' });
    }
};

module.exports = {
    listarRecursos,
    nuevoRecurso,
    borrarRecurso
};
