const { Pool } = require('pg');
require('dotenv').config({ path: './.env' }); // Usa el .env de Render si lo editaste

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false } // Para Render
});

const runMigration = async () => {
    try {
        console.log('🔄 Iniciando migración de Módulos (Semanas)...');

        // 1. Crear tabla MODULO_CLASE
        console.log('Creando tabla MODULO_CLASE...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS MODULO_CLASE (
                ID_MODULO SERIAL PRIMARY KEY,
                ID_CLASE INT NOT NULL,
                TITULO VARCHAR(100) NOT NULL,
                DESCRIPCION TEXT,
                ORDEN INT DEFAULT 0,
                FOREIGN KEY (ID_CLASE) REFERENCES CLASE(ID_CLASE)
            );
        `);
        console.log('✅ Tabla MODULO_CLASE creada o ya existente.');

        // 2. Modificar RECURSOS
        console.log('Agregando ID_MODULO a la tabla RECURSOS...');
        try {
            await pool.query(`ALTER TABLE RECURSOS ADD COLUMN ID_MODULO INT;`);
            await pool.query(`ALTER TABLE RECURSOS ADD CONSTRAINT fk_recurso_modulo FOREIGN KEY (ID_MODULO) REFERENCES MODULO_CLASE(ID_MODULO);`);
            console.log('✅ Columna ID_MODULO agregada a RECURSOS.');
        } catch (e) {
            if(e.code === '42701') console.log('⚠️ La columna ID_MODULO ya existe en RECURSOS.');
            else throw e;
        }

        // 3. Modificar EVALUACION
        console.log('Agregando ID_MODULO a la tabla EVALUACION...');
        try {
            await pool.query(`ALTER TABLE EVALUACION ADD COLUMN ID_MODULO INT;`);
            await pool.query(`ALTER TABLE EVALUACION ADD CONSTRAINT fk_evaluacion_modulo FOREIGN KEY (ID_MODULO) REFERENCES MODULO_CLASE(ID_MODULO);`);
            console.log('✅ Columna ID_MODULO agregada a EVALUACION.');
        } catch (e) {
            if(e.code === '42701') console.log('⚠️ La columna ID_MODULO ya existe en EVALUACION.');
            else throw e;
        }

        // 4. Modificar SESION_CLASE (Opcional, si queremos agrupar las sesiones por semana también)
        console.log('Agregando ID_MODULO a la tabla SESION_CLASE...');
        try {
            await pool.query(`ALTER TABLE SESION_CLASE ADD COLUMN ID_MODULO INT;`);
            await pool.query(`ALTER TABLE SESION_CLASE ADD CONSTRAINT fk_sesion_modulo FOREIGN KEY (ID_MODULO) REFERENCES MODULO_CLASE(ID_MODULO);`);
            console.log('✅ Columna ID_MODULO agregada a SESION_CLASE.');
        } catch (e) {
            if(e.code === '42701') console.log('⚠️ La columna ID_MODULO ya existe en SESION_CLASE.');
            else throw e;
        }

        console.log('🎉 Migración completada exitosamente. Tu base de datos ahora soporta estructuración modular.');
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        pool.end();
    }
};

runMigration();
