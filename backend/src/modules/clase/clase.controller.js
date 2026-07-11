const claseModel = require('./clase.model');

const obtenerDetalle = async (req, res) => {
    try {
        const detalle = await claseModel.obtenerDetalleClase(req.params.idClase);
        if (!detalle) return res.status(404).json({ mensaje: 'Clase no encontrada' });
        res.json(detalle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener detalle de clase' });
    }
};

const listarSesiones = async (req, res) => {
    try {
        const sesiones = await claseModel.obtenerSesiones(req.params.idClase);
        res.json(sesiones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener sesiones' });
    }
};

const nuevaSesion = async (req, res) => {
    const { tema, descripcion } = req.body;
    try {
        const sesion = await claseModel.crearSesion(req.params.idClase, tema, descripcion);
        res.status(201).json(sesion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear sesión' });
    }
};

const modificarSesion = async (req, res) => {
    const { tema, descripcion } = req.body;
    try {
        const sesion = await claseModel.actualizarSesion(req.params.idSesion, tema, descripcion);
        if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });
        res.json(sesion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al modificar sesión' });
    }
};

const borrarSesion = async (req, res) => {
    try {
        const sesion = await claseModel.eliminarSesion(req.params.idSesion);
        if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });
        res.json({ mensaje: 'Sesión eliminada' });
    } catch (error) {
        console.error(error);
        // Podría ser error de Foreign Key
        res.status(500).json({ mensaje: 'Error al eliminar sesión. Es posible que tenga registros dependientes.' });
    }
};

const actualizarEnlaces = async (req, res) => {
    const { enlaceVideo, enlaceWhatsapp } = req.body;
    try {
        const clase = await claseModel.actualizarEnlacesClase(req.params.idClase, enlaceVideo, enlaceWhatsapp);
        if (!clase) return res.status(404).json({ mensaje: 'Clase no encontrada' });
        res.json({ mensaje: 'Enlaces actualizados correctamente', clase });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar los enlaces de la clase' });
    }
};

module.exports = {
    obtenerDetalle,
    actualizarEnlaces,
    listarSesiones,
    nuevaSesion,
    modificarSesion,
    borrarSesion
};
