const notificacionModel = require('./notificacion.model');

const obtenerMisNotificaciones = async (req, res) => {
    try {
        const idUsuario = req.params.idUsuario;
        const notificaciones = await notificacionModel.obtenerNotificacionesPorUsuario(idUsuario);
        const unread = await notificacionModel.obtenerNoLeidas(idUsuario);
        
        res.status(200).json({ notificaciones, unread });
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const marcarTodasComoLeidas = async (req, res) => {
    try {
        const idUsuario = req.params.idUsuario;
        await notificacionModel.marcarComoLeidas(idUsuario);
        res.status(200).json({ message: 'Notificaciones leídas' });
    } catch (error) {
        console.error('Error al marcar leídas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const marcarUnaComoLeida = async (req, res) => {
    try {
        const idNotificacion = req.params.idNotificacion;
        await notificacionModel.marcarUnaComoLeida(idNotificacion);
        res.status(200).json({ message: 'Notificación leída' });
    } catch (error) {
        console.error('Error al marcar leída:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    obtenerMisNotificaciones,
    marcarTodasComoLeidas,
    marcarUnaComoLeida
};
