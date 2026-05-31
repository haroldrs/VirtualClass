const { Pool } = require('pg');
require('dotenv').config(); // Carga las variables del archivo .env

// Creamos la conexión usando tus credenciales
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Probamos la conexión inmediatamente
pool.connect()
    .then(() => console.log('✅ Conexión a la base de datos PostgreSQL exitosa'))
    .catch((err) => console.error('❌ Error conectando a la base de datos:', err.stack));

// Exportamos la conexión para que los Modelos puedan usarla después
module.exports = pool;