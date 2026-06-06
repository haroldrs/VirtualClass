const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

async function updatePasswords() {
    try {
        console.log('Generando hash para la contraseña "hash123"...');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('hash123', salt);
        
        console.log('Actualizando contraseñas en la base de datos...');
        await pool.query('UPDATE USUARIO SET CONTRASENA = $1', [hash]);
        
        console.log('✅ ¡Éxito! Ahora todos los usuarios de prueba tienen la contraseña encriptada correctamente.');
        console.log('Ya puedes iniciar sesión con: cmendoza@edu.com / hash123');
        process.exit(0);
    } catch (error) {
        console.error('Error al actualizar:', error);
        process.exit(1);
    }
}

updatePasswords();
