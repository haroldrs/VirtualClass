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

const migrateData = async () => {
    try {
        console.log('🔄 Buscando datos antiguos para migrarlos a la estructura modular...');

        // 1. Obtener todas las clases que tienen datos antiguos huérfanos
        const clasesQuery = `
            SELECT DISTINCT c.ID_CLASE 
            FROM CLASE c
            WHERE 
                EXISTS (SELECT 1 FROM SESION_CLASE sc WHERE sc.ID_CLASE = c.ID_CLASE) OR
                EXISTS (SELECT 1 FROM RECURSOS r WHERE r.ID_CLASE = c.ID_CLASE AND r.ID_MODULO IS NULL) OR
                EXISTS (SELECT 1 FROM EVALUACION e WHERE e.ID_CLASE = c.ID_CLASE AND e.ID_MODULO IS NULL)
        `;
        
        const { rows: clases } = await pool.query(clasesQuery);

        if (clases.length === 0) {
            console.log('✅ No se encontraron datos antiguos que necesiten ser migrados. ¡Todo está en orden!');
            return;
        }

        console.log(`📌 Se encontraron ${clases.length} clase(s) con datos antiguos. Iniciando migración de datos...\n`);

        for (const clase of clases) {
            const idClase = clase.id_clase;
            console.log(`\n▶️ Procesando Clase ID: ${idClase}`);

            // A. Crear "Unidad 1 - Contenido General" si no existe
            let idUnidad;
            const unidadRes = await pool.query(`SELECT ID_UNIDAD FROM UNIDAD WHERE ID_CLASE = $1 AND NUMERO = 1 LIMIT 1`, [idClase]);
            
            if (unidadRes.rows.length > 0) {
                idUnidad = unidadRes.rows[0].id_unidad;
            } else {
                const nuevaUnidad = await pool.query(`
                    INSERT INTO UNIDAD (ID_CLASE, TITULO, NUMERO) 
                    VALUES ($1, 'Unidad 1 - Contenido General', 1) 
                    RETURNING ID_UNIDAD
                `, [idClase]);
                idUnidad = nuevaUnidad.rows[0].id_unidad;
                console.log(`  ✔️ Unidad 1 creada (ID: ${idUnidad})`);
            }

            // B. Migrar SESION_CLASE -> MODULO_CLASE (Semanas)
            const sesiones = await pool.query(`SELECT * FROM SESION_CLASE WHERE ID_CLASE = $1`, [idClase]);
            
            let primerModuloId = null;

            for (let i = 0; i < sesiones.rows.length; i++) {
                const sesion = sesiones.rows[i];
                
                // Verificar si ya fue migrada buscando por título exacto en esta unidad
                const modRes = await pool.query(`SELECT ID_MODULO FROM MODULO_CLASE WHERE ID_UNIDAD = $1 AND TITULO = $2 LIMIT 1`, [idUnidad, sesion.tema]);
                
                let idModuloNuevo;
                if (modRes.rows.length === 0) {
                    const nuevoMod = await pool.query(`
                        INSERT INTO MODULO_CLASE (ID_CLASE, ID_UNIDAD, TITULO, DESCRIPCION, ORDEN)
                        VALUES ($1, $2, $3, $4, $5) RETURNING ID_MODULO
                    `, [idClase, idUnidad, sesion.tema, sesion.descripcion, i + 1]);
                    idModuloNuevo = nuevoMod.rows[0].id_modulo;
                    console.log(`  ✔️ Sesión antigua "${sesion.tema}" migrada a Semana (ID: ${idModuloNuevo})`);
                } else {
                    idModuloNuevo = modRes.rows[0].id_modulo;
                }

                if (i === 0) primerModuloId = idModuloNuevo;

                // NOTA: Ya no borramos la sesión antigua (SESION_CLASE) para no romper el historial de asistencias (ASISTENCIA)
                // Esto soluciona el error de "violates foreign key constraint".
            }

            // Si no había sesiones, creamos una semana por defecto para meter los recursos huérfanos
            if (!primerModuloId) {
                const modRes = await pool.query(`SELECT ID_MODULO FROM MODULO_CLASE WHERE ID_UNIDAD = $1 ORDER BY ORDEN ASC LIMIT 1`, [idUnidad]);
                if (modRes.rows.length > 0) {
                    primerModuloId = modRes.rows[0].id_modulo;
                } else {
                    const nuevoMod = await pool.query(`
                        INSERT INTO MODULO_CLASE (ID_CLASE, ID_UNIDAD, TITULO, DESCRIPCION, ORDEN)
                        VALUES ($1, $2, 'Semana de Recuperación', 'Recursos y actividades previas', 1) RETURNING ID_MODULO
                    `, [idClase, idUnidad]);
                    primerModuloId = nuevoMod.rows[0].id_modulo;
                    console.log(`  ✔️ Semana por defecto creada (ID: ${primerModuloId})`);
                }
            }

            // C. Asignar RECURSOS huérfanos a esa primera semana
            const recUpdate = await pool.query(`UPDATE RECURSOS SET ID_MODULO = $1 WHERE ID_CLASE = $2 AND ID_MODULO IS NULL`, [primerModuloId, idClase]);
            if (recUpdate.rowCount > 0) {
                console.log(`  ✔️ ${recUpdate.rowCount} Recurso(s) antiguo(s) asignados a la Semana ID: ${primerModuloId}`);
            }

            // D. Asignar EVALUACIONES huérfanas a esa primera semana
            const evalUpdate = await pool.query(`UPDATE EVALUACION SET ID_MODULO = $1 WHERE ID_CLASE = $2 AND ID_MODULO IS NULL`, [primerModuloId, idClase]);
            if (evalUpdate.rowCount > 0) {
                console.log(`  ✔️ ${evalUpdate.rowCount} Evaluación(es) antigua(s) asignadas a la Semana ID: ${primerModuloId}`);
            }
        }

        console.log('\n🎉 ¡Todos los datos antiguos fueron organizados en la nueva estructura exitosamente!');

    } catch (error) {
        console.error('❌ Error durante la migración de datos:', error);
    } finally {
        pool.end();
    }
};

migrateData();
