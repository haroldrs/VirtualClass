const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Carga las variables del archivo .env

// Creamos la conexión usando tus credenciales
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: (process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1' || !process.env.DB_HOST) ? false : { rejectUnauthorized: false },
});

// Probamos la conexión inmediatamente e inyectamos columnas faltantes si es necesario
pool.connect()
    .then(async (client) => {
        console.log('✅ Conexión a la base de datos PostgreSQL exitosa');
        // Script de auto-migración para arreglar la base de datos de producción (Render)
        try {
            await client.query('ALTER TABLE CLASE ADD COLUMN IF NOT EXISTS ENLACE_VIDEO VARCHAR(255);');
            await client.query('ALTER TABLE CLASE ADD COLUMN IF NOT EXISTS ENLACE_WHATSAPP VARCHAR(255);');
            await client.query('ALTER TABLE TEMA_FORO ADD COLUMN IF NOT EXISTS ES_AVISO BOOLEAN DEFAULT FALSE;');
            await client.query('ALTER TABLE ENTREGA_EVALUACION ADD COLUMN IF NOT EXISTS DRIVE_FILE_ID VARCHAR(255);');
            await client.query('ALTER TABLE ENTREGA_EVALUACION ADD COLUMN IF NOT EXISTS DRIVE_URL VARCHAR(255);');
            await client.query('ALTER TABLE CALENDARIO_ACADEMICO ADD COLUMN IF NOT EXISTS ID_EVALUACION INT REFERENCES EVALUACION(ID_EVALUACION) ON DELETE CASCADE;');
            await client.query("ALTER TABLE CURSO ADD COLUMN IF NOT EXISTS ESTADO VARCHAR(20) DEFAULT 'Activo';");
            await client.query("ALTER TABLE CLASE ADD COLUMN IF NOT EXISTS ESTADO VARCHAR(20) DEFAULT 'Activo';");
            await client.query(`
                CREATE TABLE IF NOT EXISTS ANUNCIO (
                    ID_ANUNCIO SERIAL PRIMARY KEY,
                    TITULO VARCHAR(200) NOT NULL,
                    CONTENIDO TEXT NOT NULL,
                    NIVEL VARCHAR(20) DEFAULT 'info' CHECK (NIVEL IN ('info','advertencia','urgente')),
                    ID_AUTOR INT,
                    FECHA_PUBLICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ACTIVO BOOLEAN DEFAULT TRUE,
                    FOREIGN KEY(ID_AUTOR) REFERENCES USUARIO(ID_USUARIO)
                );
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS CONFIGURACION_GLOBAL (
                    CLAVE VARCHAR(50) PRIMARY KEY,
                    VALOR VARCHAR(255) NOT NULL
                );
            `);
            await client.query(`
                INSERT INTO CONFIGURACION_GLOBAL (CLAVE, VALOR) 
                VALUES 
                ('institucion_nombre', 'VirtuClass Academy'),
                ('periodo_activo', '2026-I'),
                ('mantenimiento', 'false'),
                ('auto_matricula', 'true')
                ON CONFLICT DO NOTHING;
            `);
            console.log('🔄 Migración automática: Columnas de enlaces, tabla ANUNCIO y CONFIGURACION_GLOBAL verificadas.');
        } catch (migErr) {
            console.error('⚠️ Advertencia: Error en auto-migración de columnas:', migErr.message);
        } finally {
            client.release();
        }
    })
    .catch((err) => console.error('❌ Error conectando a la base de datos:', err.stack));

// Exportamos la conexión para que los Modelos puedan usarla después
module.exports = pool;