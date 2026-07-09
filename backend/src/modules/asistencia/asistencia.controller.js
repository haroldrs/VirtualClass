const asistenciaModel = require('./asistencia.model');

const listarAlumnos = async (req, res) => {
    try {
        const alumnos = await asistenciaModel.obtenerAlumnosPorClase(req.params.idClase);
        res.json(alumnos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener alumnos' });
    }
};

const listarAsistenciaSesion = async (req, res) => {
    try {
        const asistencia = await asistenciaModel.obtenerAsistenciaPorSesion(req.params.idClase, req.params.idModulo);
        res.json(asistencia);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener asistencia' });
    }
};

const registrarAsistencia = async (req, res) => {
    const { idModulo, idUsuario, estado } = req.body;
    try {
        const asistencia = await asistenciaModel.marcarAsistencia(idModulo, idUsuario, estado);
        res.json(asistencia);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al marcar asistencia' });
    }
};

const porcentajeAlumno = async (req, res) => {
    try {
        const resultado = await asistenciaModel.obtenerPorcentajeAlumno(req.params.idClase, req.params.idUsuario);
        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al calcular porcentaje' });
    }
};

module.exports = {
    listarAlumnos,
    listarAsistenciaSesion,
    registrarAsistencia,
    porcentajeAlumno
};
