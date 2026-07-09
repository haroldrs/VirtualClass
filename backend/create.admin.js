const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    try {
        console.log('Buscando rol Administrador...');
        const rolRes = await pool.query("SELECT id_rol FROM rol WHERE nombre_rol = 'Administrador'");
        
        if (rolRes.rows.length === 0) {
            console.log('No se encontró el rol Administrador. Creándolo...');
            const insertRol = await pool.query("INSERT INTO rol (nombre_rol) VALUES ('Administrador') RETURNING id_rol");
            id_rol = insertRol.rows[0].id_rol;
        } else {
            id_rol = rolRes.rows[0].id_rol;
        }

        const correo = 'admin@virtualclass.com';
        const contrasena = 'admin123';
        const nombres = 'Super';
        const apellidos = 'Administrador';

        console.log('Verificando si el usuario ya existe...');
        const userRes = await pool.query("SELECT id_usuario FROM usuario WHERE correo = $1", [correo]);
        
        let id_usuario;
        if (userRes.rows.length === 0) {
            console.log('Creando usuario administrador...');
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(contrasena, salt);
            
            const insertUser = await pool.query(
                "INSERT INTO usuario (nombres, apellidos, correo, contrasena, estado) VALUES ($1, $2, $3, $4, 'Activo') RETURNING id_usuario",
                [nombres, apellidos, correo, hashed]
            );
            id_usuario = insertUser.rows[0].id_usuario;
            console.log('Usuario insertado con ID:', id_usuario);
        } else {
            id_usuario = userRes.rows[0].id_usuario;
            console.log('El usuario ya existe con ID:', id_usuario);
        }

        console.log('Asignando rol Administrador al usuario...');
        // Verificar si ya tiene el rol
        const userRolRes = await pool.query("SELECT * FROM usuario_rol WHERE id_usuario = $1 AND id_rol = $2", [id_usuario, id_rol]);
        if (userRolRes.rows.length === 0) {
            await pool.query("INSERT INTO usuario_rol (id_usuario, id_rol) VALUES ($1, $2)", [id_usuario, id_rol]);
            console.log('Rol asignado exitosamente.');
        } else {
            console.log('El usuario ya tenía asignado el rol Administrador.');
        }

        console.log('\n--- CREDENCIALES DEL ADMINISTRADOR ---');
        console.log('Correo: admin@virtualclass.com');
        console.log('Contraseña: admin123');
        console.log('----------------------------------------\n');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
};

createAdmin();
