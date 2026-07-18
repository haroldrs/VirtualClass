const anuncioModel = require('./anuncio.model');

const obtenerActivos = async (req, res) => {
    try {
        const anuncios = await anuncioModel.obtenerAnunciosActivos();
        res.json(anuncios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener anuncios' });
    }
};

const obtenerTodos = async (req, res) => {
    try {
        const anuncios = await anuncioModel.obtenerTodos();
        res.json(anuncios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener anuncios' });
    }
};

const crear = async (req, res) => {
    const { titulo, contenido, nivel, id_autor, imagen_url } = req.body;
    if (!titulo || !contenido) {
        return res.status(400).json({ mensaje: 'Título y contenido son obligatorios' });
    }
    try {
        const anuncio = await anuncioModel.crearAnuncio(titulo, contenido, nivel, id_autor, imagen_url);
        res.status(201).json({ mensaje: 'Anuncio publicado correctamente', anuncio });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear anuncio' });
    }
};

const actualizar = async (req, res) => {
    const { titulo, contenido, nivel, imagen_url } = req.body;
    try {
        const anuncio = await anuncioModel.actualizarAnuncio(req.params.id, titulo, contenido, nivel, imagen_url);
        if (!anuncio) return res.status(404).json({ mensaje: 'Anuncio no encontrado' });
        res.json({ mensaje: 'Anuncio actualizado', anuncio });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar anuncio' });
    }
};

const toggleActivo = async (req, res) => {
    const { activo } = req.body;
    try {
        const anuncio = await anuncioModel.toggleActivo(req.params.id, activo);
        if (!anuncio) return res.status(404).json({ mensaje: 'Anuncio no encontrado' });
        res.json({ mensaje: `Anuncio ${activo ? 'activado' : 'desactivado'}`, anuncio });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al cambiar estado del anuncio' });
    }
};

const eliminar = async (req, res) => {
    try {
        const anuncio = await anuncioModel.eliminarAnuncio(req.params.id);
        if (!anuncio) return res.status(404).json({ mensaje: 'Anuncio no encontrado' });
        res.json({ mensaje: 'Anuncio eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar anuncio' });
    }
};

const reordenar = async (req, res) => {
    try {
        const { updates } = req.body;
        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ mensaje: 'Datos inválidos' });
        }
        await anuncioModel.reorderAnuncios(updates);
        res.json({ mensaje: 'Orden actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al reordenar anuncios' });
    }
};

module.exports = {
    obtenerActivos,
    obtenerTodos,
    crear,
    actualizar,
    toggleActivo,
    eliminar,
    reordenar
};
