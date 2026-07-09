const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

const runMigration = async () => {
    try {
        console.log('🔄 Iniciando migración de estructura modular (Unidades + Semanas)...\n');

        // 1. Crear tabla UNIDAD
        console.log('1️⃣  Creando tabla UNIDAD...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS UNIDAD (
                ID_UNIDAD SERIAL PRIMARY KEY,
                ID_CLASE INT NOT NULL,
                TITULO VARCHAR(100) NOT NULL,
                NUMERO INT DEFAULT 1,
                FOREIGN KEY (ID_CLASE) REFERENCES CLASE(ID_CLASE)
            );
        `);
        console.log('   ✅ Tabla UNIDAD lista.\n');

        // 2. Crear tabla MODULO_CLASE (Semanas)
        console.log('2️⃣  Creando tabla MODULO_CLASE (Semanas)...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS MODULO_CLASE (
                ID_MODULO SERIAL PRIMARY KEY,
                ID_CLASE INT NOT NULL,
                ID_UNIDAD INT,
                TITULO VARCHAR(100) NOT NULL,
                DESCRIPCION TEXT,
                ORDEN INT DEFAULT 0,
                FOREIGN KEY (ID_CLASE) REFERENCES CLASE(ID_CLASE),
                FOREIGN KEY (ID_UNIDAD) REFERENCES UNIDAD(ID_UNIDAD)
            );
        `);
        // Si ya existía sin ID_UNIDAD, agregarla
        try {
            await pool.query(`ALTER TABLE MODULO_CLASE ADD COLUMN ID_UNIDAD INT;`);
            await pool.query(`ALTER TABLE MODULO_CLASE ADD CONSTRAINT fk_modulo_unidad FOREIGN KEY (ID_UNIDAD) REFERENCES UNIDAD(ID_UNIDAD);`);
            console.log('   ✅ Columna ID_UNIDAD añadida a MODULO_CLASE.\n');
        } catch (e) {
            if (e.code === '42701') console.log('   ⚠️  ID_UNIDAD ya existe en MODULO_CLASE.\n');
            else throw e;
        }

        // 3. Agregar ID_MODULO a RECURSOS
        console.log('3️⃣  Vinculando RECURSOS con MODULO_CLASE...');
        try {
            await pool.query(`ALTER TABLE RECURSOS ADD COLUMN ID_MODULO INT;`);
            await pool.query(`ALTER TABLE RECURSOS ADD CONSTRAINT fk_recurso_modulo FOREIGN KEY (ID_MODULO) REFERENCES MODULO_CLASE(ID_MODULO);`);
            console.log('   ✅ Columna ID_MODULO añadida a RECURSOS.\n');
        } catch (e) {
            if (e.code === '42701') console.log('   ⚠️  ID_MODULO ya existe en RECURSOS.\n');
            else throw e;
        }

        // 4. Agregar ID_MODULO a EVALUACION
        console.log('4️⃣  Vinculando EVALUACION con MODULO_CLASE...');
        try {
            await pool.query(`ALTER TABLE EVALUACION ADD COLUMN ID_MODULO INT;`);
            await pool.query(`ALTER TABLE EVALUACION ADD CONSTRAINT fk_evaluacion_modulo FOREIGN KEY (ID_MODULO) REFERENCES MODULO_CLASE(ID_MODULO);`);
            console.log('   ✅ Columna ID_MODULO añadida a EVALUACION.\n');
        } catch (e) {
            if (e.code === '42701') console.log('   ⚠️  ID_MODULO ya existe en EVALUACION.\n');
            else throw e;
        }

        // 5. Agregar ID_MODULO a SESION_CLASE
        console.log('5️⃣  Vinculando SESION_CLASE con MODULO_CLASE...');
        try {
            await pool.query(`ALTER TABLE SESION_CLASE ADD COLUMN ID_MODULO INT;`);
            await pool.query(`ALTER TABLE SESION_CLASE ADD CONSTRAINT fk_sesion_modulo FOREIGN KEY (ID_MODULO) REFERENCES MODULO_CLASE(ID_MODULO);`);
            console.log('   ✅ Columna ID_MODULO añadida a SESION_CLASE.\n');
        } catch (e) {
            if (e.code === '42701') console.log('   ⚠️  ID_MODULO ya existe en SESION_CLASE.\n');
            else throw e;
        }

        console.log('🎉 ¡Migración completada exitosamente!');
        console.log('   Tu base de datos ahora soporta: UNIDAD → SEMANA → RECURSOS/ACTIVIDADES');
        console.log('   Recuerda cambiar tu .env de vuelta a localhost cuando termines.\n');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        pool.end();
    }
};

runMigration();
