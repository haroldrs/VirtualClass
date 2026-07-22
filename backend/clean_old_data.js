const pool = require('./src/config/db');
require('dotenv').config();

/**
 * Script para eliminar datos anteriores a una fecha especificada (por defecto 1 de Junio de 2026).
 * Uso: node clean_old_data.js [YYYY-MM-DD]
 * Ejemplo: node clean_old_data.js 2026-06-01
 */

const targetDateStr = process.argv[2] || '2026-06-01';

async function cleanOldData() {
    const client = await pool.connect();

    try {
        console.log(`\n==================================================`);
        console.log(`🧹 INICIANDO LIMPIEZA DE DATOS ANTERIORES A: ${targetDateStr}`);
        console.log(`==================================================\n`);

        await client.query('BEGIN');

        // 1. Asistencia (por fecha de asistencia o por sesión de clase previa a la fecha)
        const resAsistencia = await client.query(
            `DELETE FROM ASISTENCIA 
             WHERE FECHA < $1 
                OR ID_SESION IN (SELECT ID_SESION FROM SESION_CLASE WHERE FECHA < $1)`,
            [targetDateStr]
        );
        console.log(`[✓] Registro de Asistencias eliminados: ${resAsistencia.rowCount}`);

        // 2. Sesiones de clase
        const resSesiones = await client.query(
            `DELETE FROM SESION_CLASE WHERE FECHA < $1`,
            [targetDateStr]
        );
        console.log(`[✓] Sesiones de clase eliminadas: ${resSesiones.rowCount}`);

        // 3. Notas
        const resNotas = await client.query(
            `DELETE FROM NOTA 
             WHERE FECHA_REGISTRO < $1 
                OR ID_EVALUACION IN (SELECT ID_EVALUACION FROM EVALUACION WHERE FECHA_EVALUACION < $1)`,
            [targetDateStr]
        );
        console.log(`[✓] Notas eliminadas: ${resNotas.rowCount}`);

        // 4. Entregas de evaluaciones
        const resEntregas = await client.query(
            `DELETE FROM ENTREGA_EVALUACION 
             WHERE FECHA_ENTREGA < $1 
                OR ID_EVALUACION IN (SELECT ID_EVALUACION FROM EVALUACION WHERE FECHA_EVALUACION < $1)`,
            [targetDateStr]
        );
        console.log(`[✓] Entregas de evaluaciones eliminadas: ${resEntregas.rowCount}`);

        // 5. Evaluaciones
        const resEvaluaciones = await client.query(
            `DELETE FROM EVALUACION WHERE FECHA_EVALUACION < $1`,
            [targetDateStr]
        );
        console.log(`[✓] Evaluaciones eliminadas: ${resEvaluaciones.rowCount}`);

        // 6. Recursos publicados
        const resRecursos = await client.query(
            `DELETE FROM RECURSOS WHERE FECHA_PUBLICACION < $1`,
            [targetDateStr]
        );
        console.log(`[✓] Recursos eliminados: ${resRecursos.rowCount}`);

        // 7. Eventos del Calendario Académico
        const resCalendario = await client.query(
            `DELETE FROM CALENDARIO_ACADEMICO WHERE FECHA_INICIO < $1`,
            [targetDateStr]
        );
        console.log(`[✓] Eventos de calendario eliminados: ${resCalendario.rowCount}`);

        // 8. Participantes de Asesoría
        const resPartAsesoria = await client.query(
            `DELETE FROM PARTICIPANTE_ASESORIA 
             WHERE ID_ASESORIA IN (SELECT ID_ASESORIA FROM ASESORIA WHERE FECHA_HORA < $1)`,
            [targetDateStr]
        );
        console.log(`[✓] Participantes de asesoría eliminados: ${resPartAsesoria.rowCount}`);

        // 9. Asesorías
        const resAsesorias = await client.query(
            `DELETE FROM ASESORIA WHERE FECHA_HORA < $1`,
            [targetDateStr]
        );
        console.log(`[✓] Asesorías eliminadas: ${resAsesorias.rowCount}`);

        // 10. Respuestas de Foros
        const resRespForo = await client.query(
            `DELETE FROM RESPUESTA_FORO 
             WHERE FECHA_RESPUESTA < $1 
                OR ID_TEMA IN (SELECT ID_TEMA FROM TEMA_FORO WHERE FECHA_CREACION < $1 
                               OR ID_FORO IN (SELECT ID_FORO FROM FORO WHERE FECHA_CREACION < $1))`,
            [targetDateStr]
        );
        console.log(`[✓] Respuestas de foros eliminadas: ${resRespForo.rowCount}`);

        // 11. Temas de Foros
        const resTemaForo = await client.query(
            `DELETE FROM TEMA_FORO 
             WHERE FECHA_CREACION < $1 
                OR ID_FORO IN (SELECT ID_FORO FROM FORO WHERE FECHA_CREACION < $1)`,
            [targetDateStr]
        );
        console.log(`[✓] Temas de foros eliminados: ${resTemaForo.rowCount}`);

        // 12. Foros
        const resForo = await client.query(
            `DELETE FROM FORO WHERE FECHA_CREACION < $1`,
            [targetDateStr]
        );
        console.log(`[✓] Foros eliminados: ${resForo.rowCount}`);

        // 13. Anuncios
        const resAnuncios = await client.query(
            `DELETE FROM ANUNCIO WHERE FECHA_PUBLICACION < $1`,
            [targetDateStr]
        );
        console.log(`[✓] Anuncios eliminados: ${resAnuncios.rowCount}`);

        // 14. Incidencias de Soporte
        const resIncidencias = await client.query(
            `DELETE FROM INCIDENCIA_SOPORTE WHERE FECHA_CREACION < $1`,
            [targetDateStr]
        );
        console.log(`[✓] Incidencias de soporte eliminadas: ${resIncidencias.rowCount}`);

        // 15. Notificaciones
        const resNotif = await client.query(
            `DELETE FROM NOTIFICACION WHERE FECHA_CREACION < $1`,
            [targetDateStr]
        );
        console.log(`[✓] Notificaciones eliminadas: ${resNotif.rowCount}`);

        // 16. Integrantes de Grupos
        const resGrupoEst = await client.query(
            `DELETE FROM GRUPO_ESTUDIANTE 
             WHERE ID_GRUPO IN (SELECT ID_GRUPO FROM GRUPO WHERE FECHA_CREACION < $1)`,
            [targetDateStr]
        );
        console.log(`[✓] Integrantes de grupos eliminados: ${resGrupoEst.rowCount}`);

        // 17. Grupos
        const resGrupos = await client.query(
            `DELETE FROM GRUPO WHERE FECHA_CREACION < $1`,
            [targetDateStr]
        );
        console.log(`[✓] Grupos eliminados: ${resGrupos.rowCount}`);

        await client.query('COMMIT');
        console.log(`\n==================================================`);
        console.log(`✅ LIMPIEZA COMPLETADA CON ÉXITO.`);
        console.log(`==================================================\n`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`\n❌ Error ejecutando la limpieza de datos (Se hizo ROLLBACK):`, error);
    } finally {
        client.release();
        pool.end();
    }
}

cleanOldData();
