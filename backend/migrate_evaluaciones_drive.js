const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

const migrateEvaluacionesDrive = async () => {
    try {
        console.log('🔄 Actualizando la tabla EVALUACION para soportar adjuntos de Google Drive...');

        await pool.query(`ALTER TABLE EVALUACION ADD COLUMN IF NOT EXISTS ARCHIVO_URL VARCHAR(255)`);
        await pool.query(`ALTER TABLE EVALUACION ADD COLUMN IF NOT EXISTS DRIVE_FILE_ID VARCHAR(255)`);
        await pool.query(`ALTER TABLE EVALUACION ADD COLUMN IF NOT EXISTS DRIVE_URL VARCHAR(255)`);

        console.log('✔️ Columnas ARCHIVO_URL, DRIVE_FILE_ID y DRIVE_URL añadidas a EVALUACION.');
        console.log('\n🎉 ¡Migración completada!');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        pool.end();
    }
};

migrateEvaluacionesDrive();
