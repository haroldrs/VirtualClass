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

// Probamos la conexión inmediatamente e inyectamos columnas faltantes si es necesario
pool.connect()
    .then(async (client) => {
        console.log('✅ Conexión a la base de datos PostgreSQL exitosa');
        // Script de auto-migración para arreglar la base de datos de producción (Render)
        try {
            await client.query('ALTER TABLE CLASE ADD COLUMN IF NOT EXISTS ENLACE_VIDEO VARCHAR(255);');
            await client.query('ALTER TABLE CLASE ADD COLUMN IF NOT EXISTS ENLACE_WHATSAPP VARCHAR(255);');
            console.log('🔄 Migración automática: Columnas de enlaces verificadas/agregadas con éxito.');
        } catch (migErr) {
            console.error('⚠️ Advertencia: Error en auto-migración de columnas:', migErr.message);
        } finally {
            client.release();
        }
    })
    .catch((err) => console.error('❌ Error conectando a la base de datos:', err.stack));

// Exportamos la conexión para que los Modelos puedan usarla después
module.exports = pool;