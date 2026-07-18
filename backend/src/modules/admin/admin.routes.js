const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');

// Dashboard
router.get('/stats', adminController.getDashboardStats);
router.get('/incidencias', adminController.getIncidencias);

// Usuarios
router.get('/usuarios', adminController.getAllUsers);
router.post('/usuarios', adminController.createUser);
router.put('/usuarios/:id/estado', adminController.toggleUserStatus);
router.delete('/usuarios/:id', adminController.deleteUser);
router.get('/roles', adminController.getRoles);

// Cursos
router.get('/cursos', adminController.getAllCourses);
router.post('/cursos', adminController.createCourse);
router.put('/cursos/:id', adminController.updateCourse);
router.put('/cursos/:id/estado', adminController.changeCourseStatus);
router.post('/clases', adminController.createClass);
router.put('/clases/:id', adminController.updateClass);
router.put('/clases/:id/estado', adminController.changeClassStatus);

// Clases (Para matrículas)
router.get('/clases-disponibles', adminController.getAvailableClasses);
router.get('/clases-disponibles/:id/participantes', adminController.getClassParticipants);
router.put('/clases/:id/docente', adminController.assignClassTeacher);
router.put('/clases/:id/alumnos/:idUsuario/estado', adminController.changeEnrollmentStatus);

// Matriculación
router.post('/matricular', adminController.enrollStudent);

// Reportes
router.get('/reportes/:tipo', adminController.generarReporteCSV);

// Configuración Global
router.get('/config', adminController.getConfig);
router.put('/config', adminController.updateConfig);

module.exports = router;
