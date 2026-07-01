const asesoriaModel = require('./asesoria.model');

// Obtener asesorías según rol
const obtenerAsesorias = async (req, res) => {
    const { idUsuario, rol } = req.params;
    try {
        let asesorias;
        if (rol.toLowerCase().includes('docente')) {
            asesorias = await asesoriaModel.obtenerAsesoriasDocente(idUsuario);
        } else {
            asesorias = await asesoriaModel.obtenerAsesoriasAlumno(idUsuario);
        }
        res.status(200).json(asesorias);
    } catch (error) {
        console.error('Error al obtener asesorías:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

// Obtener detalle + participantes
const obtenerDetalle = async (req, res) => {
    const { idAsesoria } = req.params;
    try {
        const asesoria = await asesoriaModel.obtenerDetalle(idAsesoria);
        if (!asesoria) return res.status(404).json({ mensaje: 'Asesoría no encontrada' });

        const participantes = await asesoriaModel.obtenerParticipantes(idAsesoria);
        res.status(200).json({ ...asesoria, participantes });
    } catch (error) {
        console.error('Error al obtener detalle:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

// Obtener docentes del alumno (para el selector)
const obtenerDocentes = async (req, res) => {
    const { idAlumno } = req.params;
    try {
        const docentes = await asesoriaModel.obtenerDocentesDelAlumno(idAlumno);
        res.status(200).json(docentes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener docentes', error: error.message });
    }
};

// Crear nueva asesoría (alumno solicita)
const crearAsesoria = async (req, res) => {
    const { id_docente, id_solicitante, id_grupo, motivo, descripcion, fecha_hora, enlace_reunion } = req.body;

    if (!id_docente || !id_solicitante || !motivo || !fecha_hora) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios: id_docente, id_solicitante, motivo, fecha_hora' });
    }

    try {
        const asesoria = await asesoriaModel.crearAsesoria(
            id_docente, id_solicitante, id_grupo, motivo, descripcion, fecha_hora, enlace_reunion
        );

        // El solicitante se agrega automáticamente como participante
        await asesoriaModel.unirseAsesoria(asesoria.id_asesoria, id_solicitante);

        res.status(201).json({ mensaje: 'Asesoría solicitada exitosamente', asesoria });
    } catch (error) {
        console.error('Error al crear asesoría:', error);
        res.status(500).json({ mensaje: 'Error al crear la asesoría', error: error.message });
    }
};

// Actualizar estado (docente confirma/rechaza)
const actualizarEstado = async (req, res) => {
    const { idAsesoria } = req.params;
    const { estado, enlace_reunion } = req.body;

    if (!estado || !['confirmada', 'rechazada', 'pendiente'].includes(estado)) {
        return res.status(400).json({ mensaje: 'Estado inválido. Debe ser: confirmada, rechazada o pendiente' });
    }

    try {
        const asesoria = await asesoriaModel.actualizarEstado(idAsesoria, estado, enlace_reunion);
        if (!asesoria) return res.status(404).json({ mensaje: 'Asesoría no encontrada' });

        res.status(200).json({ mensaje: `Asesoría ${estado}`, asesoria });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ mensaje: 'Error al actualizar', error: error.message });
    }
};

// Unirse como participante
const unirseAsesoria = async (req, res) => {
    const { idAsesoria } = req.params;
    const { id_usuario } = req.body;
    try {
        await asesoriaModel.unirseAsesoria(idAsesoria, id_usuario);
        res.status(201).json({ mensaje: 'Te has unido a la asesoría' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ mensaje: 'Ya estás registrado en esta asesoría' });
        }
        res.status(500).json({ mensaje: 'Error al unirse', error: error.message });
    }
};

// Salir de una asesoría
const salirDeAsesoria = async (req, res) => {
    const { idAsesoria, idUsuario } = req.params;
    try {
        await asesoriaModel.salirDeAsesoria(idAsesoria, idUsuario);
        res.status(200).json({ mensaje: 'Has salido de la asesoría' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al salir', error: error.message });
    }
};

// Eliminar asesoría
const eliminarAsesoria = async (req, res) => {
    const { idAsesoria } = req.params;
    try {
        await asesoriaModel.eliminarAsesoria(idAsesoria);
        res.status(200).json({ mensaje: 'Asesoría eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar', error: error.message });
    }
};

module.exports = {
    obtenerAsesorias,
    obtenerDetalle,
    obtenerDocentes,
    crearAsesoria,
    actualizarEstado,
    unirseAsesoria,
    salirDeAsesoria,
    eliminarAsesoria
};
