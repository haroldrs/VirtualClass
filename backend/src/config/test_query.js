const pool = require('./db');

async function ejecutar() {
    try {
        const query = `
            SELECT CA.*, CD.ID_USUARIO AS docente_asignado
            FROM CALENDARIO_ACADEMICO CA
            LEFT JOIN CLASE_DOCENTE CD ON CD.ID_CLASE = CA.ID_CLASE
            WHERE CA.ID_EVALUACION IS NOT NULL
            ORDER BY CA.ID_EVENTO DESC LIMIT 5;
        `;
        const { rows } = await pool.query(query);
        console.table(rows); // Mostrará una tabla bonita en la terminal
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}
ejecutar();
