const evaluacionesModel = require('./evaluaciones.model');
const pool = require('../../config/db');
const { uploadFileToDrive } = require('../../utils/drive');
const notificacionModel = require('../notificaciones/notificacion.model');

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
        
        // Notificar a todos los alumnos matriculados en esta clase
        try {
            const claseQuery = await pool.query(
                `SELECT CU.NOMBRE FROM CLASE C JOIN CURSO CU ON C.ID_CURSO = CU.ID_CURSO WHERE C.ID_CLASE = $1`,
                [req.params.idClase]
            );
            const nombreCurso = claseQuery.rows.length > 0 ? claseQuery.rows[0].nombre : 'tu curso';

            const alumnosQuery = await pool.query(
                `SELECT M.ID_USUARIO FROM MATRICULA M WHERE M.ID_CLASE = $1 AND M.ESTADO_MATRICULA = 'ACTIVO'`,
                [req.params.idClase]
            );
            for (const alumno of alumnosQuery.rows) {
                await notificacionModel.crearNotificacion(
                    alumno.id_usuario,
                    'Nueva Actividad Publicada',
                    `Se ha publicado la actividad "${nombre_eva}" en ${nombreCurso}.`,
                    'dashboard.html'
                );
            }
        } catch (notifErr) {
            console.error('Error al notificar nueva evaluación:', notifErr.message);
        }
        
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

const eliminarEntrega = async (req, res) => {
    const { idEvaluacion, idUsuario } = req.params;
    try {
        const result = await evaluacionesModel.eliminarEntrega(idEvaluacion, idUsuario);
        if (!result) return res.status(404).json({ mensaje: 'Entrega no encontrada' });
        res.json({ mensaje: 'Entrega eliminada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar entrega' });
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
    const { nombre_eva, porcentaje, fecha_evaluacion, eliminar_archivo } = req.body;
    const { idClase } = req.query; // Lo recibimos del frontend para saber la carpeta

    let urlParaGuardar = undefined;
    let driveFileId = undefined;

    try {
        if (req.file && idClase) {
            const claseQuery = await pool.query('SELECT DRIVE_FOLDER_ID FROM CLASE WHERE ID_CLASE = $1', [idClase]);
            const folderId = claseQuery.rows[0]?.drive_folder_id;
            const driveResponse = await uploadFileToDrive(req.file, folderId);
            
            urlParaGuardar = driveResponse.webViewLink;
            driveFileId = driveResponse.id;
        } else if (eliminar_archivo === 'true') {
            urlParaGuardar = null;
            driveFileId = null;
        }

        const ev = await evaluacionesModel.actualizarEvaluacion(
            req.params.idEvaluacion, nombre_eva, porcentaje, fecha_evaluacion, urlParaGuardar, driveFileId
        );
        
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
    eliminarEntrega,
    listarEntregas,
    actualizar,
    eliminar
};
