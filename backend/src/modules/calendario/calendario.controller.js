const calendarioModel = require('./calendario.model');

// =============================================
// 1. Obtener eventos del mes para el usuario
// =============================================
const obtenerEventos = async (req, res) => {
    const { idUsuario, rol } = req.params;
    const { mes, anio } = req.query;

    if (!mes || !anio) {
        return res.status(400).json({ mensaje: 'Faltan parámetros: mes y anio (?mes=6&anio=2026)' });
    }

    try {
        let eventos = [];
        if (rol.toLowerCase().includes('docente')) {
            eventos = await calendarioModel.obtenerEventosDeDocente(idUsuario, mes, anio);
        } else {
            eventos = await calendarioModel.obtenerEventosDeAlumno(idUsuario, mes, anio);
        }

        res.status(200).json(eventos);
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

// =============================================
// 2. Obtener próximos eventos (panel lateral)
// =============================================
const obtenerProximos = async (req, res) => {
    const { idUsuario, rol } = req.params;

    try {
        let eventos = [];
        if (rol.toLowerCase().includes('docente')) {
            eventos = await calendarioModel.obtenerProximosEventosDocente(idUsuario);
        } else {
            eventos = await calendarioModel.obtenerProximosEventosAlumno(idUsuario);
        }

        res.status(200).json(eventos);
    } catch (error) {
        console.error('Error al obtener próximos eventos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

// =============================================
// 3. Obtener clases del docente (para selector)
// =============================================
const obtenerClases = async (req, res) => {
    const { idUsuario } = req.params;

    try {
        const clases = await calendarioModel.obtenerClasesDelDocente(idUsuario);
        res.status(200).json(clases);
    } catch (error) {
        console.error('Error al obtener clases:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

// =============================================
// 4. Crear evento (solo docentes)
// =============================================
const crearEvento = async (req, res) => {
    const { id_clase, titulo_evento, descripcion, fecha_inicio, fecha_fin, tipo_evento } = req.body;

    if (!id_clase || !titulo_evento || !fecha_inicio || !fecha_fin || !tipo_evento) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    try {
        const evento = await calendarioModel.crearEvento(
            id_clase, titulo_evento, descripcion || '', fecha_inicio, fecha_fin, tipo_evento
        );
        res.status(201).json({ mensaje: 'Evento creado exitosamente', evento });
    } catch (error) {
        console.error('Error al crear evento:', error);
        res.status(500).json({ mensaje: 'Error al crear el evento', error: error.message });
    }
};

// =============================================
// 5. Actualizar evento
// =============================================
const actualizarEvento = async (req, res) => {
    const { idEvento } = req.params;
    const { titulo_evento, descripcion, fecha_inicio, fecha_fin, tipo_evento } = req.body;

    try {
        const evento = await calendarioModel.actualizarEvento(
            idEvento, titulo_evento, descripcion, fecha_inicio, fecha_fin, tipo_evento
        );

        if (!evento) {
            return res.status(404).json({ mensaje: 'Evento no encontrado' });
        }

        res.status(200).json({ mensaje: 'Evento actualizado', evento });
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        res.status(500).json({ mensaje: 'Error al actualizar el evento', error: error.message });
    }
};

// =============================================
// 6. Eliminar evento
// =============================================
const eliminarEvento = async (req, res) => {
    const { idEvento } = req.params;

    try {
        const evento = await calendarioModel.eliminarEvento(idEvento);

        if (!evento) {
            return res.status(404).json({ mensaje: 'Evento no encontrado' });
        }

        res.status(200).json({ mensaje: 'Evento eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        res.status(500).json({ mensaje: 'Error al eliminar el evento', error: error.message });
    }
};

module.exports = {
    obtenerEventos,
    obtenerProximos,
    obtenerClases,
    crearEvento,
    actualizarEvento,
    eliminarEvento
};
