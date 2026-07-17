const modularModel = require('./modular.model');
const pool = require('../../config/db');
const { uploadFileToDrive } = require('../../utils/drive');
const notificacionModel = require('../notificaciones/notificacion.model');
// ===================== UNIDADES =====================

const getUnidades = async (req, res) => {
    try {
        const unidades = await modularModel.obtenerUnidadesPorClase(req.params.idClase);
        res.status(200).json(unidades);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener unidades', error: error.message });
    }
};

const createUnidad = async (req, res) => {
    const { titulo, numero } = req.body;
    try {
        const unidad = await modularModel.crearUnidad(req.params.idClase, titulo, numero);
        res.status(201).json({ mensaje: 'Unidad creada', unidad });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear unidad', error: error.message });
    }
};

const deleteUnidad = async (req, res) => {
    try {
        const result = await modularModel.eliminarUnidad(req.params.idUnidad);
        if (!result) return res.status(404).json({ mensaje: 'Unidad no encontrada' });
        res.status(200).json({ mensaje: 'Unidad eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar unidad', error: error.message });
    }
};

// ===================== SEMANAS =====================

const getSemanas = async (req, res) => {
    try {
        const semanas = await modularModel.obtenerSemanasPorUnidad(req.params.idUnidad);
        res.status(200).json(semanas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener semanas', error: error.message });
    }
};

const createSemana = async (req, res) => {
    const { idUnidad, titulo, descripcion, orden } = req.body;
    try {
        const semana = await modularModel.crearSemana(req.params.idClase, idUnidad, titulo, descripcion, orden);
        res.status(201).json({ mensaje: 'Semana creada', semana });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear semana', error: error.message });
    }
};

const updateSemana = async (req, res) => {
    const { titulo, descripcion, orden } = req.body;
    try {
        const semana = await modularModel.actualizarSemana(req.params.idModulo, titulo, descripcion, orden);
        if (!semana) return res.status(404).json({ mensaje: 'Semana no encontrada' });
        res.status(200).json({ mensaje: 'Semana actualizada', semana });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar semana', error: error.message });
    }
};

const deleteSemana = async (req, res) => {
    try {
        const result = await modularModel.eliminarSemana(req.params.idModulo);
        if (!result) return res.status(404).json({ mensaje: 'Semana no encontrada' });
        res.status(200).json({ mensaje: 'Semana eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar semana', error: error.message });
    }
};

// ===================== RECURSOS EN SEMANA =====================

const getRecursosSemana = async (req, res) => {
    try {
        const recursos = await modularModel.obtenerRecursosPorSemana(req.params.idModulo);
        res.status(200).json(recursos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener recursos', error: error.message });
    }
};

const createRecursoSemana = async (req, res) => {
    const { titulo, descripcion, tipo_recurso, url_archivo } = req.body;
    const { idClase, idModulo } = req.params;
    let urlParaGuardar = url_archivo;
    let driveFileId = null;

    try {
        if (req.file) {
            const claseQuery = await pool.query('SELECT DRIVE_FOLDER_ID FROM CLASE WHERE ID_CLASE = $1', [idClase]);
            const folderId = claseQuery.rows[0]?.drive_folder_id;

            const driveResponse = await uploadFileToDrive(req.file, folderId);
            
            urlParaGuardar = driveResponse.webViewLink;
            driveFileId = driveResponse.id;
        }

        const recurso = await modularModel.crearRecursoEnSemana(
            idClase, idModulo,
            titulo, descripcion || '', tipo_recurso, urlParaGuardar, driveFileId, urlParaGuardar
        );
        res.status(201).json({ mensaje: 'Recurso creado', recurso });
    } catch (error) {
        console.error('Error creando recurso semanal:', error);
        res.status(500).json({ mensaje: 'Error al crear recurso', error: error.message });
    }
};

// ===================== EVALUACIONES EN SEMANA =====================

const getEvaluacionesSemana = async (req, res) => {
    try {
        const evaluaciones = await modularModel.obtenerEvaluacionesPorSemana(req.params.idModulo);
        res.status(200).json(evaluaciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener evaluaciones', error: error.message });
    }
};

const createEvaluacionSemana = async (req, res) => {
    const { nombre_eva, porcentaje, fecha_evaluacion } = req.body;
    const { idClase, idModulo } = req.params;
    let urlParaGuardar = null;
    let driveFileId = null;

    try {
        if (req.file) {
            const claseQuery = await pool.query('SELECT DRIVE_FOLDER_ID FROM CLASE WHERE ID_CLASE = $1', [idClase]);
            const folderId = claseQuery.rows[0]?.drive_folder_id;

            const driveResponse = await uploadFileToDrive(req.file, folderId);
            
            urlParaGuardar = driveResponse.webViewLink;
            driveFileId = driveResponse.id;
        }

        const evaluacion = await modularModel.crearEvaluacionEnSemana(
            idClase, idModulo,
            nombre_eva, porcentaje, fecha_evaluacion, urlParaGuardar, driveFileId, urlParaGuardar
        );
        
        // Notificar a todos los alumnos matriculados en esta clase
        try {
            const alumnosQuery = await pool.query(
                `SELECT M.ID_USUARIO FROM MATRICULA M WHERE M.ID_CLASE = $1 AND M.ESTADO_MATRICULA = 'ACTIVO'`,
                [idClase]
            );
            for (const alumno of alumnosQuery.rows) {
                await notificacionModel.crearNotificacion(
                    alumno.id_usuario,
                    'Nueva Actividad Publicada',
                    `Se ha publicado una nueva actividad: "${nombre_eva}". Revisa los detalles en tu curso.`,
                    'dashboard.html'
                );
            }
        } catch (notifErr) {
            console.error('Error al notificar nueva evaluación modular:', notifErr.message);
        }

        res.status(201).json({ mensaje: 'Evaluación creada', evaluacion });
    } catch (error) {
        console.error('Error creando evaluación:', error);
        res.status(500).json({ mensaje: 'Error al crear evaluación', error: error.message });
    }
};

// ===================== ESTRUCTURA COMPLETA Y NOTAS =====================

const getEstructuraCompleta = async (req, res) => {
    const { idClase } = req.params;
    const idUsuario = req.query.idUsuario || null;
    try {
        const data = await modularModel.obtenerEstructuraCompleta(idClase, idUsuario);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener estructura', error: error.message });
    }
};

const getPromedios = async (req, res) => {
    const { idClase, idUsuario } = req.params;
    try {
        const data = await modularModel.obtenerPromediosPorUnidad(idClase, idUsuario);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al calcular promedios', error: error.message });
    }
};

module.exports = {
    getUnidades,
    createUnidad,
    deleteUnidad,
    getSemanas,
    createSemana,
    updateSemana,
    deleteSemana,
    getRecursosSemana,
    createRecursoSemana,
    getEvaluacionesSemana,
    createEvaluacionSemana,
    getEstructuraCompleta,
    getPromedios
};
