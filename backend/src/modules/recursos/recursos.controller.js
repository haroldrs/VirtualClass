const recursosModel = require('./recursos.model');
const pool = require('../../config/db');
const { uploadFileToDrive, deleteFileFromDrive } = require('../../utils/drive');

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
    const idClase = req.params.idClase;
    let urlParaGuardar = url_archivo; // Por defecto lo que venga del frontend (para compatibilidad)
    let driveFileId = null;

    try {
        // Si viene un archivo binario adjunto (gracias a multer)
        if (req.file) {
            // Buscamos el folder_id de esta clase
            const claseQuery = await pool.query('SELECT DRIVE_FOLDER_ID FROM CLASE WHERE ID_CLASE = $1', [idClase]);
            const folderId = claseQuery.rows[0]?.drive_folder_id;

            // Subimos a drive pasándole el folderId
            const driveResponse = await uploadFileToDrive(req.file, folderId);
            
            // Usamos el webViewLink como URL para que los alumnos lo puedan ver
            urlParaGuardar = driveResponse.webViewLink;
            driveFileId = driveResponse.id;
        }

        const recurso = await recursosModel.crearRecurso(idClase, titulo, descripcion, tipo_recurso, urlParaGuardar, driveFileId);
        res.status(201).json(recurso);
    } catch (error) {
        console.error('Error creando recurso:', error);
        res.status(500).json({ mensaje: 'Error al crear recurso', detalle: error.message });
    }
};

const borrarRecurso = async (req, res) => {
    try {
        const idRecurso = req.params.idRecurso;
        
        // Antes de borrar de BD, buscamos su ID de Drive
        const queryRecurso = await pool.query('SELECT DRIVE_FILE_ID FROM RECURSOS WHERE ID_RECURSO = $1', [idRecurso]);
        const driveFileId = queryRecurso.rows[0]?.drive_file_id;

        const recurso = await recursosModel.eliminarRecurso(idRecurso);
        if (!recurso) return res.status(404).json({ mensaje: 'Recurso no encontrado' });

        // Si tenía un archivo en Drive, lo mandamos a la papelera / borramos
        if (driveFileId) {
            try {
                await deleteFileFromDrive(driveFileId);
            } catch (driveErr) {
                console.error(`No se pudo borrar el archivo ${driveFileId} de Drive, pero sí de BD.`, driveErr.message);
            }
        }

        res.json({ mensaje: 'Recurso eliminado correctamente' });
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
