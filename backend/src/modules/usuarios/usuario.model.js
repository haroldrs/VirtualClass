const pool = require('../../config/db');

const crearUsuario = async (nombres, apellidos, correo, contrasena) => {
    const query = `
        INSERT INTO USUARIO (nombres, apellidos, correo, contrasena)
        VALUES ($1, $2, $3, $4)
        RETURNING id_usuario, nombres, apellidos, correo;
    `;
    
    const values = [nombres, apellidos, correo, contrasena];

    try {
        const respuesta = await pool.query(query, values);
        return respuesta.rows[0]; 
    } catch (error) {
        console.error('Error en el modelo de usuario:', error);
        throw error;
    }
};

module.exports = { crearUsuario };

// ================================================================
// 🧪 ZONA DE PRUEBAS
// ================================================================
crearUsuario('Juan', 'Perez', 'juan.prueba2@correo.com', 'clave123')
    .then(nuevoUsuario => {
        console.log('✅ ¡ÉXITO! El modelo funciona a la perfección.');
        console.log('Datos devueltos por la BD:', nuevoUsuario);
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ ERROR en la prueba:', error.message);
        process.exit(1);
    });