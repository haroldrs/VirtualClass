const adminModel = require('./admin.model');

const getDashboardStats = async (req, res) => {
    try {
        const stats = await adminModel.getDashboardStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener estadísticas', error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await adminModel.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
    }
};

const getRoles = async (req, res) => {
    try {
        const roles = await adminModel.getRoles();
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener roles', error: error.message });
    }
};

const createUser = async (req, res) => {
    const { nombres, apellidos, correo, contrasena, idRol } = req.body;
    try {
        const newUser = await adminModel.createUser(nombres, apellidos, correo, contrasena, idRol);
        res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: newUser });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear usuario', error: error.message });
    }
};

const toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        const updatedUser = await adminModel.toggleUserStatus(id, estado);
        res.status(200).json({ mensaje: 'Estado de usuario actualizado', usuario: updatedUser });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar estado', error: error.message });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await adminModel.deleteUser(id);
        res.status(200).json({ mensaje: 'Usuario desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar usuario', error: error.message });
    }
};

const getAllCourses = async (req, res) => {
    try {
        const courses = await adminModel.getAllCourses();
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener cursos', error: error.message });
    }
};

const createCourse = async (req, res) => {
    const { codigo, nombre, descripcion, creditos } = req.body;
    try {
        const newCourse = await adminModel.createCourse(codigo, nombre, descripcion, creditos);
        res.status(201).json({ mensaje: 'Curso creado exitosamente', curso: newCourse });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear curso', error: error.message });
    }
};

const getAvailableClasses = async (req, res) => {
    try {
        const classes = await adminModel.getAvailableClasses();
        res.status(200).json(classes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener clases', error: error.message });
    }
};

const enrollStudent = async (req, res) => {
    const { idUsuario, idClase } = req.body;
    try {
        const matricula = await adminModel.enrollStudent(idUsuario, idClase);
        res.status(201).json({ mensaje: 'Matrícula exitosa', matricula });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en la matrícula/asignación', error: error.message });
    }
};

const getClassParticipants = async (req, res) => {
    const { id } = req.params;
    try {
        const participants = await adminModel.getClassParticipants(id);
        res.status(200).json(participants);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener participantes', error: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    getRoles,
    createUser,
    toggleUserStatus,
    deleteUser,
    getAllCourses,
    createCourse,
    getAvailableClasses,
    enrollStudent,
    getClassParticipants
};
