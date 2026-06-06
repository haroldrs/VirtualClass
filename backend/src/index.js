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

// Arrancamos el motor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});