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

const migrateDrive = async () => {
    try {
        console.log('🔄 Actualizando las tablas para soportar Google Drive...');

        // Añadir columna DRIVE_FOLDER_ID a la tabla CLASE
        await pool.query(`ALTER TABLE CLASE ADD COLUMN IF NOT EXISTS DRIVE_FOLDER_ID VARCHAR(255)`);
        console.log('✔️ Columna DRIVE_FOLDER_ID añadida a CLASE.');

        // Añadir columnas a RECURSOS para enlazar a Drive
        await pool.query(`ALTER TABLE RECURSOS ADD COLUMN IF NOT EXISTS DRIVE_FILE_ID VARCHAR(255)`);
        await pool.query(`ALTER TABLE RECURSOS ADD COLUMN IF NOT EXISTS DRIVE_URL VARCHAR(255)`);
        console.log('✔️ Columnas DRIVE_FILE_ID y DRIVE_URL añadidas a RECURSOS.');

        // Añadir columnas a ENTREGA_EVALUACION
        await pool.query(`ALTER TABLE ENTREGA_EVALUACION ADD COLUMN IF NOT EXISTS DRIVE_FILE_ID VARCHAR(255)`);
        await pool.query(`ALTER TABLE ENTREGA_EVALUACION ADD COLUMN IF NOT EXISTS DRIVE_URL VARCHAR(255)`);
        console.log('✔️ Columnas DRIVE_FILE_ID y DRIVE_URL añadidas a ENTREGA_EVALUACION.');

        console.log('\n🎉 ¡Base de datos lista para almacenar identificadores de Google Drive!');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        pool.end();
    }
};

migrateDrive();
