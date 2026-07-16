const adminModel = require('./admin.model');
const { createFolderInDrive } = require('../../utils/drive');

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

const updateCourse = async (req, res) => {
    const { id } = req.params;
    const { codigo, nombre, descripcion, creditos } = req.body;
    try {
        const updatedCourse = await adminModel.updateCourse(id, codigo, nombre, descripcion, creditos);
        res.status(200).json({ mensaje: 'Curso actualizado', curso: updatedCourse });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar curso', error: error.message });
    }
};

const changeCourseStatus = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        const updated = await adminModel.changeCourseStatus(id, estado);
        res.status(200).json({ mensaje: 'Estado de curso actualizado', curso: updated });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cambiar estado', error: error.message });
    }
};

const createClass = async (req, res) => {
    const { idCurso, nombreClase, periodo, ciclo, seccion, aula } = req.body;
    try {
        let driveFolderId = null;
        let nombreParaCarpeta = nombreClase;

        // Si el frontend envía nombreClase vacío, buscamos el nombre del curso en la BD
        if (!nombreParaCarpeta || nombreParaCarpeta.trim() === '') {
            const pool = require('../../config/db');
            const cursoResult = await pool.query('SELECT NOMBRE FROM CURSO WHERE ID_CURSO = $1', [idCurso]);
            if (cursoResult.rows.length > 0) {
                nombreParaCarpeta = cursoResult.rows[0].nombre;
            } else {
                nombreParaCarpeta = 'Clase Desconocida';
            }
        }

        // Intentar crear la carpeta en Drive, dentro de la carpeta principal configurada
        try {
            const parentFolder = process.env.GOOGLE_DRIVE_FOLDER_ID;
            const folderName = `${nombreParaCarpeta} - Sec ${seccion} (${periodo})`;
            const driveResponse = await createFolderInDrive(folderName, parentFolder);
            driveFolderId = driveResponse.id;
        } catch (driveError) {
            console.error('No se pudo crear la carpeta en Drive. Se creará la clase sin carpeta.', driveError);
            // No detenemos la creación de la clase si falla Drive, solo la dejamos en null
        }

        const newClass = await adminModel.createClass(idCurso, nombreParaCarpeta, periodo, ciclo, seccion, aula, driveFolderId);
        res.status(201).json({ mensaje: 'Clase creada exitosamente', clase: newClass });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear clase', error: error.message });
    }
};

const updateClass = async (req, res) => {
    const { id } = req.params;
    const { nombreClase, periodo, ciclo, seccion, aula } = req.body;
    try {
        const updated = await adminModel.updateClass(id, nombreClase, periodo, ciclo, seccion, aula);
        res.status(200).json({ mensaje: 'Clase actualizada', clase: updated });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar clase', error: error.message });
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
    updateCourse,
    changeCourseStatus,
    createClass,
    updateClass,
    getAvailableClasses,
    enrollStudent,
    getClassParticipants
};
