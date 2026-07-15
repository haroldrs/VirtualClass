const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const { createFolderInDrive } = require('./src/utils/drive');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

const syncClassesToDrive = async () => {
    try {
        console.log('🔄 Buscando clases existentes sin carpeta en Drive...');
        
        // Obtener clases que no tienen carpeta de Drive
        const query = `
            SELECT CL.ID_CLASE, CL.SECCION, CL.PERIODO, C.NOMBRE AS NOMBRE_CURSO 
            FROM CLASE CL
            JOIN CURSO C ON CL.ID_CURSO = C.ID_CURSO
            WHERE CL.DRIVE_FOLDER_ID IS NULL OR CL.DRIVE_FOLDER_ID = ''
        `;
        const result = await pool.query(query);
        const clases = result.rows;

        if (clases.length === 0) {
            console.log('✔️ Todas las clases ya tienen su carpeta en Google Drive.');
            return;
        }

        console.log(`⚠️ Se encontraron ${clases.length} clases sin carpeta. Creando...`);
        const parentFolder = process.env.GOOGLE_DRIVE_FOLDER_ID;

        let exitosas = 0;

        for (const clase of clases) {
            try {
                const folderName = `${clase.nombre_curso} - Sec ${clase.seccion} (${clase.periodo})`;
                console.log(`📁 Creando carpeta: "${folderName}"...`);
                
                const driveResponse = await createFolderInDrive(folderName, parentFolder);
                
                if (driveResponse && driveResponse.id) {
                    await pool.query(
                        'UPDATE CLASE SET DRIVE_FOLDER_ID = $1 WHERE ID_CLASE = $2',
                        [driveResponse.id, clase.id_clase]
                    );
                    console.log(`   ✅ Éxito! ID: ${driveResponse.id}`);
                    exitosas++;
                }
            } catch (err) {
                console.error(`   ❌ Error al crear la carpeta para la clase ID ${clase.id_clase}:`, err.message);
            }
        }

        console.log(`\n🎉 Sincronización completada. ${exitosas} carpetas creadas exitosamente.`);

    } catch (error) {
        console.error('❌ Error durante la sincronización:', error);
    } finally {
        pool.end();
    }
};

syncClassesToDrive();
