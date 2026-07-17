const foroModel = require('./foro.model');
const notificacionModel = require('../notificaciones/notificacion.model');
const pool = require('../../config/db');

// =============================================
// 1. Obtener los foros del usuario según su rol
// =============================================
const obtenerMisForos = async (req, res) => {
    const { idUsuario, rol } = req.params;

    try {
        let foros = [];
        if (rol.toLowerCase().includes('docente')) {
            foros = await foroModel.obtenerForosDeDocente(idUsuario);
        } else {
            foros = await foroModel.obtenerForosDeAlumno(idUsuario);
        }

        res.status(200).json(foros);
    } catch (error) {
        console.error('Error al obtener foros:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

// =============================================
// 2. Obtener los temas de un foro específico
// =============================================
const obtenerTemas = async (req, res) => {
    const { idForo } = req.params;

    try {
        const temas = await foroModel.obtenerTemasDelForo(idForo);
        res.status(200).json(temas);
    } catch (error) {
        console.error('Error al obtener temas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

// =============================================
// 3. Obtener un tema con todas sus respuestas
// =============================================
const obtenerDiscusion = async (req, res) => {
    const { idTema } = req.params;

    try {
        const discusion = await foroModel.obtenerTemaConRespuestas(idTema);

        if (!discusion) {
            return res.status(404).json({ mensaje: 'Tema no encontrado' });
        }

        res.status(200).json(discusion);
    } catch (error) {
        console.error('Error al obtener discusión:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

// =============================================
// 4. Crear un nuevo tema en un foro
// =============================================
const publicarTema = async (req, res) => {
    const { idForo } = req.params;
    const { id_usuario, titulo_tema, mensaje_inicial } = req.body;

    if (!id_usuario || !titulo_tema || !mensaje_inicial) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios (id_usuario, titulo_tema, mensaje_inicial)' });
    }

    try {
        const nuevoTema = await foroModel.crearTema(idForo, id_usuario, titulo_tema, mensaje_inicial);
        res.status(201).json({
            mensaje: 'Tema publicado exitosamente',
            tema: nuevoTema
        });
    } catch (error) {
        console.error('Error al crear tema:', error);
        res.status(500).json({ mensaje: 'Error al publicar el tema', error: error.message });
    }
};

// =============================================
// 5. Responder a un tema
// =============================================
const responderTema = async (req, res) => {
    const { idTema } = req.params;
    const { id_usuario, contenido } = req.body;

    if (!id_usuario || !contenido) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios (id_usuario, contenido)' });
    }

    try {
        const nuevaRespuesta = await foroModel.crearRespuesta(idTema, id_usuario, contenido);
        
        // Notificar al autor del tema (si no es el mismo que responde)
        try {
            const temaQuery = await pool.query(
                `SELECT TF.ID_USUARIO as autor_id, TF.TITULO_TEMA, U.NOMBRES as responder_nombre, U.APELLIDOS as responder_apellido, CU.NOMBRE as curso_nombre
                 FROM TEMA_FORO TF 
                 JOIN USUARIO U ON U.ID_USUARIO = $1 
                 JOIN FORO F ON TF.ID_FORO = F.ID_FORO
                 JOIN CLASE C ON F.ID_CLASE = C.ID_CLASE
                 JOIN CURSO CU ON C.ID_CURSO = CU.ID_CURSO
                 WHERE TF.ID_TEMA = $2`,
                [id_usuario, idTema]
            );
            if (temaQuery.rows.length > 0) {
                const tema = temaQuery.rows[0];
                if (tema.autor_id !== parseInt(id_usuario)) {
                    await notificacionModel.crearNotificacion(
                        tema.autor_id,
                        'Nueva Respuesta en Foro',
                        `${tema.responder_nombre} ${tema.responder_apellido} ha respondido a tu tema "${tema.titulo_tema}" en el curso ${tema.curso_nombre}.`,
                        'foro.html'
                    );
                }
            }
        } catch (notifErr) {
            console.error('Error al enviar notificación de foro:', notifErr.message);
        }
        
        res.status(201).json({
            mensaje: 'Respuesta publicada exitosamente',
            respuesta: nuevaRespuesta
        });
    } catch (error) {
        console.error('Error al responder:', error);
        res.status(500).json({ mensaje: 'Error al publicar la respuesta', error: error.message });
    }
};

// =============================================
// 6. Buscar temas dentro de un foro
// =============================================
const buscarEnForo = async (req, res) => {
    const { idForo } = req.params;
    const { q } = req.query; // ?q=palabra

    if (!q) {
        return res.status(400).json({ mensaje: 'Falta el parámetro de búsqueda (?q=...)' });
    }

    try {
        const resultados = await foroModel.buscarTemas(idForo, q);
        res.status(200).json(resultados);
    } catch (error) {
        console.error('Error al buscar:', error);
        res.status(500).json({ mensaje: 'Error al buscar en el foro', error: error.message });
    }
};

// =============================================
// 7. Obtener avisos de una clase (solo temas con ES_AVISO = TRUE)
// =============================================
const obtenerAvisosClase = async (req, res) => {
    const { idClase } = req.params;

    try {
        const avisos = await foroModel.obtenerAvisosDeClase(idClase);
        res.status(200).json(avisos);
    } catch (error) {
        console.error('Error al obtener avisos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

// =============================================
// 8. Publicar un aviso (solo docentes/admins)
// =============================================
const publicarAvisoClase = async (req, res) => {
    const { idForo } = req.params;
    const { id_usuario, titulo_tema, mensaje_inicial, es_docente } = req.body;

    // Validación de seguridad básica en backend
    if (!es_docente) {
        return res.status(403).json({ mensaje: 'Acceso denegado: Solo los docentes pueden publicar avisos.' });
    }

    if (!id_usuario || !titulo_tema || !mensaje_inicial) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    try {
        // Pasamos esAviso = true al modelo
        const nuevoAviso = await foroModel.crearTema(idForo, id_usuario, titulo_tema, mensaje_inicial, true);
        res.status(201).json({
            mensaje: 'Aviso publicado exitosamente',
            aviso: nuevoAviso
        });
    } catch (error) {
        console.error('Error al crear aviso:', error);
        res.status(500).json({ mensaje: 'Error al publicar el aviso', error: error.message });
    }
};

module.exports = {
    obtenerMisForos,
    obtenerTemas,
    obtenerDiscusion,
    publicarTema,
    responderTema,
    buscarEnForo,
    obtenerAvisosClase,
    publicarAvisoClase
};
