const pool = require('./db');

async function ejecutar() {
    try {
        const query = `
            SELECT E.ID_EVALUACION, E.NOMBRE_EVA, E.FECHA_EVALUACION, CA.ID_EVENTO
            FROM EVALUACION E
            LEFT JOIN CALENDARIO_ACADEMICO CA ON CA.ID_EVALUACION = E.ID_EVALUACION
            ORDER BY E.ID_EVALUACION DESC
            LIMIT 10;
        `;
        const { rows } = await pool.query(query);
        console.table(rows);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}
ejecutar();
