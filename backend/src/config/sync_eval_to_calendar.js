const pool = require('./db');

async function sync() {
    try {
        const res = await pool.query('SELECT * FROM EVALUACION');
        for (const eva of res.rows) {
            const exists = await pool.query('SELECT ID_EVENTO FROM CALENDARIO_ACADEMICO WHERE ID_EVALUACION = $1', [eva.id_evaluacion]);
            if (exists.rows.length === 0) {
                await pool.query(`
                    INSERT INTO CALENDARIO_ACADEMICO (ID_CLASE, TITULO_EVENTO, DESCRIPCION, FECHA_INICIO, FECHA_FIN, TIPO_EVENTO, ID_EVALUACION)
                    VALUES ($1, $2, $3, $4, $4, 'entrega', $5)
                `, [eva.id_clase, eva.nombre_eva, `Evaluación con peso de ${eva.porcentaje}%`, eva.fecha_evaluacion, eva.id_evaluacion]);
            }
        }
        console.log("Sincronización completa");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
sync();
