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

const migrateAsistencia = async () => {
    try {
        console.log('🔄 Actualizando la tabla ASISTENCIA para la nueva estructura modular...');

        // 1. Añadir columna ID_MODULO
        await pool.query(`ALTER TABLE ASISTENCIA ADD COLUMN IF NOT EXISTS ID_MODULO INT`);
        
        // 2. Transferir la referencia de SESION_CLASE a MODULO_CLASE coincidiendo por título y clase
        const resultUpdate = await pool.query(`
            UPDATE ASISTENCIA A
            SET ID_MODULO = M.ID_MODULO
            FROM SESION_CLASE S
            JOIN MODULO_CLASE M ON M.TITULO = S.TEMA AND M.ID_CLASE = S.ID_CLASE
            WHERE A.ID_SESION = S.ID_SESION AND A.ID_MODULO IS NULL
        `);
        console.log(`✔️ ${resultUpdate.rowCount} registros de asistencia actualizados a las nuevas Semanas.`);

        // 3. Eliminar asistencias que no pudieron vincularse a una semana
        const resultDelete = await pool.query(`DELETE FROM ASISTENCIA WHERE ID_MODULO IS NULL`);
        if (resultDelete.rowCount > 0) {
            console.log(`⚠️ Se eliminaron ${resultDelete.rowCount} registros huérfanos que no coincidían con ninguna Semana.`);
        }

        // 4. Modificar esquema de ASISTENCIA
        await pool.query(`ALTER TABLE ASISTENCIA ALTER COLUMN ID_MODULO SET NOT NULL`);
        await pool.query(`ALTER TABLE ASISTENCIA DROP CONSTRAINT IF EXISTS asistencia_id_sesion_fkey CASCADE`);
        await pool.query(`ALTER TABLE ASISTENCIA DROP COLUMN IF EXISTS ID_SESION CASCADE`);
        
        // Evitar duplicar el constraint si corremos el script varias veces
        await pool.query(`ALTER TABLE ASISTENCIA DROP CONSTRAINT IF EXISTS asistencia_id_modulo_fkey CASCADE`);
        await pool.query(`ALTER TABLE ASISTENCIA ADD CONSTRAINT asistencia_id_modulo_fkey FOREIGN KEY (ID_MODULO) REFERENCES MODULO_CLASE(ID_MODULO) ON DELETE CASCADE`);
        
        console.log('✔️ Tabla ASISTENCIA migrada exitosamente.');

        // 5. Ahora sí podemos limpiar con seguridad la tabla antigua SESION_CLASE
        const delSesiones = await pool.query(`DELETE FROM SESION_CLASE`);
        console.log(`✔️ Se eliminaron ${delSesiones.rowCount} sesiones antiguas (ya fueron migradas).`);

        console.log('\n🎉 ¡La asistencia ahora funciona por Semanas (Módulos)!');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        pool.end();
    }
};

migrateAsistencia();
