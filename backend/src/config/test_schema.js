const pool = require('./db');

async function test() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'curso'");
        console.table(res.rows);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}
test();
