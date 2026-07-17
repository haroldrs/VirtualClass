const pool = require('./db');

async function test() {
    try {
        const calQuery = `
            INSERT INTO CALENDARIO_ACADEMICO (ID_CLASE, TITULO_EVENTO, DESCRIPCION, FECHA_INICIO, FECHA_FIN, TIPO_EVENTO, ID_EVALUACION)
            VALUES ($1, $2, $3, $4, $4, 'entrega', $5)
            RETURNING *;
        `;
        const res = await pool.query(calQuery, [1, "Evaluación: Examen Final", "Evaluación con peso de 10%", '2026-07-20', 21]);
        console.log('Insert exitoso:', res.rows[0]);
    } catch (e) {
        console.error('Error al insertar:', e);
    } finally {
        process.exit(0);
    }
}
test();
