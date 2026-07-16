const evaluacionesModel = require('./evaluaciones.model');
const pool = require('../../config/db');
const { uploadFileToDrive } = require('../../utils/drive');

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
    const { idEvaluacion, idUsuario, archivoUrl, idClase } = req.body;
    let urlParaGuardar = archivoUrl;
    let driveFileId = null;

    try {
        if (req.file) {
            // Buscamos el folderId de la clase
            const claseQuery = await pool.query('SELECT DRIVE_FOLDER_ID FROM CLASE WHERE ID_CLASE = $1', [idClase]);
            const folderId = claseQuery.rows[0]?.drive_folder_id;

            const driveResponse = await uploadFileToDrive(req.file, folderId);
            
            urlParaGuardar = driveResponse.webViewLink;
            driveFileId = driveResponse.id;
        }

        const entrega = await evaluacionesModel.subirEntrega(idEvaluacion, idUsuario, urlParaGuardar, driveFileId, urlParaGuardar);
        res.status(201).json(entrega);
    } catch (error) {
        console.error('Error al subir entrega:', error);
        res.status(500).json({ mensaje: 'Error al subir entrega', error: error.message });
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

const actualizar = async (req, res) => {
    const { nombre_eva, porcentaje, fecha_evaluacion } = req.body;
    try {
        const ev = await evaluacionesModel.actualizarEvaluacion(req.params.idEvaluacion, nombre_eva, porcentaje, fecha_evaluacion);
        if (!ev) return res.status(404).json({ mensaje: 'Evaluación no encontrada' });
        res.json(ev);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar evaluación' });
    }
};

const eliminar = async (req, res) => {
    try {
        const ev = await evaluacionesModel.eliminarEvaluacion(req.params.idEvaluacion);
        if (!ev) return res.status(404).json({ mensaje: 'Evaluación no encontrada' });
        res.json({ mensaje: 'Evaluación eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar evaluación' });
    }
};

module.exports = {
    listar,
    crear,
    entregar,
    listarEntregas,
    actualizar,
    eliminar
};
