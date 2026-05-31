const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Al importar nuestro archivo db.js, Node.js intentará conectarse a la base de datos automáticamente
const db = require('./config/db'); 

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos (Para que tu servidor entienda datos en formato JSON)
app.use(cors());
app.use(express.json());

// Una ruta de prueba para ver si el servidor responde
app.get('/', (req, res) => {
    res.send('¡Servidor Backend de VirtuClass funcionando correctamente!');
});

// Arrancamos el motor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});