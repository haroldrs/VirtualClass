const evaluacionesModel = require('./evaluaciones.model');

const listar = async (req, res) => {
    const { idClase, idUsuario } = req.params;
    const { rol } = req.query; // Para saber si es docente o alumno

    try {
        if (rol && rol.toLowerCase().includes('docente')) {
            const evs = await evaluacionesModel.listarEvaluacionesClase(idClase);
            return res.json(evs);
        } else {
            const evs = await evaluacionesModel.listarEvaluacionesAlumno(idClase, idUsuario);
            return res.json(evs);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al listar evaluaciones' });
    }
};

const crear = async (req, res) => {
    const { nombre_eva, porcentaje, fecha_evaluacion } = req.body;
    try {
        const ev = await evaluacionesModel.crearEvaluacion(req.params.idClase, nombre_eva, porcentaje, fecha_evaluacion);
        res.status(201).json(ev);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear evaluación' });
    }
};

const entregar = async (req, res) => {
    const { idEvaluacion, idUsuario, archivoUrl } = req.body;
    try {
        const entrega = await evaluacionesModel.subirEntrega(idEvaluacion, idUsuario, archivoUrl);
        res.status(201).json(entrega);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al subir entrega' });
    }
};

const listarEntregas = async (req, res) => {
    const { idEvaluacion, idClase } = req.params;
    try {
        const entregas = await evaluacionesModel.listarEntregasDocente(idEvaluacion, idClase);
        res.json(entregas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener entregas' });
    }
};

module.exports = {
    listar,
    crear,
    entregar,
    listarEntregas
};
