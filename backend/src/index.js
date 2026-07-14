const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Al importar nuestro archivo db.js, Node.js intentará conectarse a la base de datos automáticamente
const db = require('./config/db');

// --- Rutas ---
const usuarioRoutes = require('./modules/usuarios/usuario.routes');
const cursoRoutes = require('./modules/cursos/curso.routes');
const claseRoutes = require('./modules/clase/clase.routes');
const recursosRoutes = require('./modules/recursos/recursos.routes');
const calificacionesRoutes = require('./modules/calificaciones/calificaciones.routes');
const asistenciaRoutes = require('./modules/asistencia/asistencia.routes');
const evaluacionesRoutes = require('./modules/evaluaciones/evaluaciones.routes');
const forosRoutes = require('./modules/foros/foro.routes');
const calendarioRoutes = require('./modules/calendario/calendario.routes');
const gruposRoutes = require('./modules/grupos/grupo.routes');
const asesoriasRoutes = require('./modules/asesorias/asesoria.routes');
const adminRoutes = require('./modules/admin/admin.routes'); // Nueva ruta admin
const modularRoutes = require('./modules/clase/modular.routes'); // Estructura modular
const anuncioRoutes = require('./modules/anuncios/anuncio.routes'); // Anuncios institucionales
const driveRoutes = require('./modules/drive/drive.routes'); // Pruebas de Google Drive

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Una ruta de prueba para ver si el servidor responde
app.get('/', (req, res) => {
    res.send('¡Servidor Backend de VirtuClass funcionando correctamente!');
});

// Rutas base
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/clase', claseRoutes);
app.use('/api/recursos', recursosRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/evaluaciones', evaluacionesRoutes);
app.use('/api/foros', forosRoutes);
app.use('/api/calendario', calendarioRoutes);
app.use('/api/grupos', gruposRoutes);
app.use('/api/asesorias', asesoriasRoutes);
app.use('/api/admin', adminRoutes); // Ruta para el panel de administración
app.use('/api/modular', modularRoutes); // Estructura modular por unidades y semanas
app.use('/api/anuncios', anuncioRoutes); // Anuncios institucionales
app.use('/api/drive', driveRoutes); // Ruta para subir a Google Drive

// Arrancamos el motor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});