const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Al importar nuestro archivo db.js, Node.js intentará conectarse a la base de datos automáticamente
const db = require('./config/db');

// --- CAMBIO AQUÍ: Importa las rutas de usuario ---
const usuarioRoutes = require('./modules/usuarios/usuario.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Una ruta de prueba para ver si el servidor responde
app.get('/', (req, res) => {
    res.send('¡Servidor Backend de VirtuClass funcionando correctamente!');
});

// --- CAMBIO AQUÍ: Usa las rutas importadas ---
// Esto significa que todas las rutas que definas en 'usuario.routes.js'
// empezarán con '/api/usuarios' (ej: /api/usuarios/registro)
app.use('/api/usuarios', usuarioRoutes);

// Arrancamos el motor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});