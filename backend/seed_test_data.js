const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * ============================================================
 * SEED DATA COMPLETO PARA VIRTUALCLASS
 * ============================================================
 * Genera datos realistas de prueba para TODOS los módulos.
 * 
 * Usuarios creados (contraseña para todos: test123):
 * ─────────────────────────────────────────────────────
 * ADMINISTRADOR:
 *   - admin@virtualclass.com  (Super Administrador)
 * 
 * DOCENTES (4):
 *   - rgarcia@edu.pe           (Roberto García - Docente Principal)
 *   - pnavarro@edu.pe          (Patricia Navarro - Docente Principal)
 *   - jmorales@edu.pe          (Julio Morales - Docente Auxiliar)
 *   - svelasquez@edu.pe        (Sandra Velásquez - Docente Auxiliar)
 * 
 * ALUMNOS REGULARES (8):
 *   - alopez@est.edu.pe        (Alejandro López)
 *   - vherrera@est.edu.pe      (Valentina Herrera)
 *   - dquispe@est.edu.pe       (Daniel Quispe)
 *   - cmontes@est.edu.pe       (Camila Montes)
 *   - fespinoza@est.edu.pe     (Fernando Espinoza)
 *   - lchavez@est.edu.pe       (Lucía Chávez)
 *   - mfigueroa@est.edu.pe     (Martín Figueroa)
 *   - ndelgado@est.edu.pe      (Natalia Delgado)
 * 
 * ALUMNOS BECADOS (4):
 *   - rparedes@est.edu.pe      (Rodrigo Paredes)
 *   - iflores@est.edu.pe       (Isabella Flores)
 *   - gaguirre@est.edu.pe      (Gonzalo Aguirre)
 *   - asoto@est.edu.pe         (Andrea Soto)
 * 
 * ALUMNO INACTIVO (1):
 *   - jreyes@est.edu.pe        (José Reyes - cuenta Inactivo)
 * 
 * ALUMNO SIN MATRÍCULA (1):
 *   - krivera@est.edu.pe       (Kevin Rivera - sin matricular)
 * 
 * Uso: node seed_test_data.js
 * ============================================================
 */

const PASSWORD = 'test123';

async function seed() {
    const client = await pool.connect();
    try {
        console.log('\n╔══════════════════════════════════════════════════╗');
        console.log('║   🌱 SEMBRANDO DATOS DE PRUEBA EN VIRTUALCLASS   ║');
        console.log('╚══════════════════════════════════════════════════╝\n');

        await client.query('BEGIN');

        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(PASSWORD, salt);

        // ============================================================
        // 1. ROLES
        // ============================================================
        console.log('📋 Insertando Roles...');
        await client.query(`
            INSERT INTO ROL (NOMBRE_ROL) VALUES
            ('Docente Principal'),
            ('Docente Auxiliar'),
            ('Alumno Regular'),
            ('Alumno Becado'),
            ('Administrador'),
            ('Coordinador Academico'),
            ('Tutor'),
            ('Soporte TI'),
            ('Director'),
            ('Auditor')
            ON CONFLICT (NOMBRE_ROL) DO NOTHING;
        `);
        // Obtener IDs de roles
        const rolesRes = await client.query(`SELECT ID_ROL, NOMBRE_ROL FROM ROL`);
        const roles = {};
        rolesRes.rows.forEach(r => roles[r.nombre_rol] = r.id_rol);

        // ============================================================
        // 2. USUARIOS
        // ============================================================
        console.log('👥 Insertando Usuarios...');
        const usuarios = [
            // Administrador
            { nombres: 'Super', apellidos: 'Administrador', correo: 'admin@virtualclass.com', telefono: '999000001', estado: 'Activo', rol: 'Administrador' },
            // Docentes
            { nombres: 'Roberto', apellidos: 'García Linares', correo: 'rgarcia@edu.pe', telefono: '999100001', estado: 'Activo', rol: 'Docente Principal' },
            { nombres: 'Patricia', apellidos: 'Navarro Campos', correo: 'pnavarro@edu.pe', telefono: '999100002', estado: 'Activo', rol: 'Docente Principal' },
            { nombres: 'Julio', apellidos: 'Morales Huamán', correo: 'jmorales@edu.pe', telefono: '999100003', estado: 'Activo', rol: 'Docente Auxiliar' },
            { nombres: 'Sandra', apellidos: 'Velásquez Ríos', correo: 'svelasquez@edu.pe', telefono: '999100004', estado: 'Activo', rol: 'Docente Auxiliar' },
            // Alumnos regulares
            { nombres: 'Alejandro', apellidos: 'López Mendoza', correo: 'alopez@est.edu.pe', telefono: '999200001', estado: 'Activo', rol: 'Alumno Regular' },
            { nombres: 'Valentina', apellidos: 'Herrera Castillo', correo: 'vherrera@est.edu.pe', telefono: '999200002', estado: 'Activo', rol: 'Alumno Regular' },
            { nombres: 'Daniel', apellidos: 'Quispe Ramírez', correo: 'dquispe@est.edu.pe', telefono: '999200003', estado: 'Activo', rol: 'Alumno Regular' },
            { nombres: 'Camila', apellidos: 'Montes Vargas', correo: 'cmontes@est.edu.pe', telefono: '999200004', estado: 'Activo', rol: 'Alumno Regular' },
            { nombres: 'Fernando', apellidos: 'Espinoza Torres', correo: 'fespinoza@est.edu.pe', telefono: '999200005', estado: 'Activo', rol: 'Alumno Regular' },
            { nombres: 'Lucía', apellidos: 'Chávez Salinas', correo: 'lchavez@est.edu.pe', telefono: '999200006', estado: 'Activo', rol: 'Alumno Regular' },
            { nombres: 'Martín', apellidos: 'Figueroa Díaz', correo: 'mfigueroa@est.edu.pe', telefono: '999200007', estado: 'Activo', rol: 'Alumno Regular' },
            { nombres: 'Natalia', apellidos: 'Delgado Peña', correo: 'ndelgado@est.edu.pe', telefono: '999200008', estado: 'Activo', rol: 'Alumno Regular' },
            // Alumnos becados
            { nombres: 'Rodrigo', apellidos: 'Paredes León', correo: 'rparedes@est.edu.pe', telefono: '999300001', estado: 'Activo', rol: 'Alumno Becado' },
            { nombres: 'Isabella', apellidos: 'Flores Gutiérrez', correo: 'iflores@est.edu.pe', telefono: '999300002', estado: 'Activo', rol: 'Alumno Becado' },
            { nombres: 'Gonzalo', apellidos: 'Aguirre Rojas', correo: 'gaguirre@est.edu.pe', telefono: '999300003', estado: 'Activo', rol: 'Alumno Becado' },
            { nombres: 'Andrea', apellidos: 'Soto Medina', correo: 'asoto@est.edu.pe', telefono: '999300004', estado: 'Activo', rol: 'Alumno Becado' },
            // Alumno inactivo
            { nombres: 'José', apellidos: 'Reyes Cárdenas', correo: 'jreyes@est.edu.pe', telefono: '999400001', estado: 'Inactivo', rol: 'Alumno Regular' },
            // Alumno sin matrícula
            { nombres: 'Kevin', apellidos: 'Rivera Sánchez', correo: 'krivera@est.edu.pe', telefono: '999400002', estado: 'Activo', rol: 'Alumno Regular' },
        ];

        const userIds = {};
        for (const u of usuarios) {
            const res = await client.query(
                `INSERT INTO USUARIO (NOMBRES, APELLIDOS, CORREO, CONTRASENA, TELEFONO, ESTADO)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (CORREO) DO UPDATE SET NOMBRES = $1 
                 RETURNING ID_USUARIO`,
                [u.nombres, u.apellidos, u.correo, hashedPw, u.telefono, u.estado]
            );
            const id = res.rows[0].id_usuario;
            userIds[u.correo] = id;

            if (u.rol && roles[u.rol]) {
                await client.query(
                    `INSERT INTO USUARIO_ROL (ID_USUARIO, ID_ROL) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [id, roles[u.rol]]
                );
            }
        }
        console.log(`   ✓ ${Object.keys(userIds).length} usuarios creados`);

        // IDs de acceso rápido
        const ADMIN = userIds['admin@virtualclass.com'];
        const DOC_ROBERTO = userIds['rgarcia@edu.pe'];
        const DOC_PATRICIA = userIds['pnavarro@edu.pe'];
        const DOC_JULIO = userIds['jmorales@edu.pe'];
        const DOC_SANDRA = userIds['svelasquez@edu.pe'];
        const ALU_ALEJANDRO = userIds['alopez@est.edu.pe'];
        const ALU_VALENTINA = userIds['vherrera@est.edu.pe'];
        const ALU_DANIEL = userIds['dquispe@est.edu.pe'];
        const ALU_CAMILA = userIds['cmontes@est.edu.pe'];
        const ALU_FERNANDO = userIds['fespinoza@est.edu.pe'];
        const ALU_LUCIA = userIds['lchavez@est.edu.pe'];
        const ALU_MARTIN = userIds['mfigueroa@est.edu.pe'];
        const ALU_NATALIA = userIds['ndelgado@est.edu.pe'];
        const ALU_RODRIGO = userIds['rparedes@est.edu.pe'];
        const ALU_ISABELLA = userIds['iflores@est.edu.pe'];
        const ALU_GONZALO = userIds['gaguirre@est.edu.pe'];
        const ALU_ANDREA = userIds['asoto@est.edu.pe'];

        // ============================================================
        // 3. CURSOS
        // ============================================================
        console.log('📚 Insertando Cursos...');
        const cursosData = [
            { codigo: 'CS201', nombre: 'Programación Orientada a Objetos', descripcion: 'Fundamentos de POO con Java: herencia, polimorfismo, interfaces y patrones de diseño', creditos: 4 },
            { codigo: 'CS202', nombre: 'Bases de Datos Avanzadas', descripcion: 'SQL avanzado, procedimientos almacenados, triggers, optimización de consultas y NoSQL', creditos: 4 },
            { codigo: 'CS203', nombre: 'Desarrollo Web Full Stack', descripcion: 'Frontend con React, Backend con Node.js, APIs REST, despliegue en la nube', creditos: 5 },
            { codigo: 'CS204', nombre: 'Ingeniería de Software II', descripcion: 'Metodologías ágiles avanzadas, DevOps, CI/CD, testing y gestión de proyectos', creditos: 4 },
            { codigo: 'CS205', nombre: 'Inteligencia Artificial', descripcion: 'Machine Learning, redes neuronales, procesamiento de lenguaje natural', creditos: 5 },
            { codigo: 'CS206', nombre: 'Seguridad Informática', descripcion: 'Ciberseguridad, ethical hacking, criptografía moderna, auditorías de seguridad', creditos: 3 },
        ];

        const cursoIds = {};
        for (const c of cursosData) {
            const res = await client.query(
                `INSERT INTO CURSO (CODIGO, NOMBRE, DESCRIPCION, CREDITOS) VALUES ($1, $2, $3, $4)
                 ON CONFLICT (CODIGO) DO UPDATE SET NOMBRE = $2 RETURNING ID_CURSO`,
                [c.codigo, c.nombre, c.descripcion, c.creditos]
            );
            cursoIds[c.codigo] = res.rows[0].id_curso;
        }
        console.log(`   ✓ ${Object.keys(cursoIds).length} cursos creados`);

        // ============================================================
        // 4. CLASES (instancias de cursos para el período 2026-I)
        // ============================================================
        console.log('🏫 Insertando Clases...');
        const clasesData = [
            { cursoCode: 'CS201', nombre: 'POO - Sección A', periodo: '2026-I', ciclo: 'III', seccion: 'A', aula: 'Lab 201', docente: DOC_ROBERTO, fi: '2026-06-01', ff: '2026-10-15' },
            { cursoCode: 'CS201', nombre: 'POO - Sección B', periodo: '2026-I', ciclo: 'III', seccion: 'B', aula: 'Lab 202', docente: DOC_JULIO, fi: '2026-06-01', ff: '2026-10-15' },
            { cursoCode: 'CS202', nombre: 'BD Avanzadas - Sec A', periodo: '2026-I', ciclo: 'IV', seccion: 'A', aula: 'Lab 301', docente: DOC_PATRICIA, fi: '2026-06-01', ff: '2026-10-15' },
            { cursoCode: 'CS203', nombre: 'Full Stack - Sec A', periodo: '2026-I', ciclo: 'V', seccion: 'A', aula: 'Lab 401', docente: DOC_ROBERTO, fi: '2026-06-01', ff: '2026-10-15' },
            { cursoCode: 'CS204', nombre: 'Ing. Software II - Sec A', periodo: '2026-I', ciclo: 'VI', seccion: 'A', aula: 'Aula 501', docente: DOC_PATRICIA, fi: '2026-06-01', ff: '2026-10-15' },
            { cursoCode: 'CS205', nombre: 'IA - Sección A', periodo: '2026-I', ciclo: 'VII', seccion: 'A', aula: 'Lab 502', docente: DOC_SANDRA, fi: '2026-06-01', ff: '2026-10-15' },
            { cursoCode: 'CS206', nombre: 'Seguridad - Sec A', periodo: '2026-I', ciclo: 'VII', seccion: 'A', aula: 'Lab 503', docente: DOC_JULIO, fi: '2026-06-01', ff: '2026-10-15' },
        ];

        const claseIds = {};
        for (let i = 0; i < clasesData.length; i++) {
            const c = clasesData[i];
            const res = await client.query(
                `INSERT INTO CLASE (ID_CURSO, NOMBRE_CLASE, PERIODO, CICLO, SECCION, AULA, FECHA_INICIO, FECHA_FIN, ENLACE_VIDEO, ENLACE_WHATSAPP)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING ID_CLASE`,
                [cursoIds[c.cursoCode], c.nombre, c.periodo, c.ciclo, c.seccion, c.aula, c.fi, c.ff,
                 `https://meet.google.com/abc-${c.seccion.toLowerCase()}-${i+1}`,
                 `https://chat.whatsapp.com/grupo${i+1}`]
            );
            claseIds[`clase_${i+1}`] = res.rows[0].id_clase;

            // Asignar docente
            await client.query(
                `INSERT INTO CLASE_DOCENTE (ID_CLASE, ID_USUARIO) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [res.rows[0].id_clase, c.docente]
            );
        }
        console.log(`   ✓ ${Object.keys(claseIds).length} clases creadas`);

        const CL_POO_A = claseIds['clase_1'];
        const CL_POO_B = claseIds['clase_2'];
        const CL_BD = claseIds['clase_3'];
        const CL_FULLSTACK = claseIds['clase_4'];
        const CL_INGSW = claseIds['clase_5'];
        const CL_IA = claseIds['clase_6'];
        const CL_SEG = claseIds['clase_7'];

        // ============================================================
        // 5. MATRÍCULAS
        // ============================================================
        console.log('📝 Insertando Matrículas...');
        const matriculas = [
            // POO Sec A: 6 alumnos (1 retirado)
            { clase: CL_POO_A, alumno: ALU_ALEJANDRO, estado: 'ACTIVO' },
            { clase: CL_POO_A, alumno: ALU_VALENTINA, estado: 'ACTIVO' },
            { clase: CL_POO_A, alumno: ALU_DANIEL, estado: 'ACTIVO' },
            { clase: CL_POO_A, alumno: ALU_RODRIGO, estado: 'ACTIVO' },
            { clase: CL_POO_A, alumno: ALU_ISABELLA, estado: 'ACTIVO' },
            { clase: CL_POO_A, alumno: ALU_ANDREA, estado: 'RETIRADO' },
            // POO Sec B: 4 alumnos
            { clase: CL_POO_B, alumno: ALU_CAMILA, estado: 'ACTIVO' },
            { clase: CL_POO_B, alumno: ALU_FERNANDO, estado: 'ACTIVO' },
            { clase: CL_POO_B, alumno: ALU_LUCIA, estado: 'ACTIVO' },
            { clase: CL_POO_B, alumno: ALU_GONZALO, estado: 'ACTIVO' },
            // BD Avanzadas: 5 alumnos
            { clase: CL_BD, alumno: ALU_ALEJANDRO, estado: 'ACTIVO' },
            { clase: CL_BD, alumno: ALU_MARTIN, estado: 'ACTIVO' },
            { clase: CL_BD, alumno: ALU_NATALIA, estado: 'ACTIVO' },
            { clase: CL_BD, alumno: ALU_RODRIGO, estado: 'ACTIVO' },
            { clase: CL_BD, alumno: ALU_GONZALO, estado: 'ACTIVO' },
            // Full Stack: 6 alumnos
            { clase: CL_FULLSTACK, alumno: ALU_VALENTINA, estado: 'ACTIVO' },
            { clase: CL_FULLSTACK, alumno: ALU_DANIEL, estado: 'ACTIVO' },
            { clase: CL_FULLSTACK, alumno: ALU_CAMILA, estado: 'ACTIVO' },
            { clase: CL_FULLSTACK, alumno: ALU_FERNANDO, estado: 'ACTIVO' },
            { clase: CL_FULLSTACK, alumno: ALU_ISABELLA, estado: 'ACTIVO' },
            { clase: CL_FULLSTACK, alumno: ALU_ANDREA, estado: 'ACTIVO' },
            // Ing Software II: 4 alumnos (1 finalizado)
            { clase: CL_INGSW, alumno: ALU_LUCIA, estado: 'ACTIVO' },
            { clase: CL_INGSW, alumno: ALU_MARTIN, estado: 'ACTIVO' },
            { clase: CL_INGSW, alumno: ALU_NATALIA, estado: 'ACTIVO' },
            { clase: CL_INGSW, alumno: ALU_RODRIGO, estado: 'FINALIZADO' },
            // IA: 5 alumnos
            { clase: CL_IA, alumno: ALU_ALEJANDRO, estado: 'ACTIVO' },
            { clase: CL_IA, alumno: ALU_VALENTINA, estado: 'ACTIVO' },
            { clase: CL_IA, alumno: ALU_FERNANDO, estado: 'ACTIVO' },
            { clase: CL_IA, alumno: ALU_GONZALO, estado: 'ACTIVO' },
            { clase: CL_IA, alumno: ALU_ANDREA, estado: 'ACTIVO' },
            // Seguridad: 4 alumnos
            { clase: CL_SEG, alumno: ALU_DANIEL, estado: 'ACTIVO' },
            { clase: CL_SEG, alumno: ALU_CAMILA, estado: 'ACTIVO' },
            { clase: CL_SEG, alumno: ALU_MARTIN, estado: 'ACTIVO' },
            { clase: CL_SEG, alumno: ALU_ISABELLA, estado: 'ACTIVO' },
        ];

        for (const m of matriculas) {
            await client.query(
                `INSERT INTO MATRICULA (ID_CLASE, ID_USUARIO, ESTADO_MATRICULA) VALUES ($1, $2, $3)`,
                [m.clase, m.alumno, m.estado]
            );
        }
        console.log(`   ✓ ${matriculas.length} matrículas creadas`);

        // ============================================================
        // 6. UNIDADES
        // ============================================================
        console.log('📖 Insertando Unidades...');
        const unidadesData = [
            // POO Sec A
            { clase: CL_POO_A, titulo: 'Fundamentos de POO', num: 1 },
            { clase: CL_POO_A, titulo: 'Herencia y Polimorfismo', num: 2 },
            { clase: CL_POO_A, titulo: 'Patrones de Diseño', num: 3 },
            // POO Sec B
            { clase: CL_POO_B, titulo: 'Fundamentos de POO', num: 1 },
            { clase: CL_POO_B, titulo: 'Herencia y Polimorfismo', num: 2 },
            // BD
            { clase: CL_BD, titulo: 'SQL Avanzado', num: 1 },
            { clase: CL_BD, titulo: 'Procedimientos y Triggers', num: 2 },
            { clase: CL_BD, titulo: 'NoSQL y MongoDB', num: 3 },
            // Full Stack
            { clase: CL_FULLSTACK, titulo: 'Frontend con React', num: 1 },
            { clase: CL_FULLSTACK, titulo: 'Backend con Node.js', num: 2 },
            { clase: CL_FULLSTACK, titulo: 'Despliegue en la Nube', num: 3 },
            // Ing Software
            { clase: CL_INGSW, titulo: 'Scrum Avanzado', num: 1 },
            { clase: CL_INGSW, titulo: 'DevOps y CI/CD', num: 2 },
            // IA
            { clase: CL_IA, titulo: 'Machine Learning Básico', num: 1 },
            { clase: CL_IA, titulo: 'Redes Neuronales', num: 2 },
            // Seguridad
            { clase: CL_SEG, titulo: 'Ethical Hacking', num: 1 },
            { clase: CL_SEG, titulo: 'Criptografía Moderna', num: 2 },
        ];

        const unidadIds = {};
        for (let i = 0; i < unidadesData.length; i++) {
            const u = unidadesData[i];
            const res = await client.query(
                `INSERT INTO UNIDAD (ID_CLASE, TITULO, NUMERO) VALUES ($1, $2, $3) RETURNING ID_UNIDAD`,
                [u.clase, u.titulo, u.num]
            );
            unidadIds[`unidad_${i+1}`] = res.rows[0].id_unidad;
        }
        console.log(`   ✓ ${Object.keys(unidadIds).length} unidades creadas`);

        // ============================================================
        // 7. MÓDULOS DE CLASE (Semanas) - Usado para Asistencia
        // ============================================================
        console.log('📅 Insertando Módulos (Semanas)...');
        const modulosData = [];
        const allClases = [
            { id: CL_POO_A, unidades: [unidadIds['unidad_1'], unidadIds['unidad_2'], unidadIds['unidad_3']] },
            { id: CL_POO_B, unidades: [unidadIds['unidad_4'], unidadIds['unidad_5']] },
            { id: CL_BD, unidades: [unidadIds['unidad_6'], unidadIds['unidad_7'], unidadIds['unidad_8']] },
            { id: CL_FULLSTACK, unidades: [unidadIds['unidad_9'], unidadIds['unidad_10'], unidadIds['unidad_11']] },
            { id: CL_INGSW, unidades: [unidadIds['unidad_12'], unidadIds['unidad_13']] },
            { id: CL_IA, unidades: [unidadIds['unidad_14'], unidadIds['unidad_15']] },
            { id: CL_SEG, unidades: [unidadIds['unidad_16'], unidadIds['unidad_17']] },
        ];

        const semanasTitulos = [
            'Semana 1 - Introducción',
            'Semana 2 - Conceptos Fundamentales',
            'Semana 3 - Práctica Dirigida',
            'Semana 4 - Taller Práctico',
            'Semana 5 - Evaluación Parcial',
            'Semana 6 - Temas Avanzados',
            'Semana 7 - Proyecto Integrador',
            'Semana 8 - Revisión y Cierre',
        ];

        const moduloIds = [];
        let moduloCounter = 0;
        for (const cl of allClases) {
            let unidadIdx = 0;
            for (let s = 0; s < 8; s++) {
                const unidadId = cl.unidades[Math.min(unidadIdx, cl.unidades.length - 1)];
                if (s > 0 && s % Math.ceil(8 / cl.unidades.length) === 0) unidadIdx++;
                
                const res = await client.query(
                    `INSERT INTO MODULO_CLASE (ID_CLASE, ID_UNIDAD, TITULO, DESCRIPCION, ORDEN)
                     VALUES ($1, $2, $3, $4, $5) RETURNING ID_MODULO`,
                    [cl.id, unidadId, semanasTitulos[s], `Contenido de la ${semanasTitulos[s].toLowerCase()}`, s + 1]
                );
                moduloIds.push({ id: res.rows[0].id_modulo, claseId: cl.id });
                moduloCounter++;
            }
        }
        console.log(`   ✓ ${moduloCounter} módulos/semanas creados`);

        // ============================================================
        // 8. EVALUACIONES (variedad de tipos y fechas)
        // ============================================================
        console.log('📝 Insertando Evaluaciones...');
        const evaluacionesData = [
            // POO Sec A: 4 evaluaciones
            { clase: CL_POO_A, nombre: 'Práctica Calificada 1', pct: 15, fecha: '2026-06-20' },
            { clase: CL_POO_A, nombre: 'Examen Parcial', pct: 25, fecha: '2026-07-15' },
            { clase: CL_POO_A, nombre: 'Proyecto Final', pct: 35, fecha: '2026-09-30' },
            { clase: CL_POO_A, nombre: 'Examen Final', pct: 25, fecha: '2026-10-10' },
            // POO Sec B: 3 evaluaciones
            { clase: CL_POO_B, nombre: 'Laboratorio 1', pct: 20, fecha: '2026-06-25' },
            { clase: CL_POO_B, nombre: 'Examen Parcial', pct: 30, fecha: '2026-07-18' },
            { clase: CL_POO_B, nombre: 'Examen Final', pct: 50, fecha: '2026-10-12' },
            // BD: 4 evaluaciones
            { clase: CL_BD, nombre: 'Quiz SQL', pct: 10, fecha: '2026-06-15' },
            { clase: CL_BD, nombre: 'Proyecto de Modelado', pct: 30, fecha: '2026-07-20' },
            { clase: CL_BD, nombre: 'Examen Parcial', pct: 30, fecha: '2026-08-10' },
            { clase: CL_BD, nombre: 'Examen Final', pct: 30, fecha: '2026-10-05' },
            // Full Stack: 3 evaluaciones  
            { clase: CL_FULLSTACK, nombre: 'Sprint 1 - Frontend', pct: 25, fecha: '2026-07-01' },
            { clase: CL_FULLSTACK, nombre: 'Sprint 2 - Backend', pct: 25, fecha: '2026-08-01' },
            { clase: CL_FULLSTACK, nombre: 'Demo Final del Producto', pct: 50, fecha: '2026-10-01' },
            // Ing Software: 3 evaluaciones
            { clase: CL_INGSW, nombre: 'Ensayo sobre DevOps', pct: 20, fecha: '2026-06-30' },
            { clase: CL_INGSW, nombre: 'Taller de Pipelines', pct: 30, fecha: '2026-08-15' },
            { clase: CL_INGSW, nombre: 'Proyecto CI/CD', pct: 50, fecha: '2026-10-08' },
            // IA: 3 evaluaciones
            { clase: CL_IA, nombre: 'Notebook ML Básico', pct: 20, fecha: '2026-07-05' },
            { clase: CL_IA, nombre: 'Examen Parcial', pct: 30, fecha: '2026-08-05' },
            { clase: CL_IA, nombre: 'Proyecto de Redes Neuronales', pct: 50, fecha: '2026-10-05' },
            // Seguridad: 3 evaluaciones
            { clase: CL_SEG, nombre: 'Reporte CTF', pct: 25, fecha: '2026-07-10' },
            { clase: CL_SEG, nombre: 'Auditoría Web', pct: 35, fecha: '2026-08-20' },
            { clase: CL_SEG, nombre: 'Examen Final', pct: 40, fecha: '2026-10-10' },
        ];

        const evaIds = [];
        for (const e of evaluacionesData) {
            const res = await client.query(
                `INSERT INTO EVALUACION (ID_CLASE, NOMBRE_EVA, PORCENTAJE, FECHA_EVALUACION) 
                 VALUES ($1, $2, $3, $4) RETURNING ID_EVALUACION, ID_CLASE`,
                [e.clase, e.nombre, e.pct, e.fecha]
            );
            evaIds.push({ id: res.rows[0].id_evaluacion, clase: e.clase, nombre: e.nombre, fecha: e.fecha });
        }
        console.log(`   ✓ ${evaIds.length} evaluaciones creadas`);

        // ============================================================
        // 9. ENTREGAS DE EVALUACIONES
        // ============================================================
        console.log('📤 Insertando Entregas de Evaluaciones...');
        // Solo crear entregas para evaluaciones con fecha ya pasada (antes de ahora: 2026-07-21)
        const pastEvas = evaIds.filter(e => new Date(e.fecha) <= new Date('2026-07-21'));
        
        // Mapeo de alumnos por clase
        const alumnosPorClase = {
            [CL_POO_A]: [ALU_ALEJANDRO, ALU_VALENTINA, ALU_DANIEL, ALU_RODRIGO, ALU_ISABELLA],
            [CL_POO_B]: [ALU_CAMILA, ALU_FERNANDO, ALU_LUCIA, ALU_GONZALO],
            [CL_BD]: [ALU_ALEJANDRO, ALU_MARTIN, ALU_NATALIA, ALU_RODRIGO, ALU_GONZALO],
            [CL_FULLSTACK]: [ALU_VALENTINA, ALU_DANIEL, ALU_CAMILA, ALU_FERNANDO, ALU_ISABELLA, ALU_ANDREA],
            [CL_INGSW]: [ALU_LUCIA, ALU_MARTIN, ALU_NATALIA],
            [CL_IA]: [ALU_ALEJANDRO, ALU_VALENTINA, ALU_FERNANDO, ALU_GONZALO, ALU_ANDREA],
            [CL_SEG]: [ALU_DANIEL, ALU_CAMILA, ALU_MARTIN, ALU_ISABELLA],
        };

        let entregaCount = 0;
        for (const eva of pastEvas) {
            const alumnos = alumnosPorClase[eva.clase] || [];
            for (const alumId of alumnos) {
                // Algunos alumnos no entregan (simular eso)
                const entrega = Math.random() > 0.15; // 85% entregan
                if (entrega) {
                    await client.query(
                        `INSERT INTO ENTREGA_EVALUACION (ID_EVALUACION, ID_USUARIO, ARCHIVO_URL, FECHA_ENTREGA)
                         VALUES ($1, $2, $3, $4)`,
                        [eva.id, alumId, `https://drive.google.com/file/entrega_${eva.id}_${alumId}`, eva.fecha]
                    );
                    entregaCount++;
                }
            }
        }
        console.log(`   ✓ ${entregaCount} entregas creadas`);

        // ============================================================
        // 10. NOTAS (con variedad: excelentes, aprobados, jalados)
        // ============================================================
        console.log('📊 Insertando Notas...');
        const notaRanges = {
            'excelente': () => (17 + Math.random() * 3).toFixed(2),
            'bueno': () => (14 + Math.random() * 3).toFixed(2),
            'regular': () => (11 + Math.random() * 3).toFixed(2),
            'desaprobado': () => (5 + Math.random() * 5.5).toFixed(2),
        };

        let notaCount = 0;
        for (const eva of pastEvas) {
            const alumnos = alumnosPorClase[eva.clase] || [];
            for (let j = 0; j < alumnos.length; j++) {
                const alumId = alumnos[j];
                // Variedad en notas según posición del alumno
                let nivel;
                if (j === 0) nivel = 'excelente';
                else if (j <= 2) nivel = 'bueno';
                else if (j <= alumnos.length - 2) nivel = 'regular';
                else nivel = 'desaprobado';

                const cal = notaRanges[nivel]();
                const comentarios = {
                    'excelente': 'Excelente trabajo, muy completo y bien estructurado',
                    'bueno': 'Buen trabajo, con pequeñas observaciones',
                    'regular': 'Cumple con lo mínimo requerido. Puede mejorar.',
                    'desaprobado': 'Trabajo incompleto. Se recomienda refuerzo académico.',
                };

                await client.query(
                    `INSERT INTO NOTA (ID_EVALUACION, ID_USUARIO, CALIFICACION, COMENTARIO, FECHA_REGISTRO)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [eva.id, alumId, cal, comentarios[nivel], eva.fecha]
                );
                notaCount++;
            }
        }
        console.log(`   ✓ ${notaCount} notas registradas`);

        // ============================================================
        // 11. ASISTENCIA (por ID_MODULO, no por sesión)
        // ============================================================
        console.log('✅ Insertando Asistencia...');
        let asistCount = 0;
        // Para cada clase, marcar asistencia en las primeras 5 semanas (ya pasadas)
        for (const cl of allClases) {
            const modulos = moduloIds.filter(m => m.claseId === cl.id).slice(0, 5);
            const alumnos = alumnosPorClase[cl.id] || [];

            for (const mod of modulos) {
                const semanaNum = modulos.indexOf(mod) + 1;
                const fechaBase = new Date('2026-06-01');
                fechaBase.setDate(fechaBase.getDate() + (semanaNum * 7));
                const fechaStr = fechaBase.toISOString().split('T')[0];

                for (const alumId of alumnos) {
                    // Variedad: mayormente presente, algunos ausentes o tardanza
                    const rnd = Math.random();
                    let estado;
                    if (rnd < 0.7) estado = 'presente';
                    else if (rnd < 0.85) estado = 'tardanza';
                    else estado = 'ausente';

                    await client.query(
                        `INSERT INTO ASISTENCIA (ID_MODULO, ID_USUARIO, FECHA, ESTADO) VALUES ($1, $2, $3, $4)`,
                        [mod.id, alumId, fechaStr, estado]
                    );
                    asistCount++;
                }
            }
        }
        console.log(`   ✓ ${asistCount} registros de asistencia`);

        // ============================================================
        // 12. RECURSOS
        // ============================================================
        console.log('📂 Insertando Recursos...');
        const recursosData = [
            // POO A
            { clase: CL_POO_A, titulo: 'Sílabo POO 2026-I', desc: 'Plan de estudios completo del curso', tipo: 'pdf', url: 'https://drive.google.com/silabo_poo.pdf' },
            { clase: CL_POO_A, titulo: 'Video - Herencia en Java', desc: 'Explicación paso a paso de herencia', tipo: 'video', url: 'https://youtube.com/watch?v=herencia_java' },
            { clase: CL_POO_A, titulo: 'Diapositivas Polimorfismo', desc: 'PPT de la clase de polimorfismo', tipo: 'documento', url: 'https://drive.google.com/polimorfismo.pptx' },
            { clase: CL_POO_A, titulo: 'Ejercicios resueltos', desc: 'Banco de problemas resueltos', tipo: 'pdf', url: 'https://drive.google.com/ejercicios.pdf' },
            // BD
            { clase: CL_BD, titulo: 'Manual SQL Avanzado', desc: 'Guía completa de subconsultas y CTE', tipo: 'pdf', url: 'https://drive.google.com/sql_avanzado.pdf' },
            { clase: CL_BD, titulo: 'Script de ejemplo - Triggers', desc: 'Archivo SQL con triggers de auditoría', tipo: 'otro', url: 'https://drive.google.com/triggers.sql' },
            { clase: CL_BD, titulo: 'Video - Normalización', desc: 'De 1FN a 3FN con ejemplos reales', tipo: 'video', url: 'https://youtube.com/watch?v=normalizacion' },
            // Full Stack
            { clase: CL_FULLSTACK, titulo: 'Guía React Hooks', desc: 'useState, useEffect, useContext', tipo: 'link', url: 'https://react.dev/learn' },
            { clase: CL_FULLSTACK, titulo: 'Plantilla del Proyecto', desc: 'Repositorio GitHub con el boilerplate', tipo: 'link', url: 'https://github.com/template-fullstack' },
            { clase: CL_FULLSTACK, titulo: 'Diagrama Arquitectura', desc: 'Arquitectura del proyecto final', tipo: 'imagen', url: 'https://drive.google.com/arquitectura.png' },
            // IA
            { clase: CL_IA, titulo: 'Notebook de regresión lineal', desc: 'Jupyter Notebook con datos reales', tipo: 'otro', url: 'https://colab.research.google.com/regresion' },
            { clase: CL_IA, titulo: 'Dataset Iris', desc: 'Dataset clásico para clasificación', tipo: 'otro', url: 'https://drive.google.com/iris.csv' },
            // Seguridad
            { clase: CL_SEG, titulo: 'OWASP Top 10 - 2025', desc: 'Reporte actualizado de vulnerabilidades web', tipo: 'pdf', url: 'https://owasp.org/top10_2025.pdf' },
            { clase: CL_SEG, titulo: 'Laboratorio de Kali Linux', desc: 'Instrucciones para el lab virtual', tipo: 'documento', url: 'https://drive.google.com/kali_lab.pdf' },
            // Ing Software
            { clase: CL_INGSW, titulo: 'Manifiesto Ágil', desc: 'Los 12 principios del desarrollo ágil', tipo: 'link', url: 'https://agilemanifesto.org/iso/es/manifesto.html' },
            { clase: CL_INGSW, titulo: 'Video - Pipeline de Jenkins', desc: 'Configuración paso a paso', tipo: 'video', url: 'https://youtube.com/watch?v=jenkins_pipeline' },
        ];

        for (const r of recursosData) {
            await client.query(
                `INSERT INTO RECURSOS (ID_CLASE, TITULO, DESCRIPCION, TIPO_RECURSO, URL_ARCHIVO, FECHA_PUBLICACION)
                 VALUES ($1, $2, $3, $4, $5, NOW() - interval '${Math.floor(Math.random() * 30)} days')`,
                [r.clase, r.titulo, r.desc, r.tipo, r.url]
            );
        }
        console.log(`   ✓ ${recursosData.length} recursos creados`);

        // ============================================================
        // 13. GRUPOS DE TRABAJO
        // ============================================================
        console.log('👨‍👩‍👧‍👦 Insertando Grupos de Trabajo...');
        const gruposData = [
            { clase: CL_POO_A, nombre: 'Los Arquitectos del Código', miembros: [ALU_ALEJANDRO, ALU_VALENTINA, ALU_DANIEL] },
            { clase: CL_POO_A, nombre: 'Java Masters', miembros: [ALU_RODRIGO, ALU_ISABELLA] },
            { clase: CL_BD, nombre: 'Query Wizards', miembros: [ALU_ALEJANDRO, ALU_MARTIN, ALU_NATALIA] },
            { clase: CL_BD, nombre: 'Data Miners', miembros: [ALU_RODRIGO, ALU_GONZALO] },
            { clase: CL_FULLSTACK, nombre: 'Stack Overflow Team', miembros: [ALU_VALENTINA, ALU_DANIEL, ALU_CAMILA] },
            { clase: CL_FULLSTACK, nombre: 'Los Deployers', miembros: [ALU_FERNANDO, ALU_ISABELLA, ALU_ANDREA] },
            { clase: CL_IA, nombre: 'Deep Learning Crew', miembros: [ALU_ALEJANDRO, ALU_VALENTINA, ALU_FERNANDO] },
            { clase: CL_IA, nombre: 'Neural Network Team', miembros: [ALU_GONZALO, ALU_ANDREA] },
            { clase: CL_SEG, nombre: 'Hackers Éticos', miembros: [ALU_DANIEL, ALU_CAMILA] },
            { clase: CL_SEG, nombre: 'Cyber Shield', miembros: [ALU_MARTIN, ALU_ISABELLA] },
        ];

        const grupoIds = [];
        for (const g of gruposData) {
            const res = await client.query(
                `INSERT INTO GRUPO (ID_CLASE, NOMBRE_GRUPO, FECHA_CREACION) VALUES ($1, $2, NOW()) RETURNING ID_GRUPO`,
                [g.clase, g.nombre]
            );
            const gid = res.rows[0].id_grupo;
            grupoIds.push(gid);
            for (const m of g.miembros) {
                await client.query(
                    `INSERT INTO GRUPO_ESTUDIANTE (ID_GRUPO, ID_USUARIO) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [gid, m]
                );
            }
        }
        console.log(`   ✓ ${gruposData.length} grupos creados`);

        // ============================================================
        // 14. CALENDARIO ACADÉMICO
        // ============================================================
        console.log('🗓️  Insertando Eventos de Calendario...');
        const calendarData = [
            { clase: CL_POO_A, titulo: 'Inicio de Clases', desc: 'Primera sesión del ciclo', fi: '2026-06-01 08:00:00', ff: '2026-06-01 10:00:00', tipo: 'otro' },
            { clase: CL_POO_A, titulo: 'Examen Parcial POO', desc: 'Aula 101. Traer laptop.', fi: '2026-07-15 10:00:00', ff: '2026-07-15 12:00:00', tipo: 'examen' },
            { clase: CL_POO_A, titulo: 'Feriado - Fiestas Patrias', desc: 'No hay clases', fi: '2026-07-28 00:00:00', ff: '2026-07-29 23:59:00', tipo: 'feriado' },
            { clase: CL_BD, titulo: 'Entrega Proyecto de Modelado', desc: 'Subir al aula virtual', fi: '2026-07-20 23:59:00', ff: '2026-07-20 23:59:00', tipo: 'entrega' },
            { clase: CL_FULLSTACK, titulo: 'Demo Sprint 1', desc: 'Presentar avance frontend', fi: '2026-07-01 14:00:00', ff: '2026-07-01 16:00:00', tipo: 'reunion' },
            { clase: CL_FULLSTACK, titulo: 'Hackathon Interno', desc: 'Evento de programación de 48h', fi: '2026-08-15 09:00:00', ff: '2026-08-16 09:00:00', tipo: 'otro' },
            { clase: CL_INGSW, titulo: 'Taller de Git Flow', desc: 'Práctica grupal de branching', fi: '2026-07-10 14:00:00', ff: '2026-07-10 18:00:00', tipo: 'reunion' },
            { clase: CL_IA, titulo: 'Charla: IA en la Industria', desc: 'Invitado de Google DeepMind', fi: '2026-08-01 10:00:00', ff: '2026-08-01 12:00:00', tipo: 'otro' },
            { clase: CL_SEG, titulo: 'CTF Competition', desc: 'Capture The Flag interno', fi: '2026-07-25 09:00:00', ff: '2026-07-25 18:00:00', tipo: 'otro' },
            { clase: CL_SEG, titulo: 'Examen de Auditoría', desc: 'Evaluación práctica', fi: '2026-08-20 10:00:00', ff: '2026-08-20 12:00:00', tipo: 'examen' },
            { clase: CL_POO_B, titulo: 'Laboratorio 1 POO-B', desc: 'Entrega en repositorio GitHub', fi: '2026-06-25 23:59:00', ff: '2026-06-25 23:59:00', tipo: 'entrega' },
            { clase: CL_POO_A, titulo: 'Sustentación Proyecto Final', desc: 'Presentación ante jurado', fi: '2026-09-30 08:00:00', ff: '2026-09-30 18:00:00', tipo: 'examen' },
        ];

        for (const ev of calendarData) {
            await client.query(
                `INSERT INTO CALENDARIO_ACADEMICO (ID_CLASE, TITULO_EVENTO, DESCRIPCION, FECHA_INICIO, FECHA_FIN, TIPO_EVENTO)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [ev.clase, ev.titulo, ev.desc, ev.fi, ev.ff, ev.tipo]
            );
        }
        console.log(`   ✓ ${calendarData.length} eventos de calendario`);

        // ============================================================
        // 15. FOROS
        // ============================================================
        console.log('💬 Insertando Foros, Temas y Respuestas...');
        const forosData = [
            { clase: CL_POO_A, titulo: 'Dudas de POO', desc: 'Publiquen sus consultas sobre herencia, polimorfismo y patrones' },
            { clase: CL_POO_A, titulo: 'Compartir Recursos', desc: 'Artículos, videos y tutoriales que encuentren' },
            { clase: CL_BD, titulo: 'Consultas SQL', desc: 'Preguntas sobre subconsultas, joins y optimización' },
            { clase: CL_FULLSTACK, titulo: 'Errores Comunes', desc: 'Errores de React/Node y sus soluciones' },
            { clase: CL_FULLSTACK, titulo: 'Showcase de Proyectos', desc: 'Compartan capturas de sus avances' },
            { clase: CL_IA, titulo: 'Papers y Artículos', desc: 'Investigaciones recientes en IA y ML' },
            { clase: CL_SEG, titulo: 'Noticias de Ciberseguridad', desc: 'Últimos ataques y brechas de seguridad 2026' },
            { clase: CL_INGSW, titulo: 'Debate: Scrum vs Kanban', desc: '¿Cuál es mejor para proyectos universitarios?' },
        ];

        const foroIds = [];
        for (const f of forosData) {
            const res = await client.query(
                `INSERT INTO FORO (ID_CLASE, TITULO_FORO, DESCRIPCION) VALUES ($1, $2, $3) RETURNING ID_FORO`,
                [f.clase, f.titulo, f.desc]
            );
            foroIds.push({ id: res.rows[0].id_foro, clase: f.clase });
        }

        // Temas de foro
        const temasData = [
            { foro: foroIds[0].id, usuario: ALU_ALEJANDRO, titulo: 'Error con ArrayList genérico', msg: 'Estoy intentando crear un ArrayList<Animal> pero al agregar un objeto de tipo Perro me sale ClassCastException. ¿Cómo lo resuelvo?', esAviso: false },
            { foro: foroIds[0].id, usuario: ALU_VALENTINA, titulo: '¿Cuándo usar interfaces vs clases abstractas?', msg: 'Tengo dudas sobre cuándo debería usar una interfaz y cuándo una clase abstracta. El profe mencionó que depende del contexto, pero necesito ejemplos concretos.', esAviso: false },
            { foro: foroIds[0].id, usuario: DOC_ROBERTO, titulo: '📢 Recordatorio: Entrega de Proyecto', msg: 'Les recuerdo que la entrega del proyecto final es el 30 de septiembre. No se aceptarán entregas tardías.', esAviso: true },
            { foro: foroIds[1].id, usuario: ALU_DANIEL, titulo: 'Tutorial de Design Patterns en Java', msg: 'Encontré este video increíble sobre Singleton, Factory y Observer: https://youtube.com/patterns_java', esAviso: false },
            { foro: foroIds[2].id, usuario: ALU_MARTIN, titulo: 'JOIN de 5 tablas se demora mucho', msg: 'Estoy haciendo un query con 5 JOINs y tarda 8 segundos. ¿Cómo puedo optimizarlo? Adjunto mi query.', esAviso: false },
            { foro: foroIds[2].id, usuario: ALU_NATALIA, titulo: '¿Cómo usar CTE recursivo?', msg: 'Necesito hacer una consulta jerárquica para categorías y subcategorías. Intenté con WITH RECURSIVE pero no me funciona.', esAviso: false },
            { foro: foroIds[3].id, usuario: ALU_CAMILA, titulo: 'useEffect se ejecuta infinitamente', msg: 'Tengo un useEffect que llama a una API pero entra en un loop infinito. Aquí está mi código...', esAviso: false },
            { foro: foroIds[3].id, usuario: ALU_FERNANDO, titulo: 'Error CORS en localhost', msg: 'Mi frontend React no puede llamar al backend Express. Me sale "blocked by CORS policy". Ya probé con cors() pero sigue igual.', esAviso: false },
            { foro: foroIds[4].id, usuario: ALU_ISABELLA, titulo: 'Mi dashboard con gráficos', msg: 'Logré implementar Chart.js para mostrar las estadísticas. Les comparto una captura de cómo quedó.', esAviso: false },
            { foro: foroIds[5].id, usuario: ALU_ALEJANDRO, titulo: 'Paper: Attention is All You Need', msg: 'El paper original de Transformers que revolucionó NLP. Lectura obligatoria para la unidad 2.', esAviso: false },
            { foro: foroIds[6].id, usuario: ALU_DANIEL, titulo: 'Ransomware atacó banco peruano', msg: '¿Vieron la noticia? Un banco fue víctima de ransomware la semana pasada. El grupo LockBit se adjudicó el ataque.', esAviso: false },
            { foro: foroIds[7].id, usuario: ALU_LUCIA, titulo: 'Scrum es más flexible', msg: 'En mi experiencia de prácticas pre-profesionales, Scrum se adapta mejor porque permite cambios en cada sprint.', esAviso: false },
            { foro: foroIds[7].id, usuario: ALU_MARTIN, titulo: 'Kanban para equipos pequeños', msg: 'Para proyectos universitarios con equipos de 3-4 personas, Kanban funciona mejor. No necesitas tantas ceremonias.', esAviso: false },
        ];

        const temaIds = [];
        for (const t of temasData) {
            const res = await client.query(
                `INSERT INTO TEMA_FORO (ID_FORO, ID_USUARIO, TITULO_TEMA, MENSAJE_INICIAL, ES_AVISO) VALUES ($1, $2, $3, $4, $5) RETURNING ID_TEMA`,
                [t.foro, t.usuario, t.titulo, t.msg, t.esAviso || false]
            );
            temaIds.push(res.rows[0].id_tema);
        }

        // Respuestas a los temas
        const respuestasData = [
            { tema: temaIds[0], usuario: DOC_ROBERTO, contenido: 'El ClassCastException ocurre porque no estás haciendo downcasting correctamente. Usa instanceof antes de hacer cast: if (animal instanceof Perro) { Perro p = (Perro) animal; }' },
            { tema: temaIds[0], usuario: ALU_VALENTINA, contenido: 'A mí me pasó lo mismo. Lo resolví usando genéricos con wildcard: List<? extends Animal>' },
            { tema: temaIds[1], usuario: DOC_ROBERTO, contenido: 'Usa interfaces cuando necesites que clases no relacionadas compartan un contrato. Usa clases abstractas cuando compartan código y estado.' },
            { tema: temaIds[1], usuario: ALU_RODRIGO, contenido: 'Desde Java 8, las interfaces pueden tener métodos default, así que la línea se ha difuminado bastante.' },
            { tema: temaIds[3], usuario: ALU_ALEJANDRO, contenido: '¡Excelente recurso! Me sirvió mucho para entender Observer Pattern.' },
            { tema: temaIds[4], usuario: DOC_PATRICIA, contenido: 'Crea índices en las columnas que usas en las condiciones JOIN y WHERE. También revisa el EXPLAIN ANALYZE para identificar el cuello de botella.' },
            { tema: temaIds[4], usuario: ALU_RODRIGO, contenido: 'Intenta materializar la subconsulta más pesada como una vista materializada.' },
            { tema: temaIds[5], usuario: DOC_PATRICIA, contenido: 'El CTE recursivo necesita dos partes: el caso base y la parte recursiva. Revisa que tu UNION ALL esté bien armado.' },
            { tema: temaIds[6], usuario: DOC_ROBERTO, contenido: 'Probablemente te falta el array de dependencias vacío: useEffect(() => { fetchData(); }, []); el [] evita que se re-ejecute.' },
            { tema: temaIds[6], usuario: ALU_DANIEL, contenido: 'A mí me pasó igual. Asegúrate de no modificar el estado dentro del useEffect sin el array de dependencias.' },
            { tema: temaIds[7], usuario: DOC_ROBERTO, contenido: 'En tu backend Express, asegúrate de que el middleware cors() esté ANTES de definir tus rutas. También verifica que el origin coincida exactamente.' },
            { tema: temaIds[7], usuario: ALU_VALENTINA, contenido: 'También puede ser que estés usando credenciales (cookies). En ese caso necesitas: cors({ origin: "http://localhost:5173", credentials: true })' },
            { tema: temaIds[9], usuario: ALU_VALENTINA, contenido: 'Este paper cambió todo el campo del NLP. Los Transformers son la base de GPT, BERT, etc.' },
            { tema: temaIds[10], usuario: ALU_CAMILA, contenido: '¡Increíble! Esto demuestra la importancia del patching y la segmentación de red.' },
            { tema: temaIds[10], usuario: DOC_JULIO, contenido: 'Lo analizaremos como caso de estudio en la próxima clase. Prepárense para discutirlo.' },
            { tema: temaIds[11], usuario: ALU_NATALIA, contenido: 'Concuerdo, pero la Sprint Retrospective de Scrum es muy valiosa para mejorar continuamente.' },
            { tema: temaIds[12], usuario: ALU_LUCIA, contenido: 'Buen punto, pero Kanban no tiene timeboxing, lo que puede hacer que las tareas se eternicen.' },
        ];

        for (const r of respuestasData) {
            await client.query(
                `INSERT INTO RESPUESTA_FORO (ID_TEMA, ID_USUARIO, CONTENIDO) VALUES ($1, $2, $3)`,
                [r.tema, r.usuario, r.contenido]
            );
        }
        console.log(`   ✓ ${forosData.length} foros, ${temasData.length} temas, ${respuestasData.length} respuestas`);

        // ============================================================
        // 16. ASESORÍAS
        // ============================================================
        console.log('🤝 Insertando Asesorías...');
        const asesoriasData = [
            { doc: DOC_ROBERTO, sol: ALU_ALEJANDRO, grupo: grupoIds[0], motivo: 'Duda sobre patrones de diseño', desc: 'No entiendo cuándo usar Factory vs Abstract Factory', hora: '2026-07-05 15:00:00', enlace: 'https://meet.google.com/abc-111', estado: 'confirmada' },
            { doc: DOC_ROBERTO, sol: ALU_VALENTINA, grupo: null, motivo: 'Revisión de nota del parcial', desc: 'Creo que hubo un error en la corrección de la pregunta 3', hora: '2026-07-08 10:00:00', enlace: 'https://meet.google.com/abc-222', estado: 'confirmada' },
            { doc: DOC_PATRICIA, sol: ALU_MARTIN, grupo: grupoIds[2], motivo: 'Ayuda con procedimientos almacenados', desc: 'El stored procedure no retorna los valores esperados', hora: '2026-07-10 14:00:00', enlace: 'https://meet.google.com/abc-333', estado: 'confirmada' },
            { doc: DOC_PATRICIA, sol: ALU_NATALIA, grupo: null, motivo: 'Consulta sobre el proyecto de modelado', desc: 'Necesito validar mi diagrama ER antes de la entrega', hora: '2026-07-18 16:00:00', enlace: 'https://meet.google.com/abc-444', estado: 'pendiente' },
            { doc: DOC_ROBERTO, sol: ALU_CAMILA, grupo: grupoIds[4], motivo: 'Error en el deployment a Render', desc: 'Mi app React no despliega correctamente, se queda en blanco', hora: '2026-07-12 11:00:00', enlace: 'https://meet.google.com/abc-555', estado: 'confirmada' },
            { doc: DOC_JULIO, sol: ALU_DANIEL, grupo: grupoIds[8], motivo: 'Preparación para CTF', desc: 'Quiero practicar inyección SQL y XSS antes del concurso', hora: '2026-07-20 09:00:00', enlace: 'https://meet.google.com/abc-666', estado: 'pendiente' },
            { doc: DOC_SANDRA, sol: ALU_FERNANDO, grupo: grupoIds[6], motivo: 'Duda sobre backpropagation', desc: 'No entiendo la derivada de la función de pérdida en el cálculo del gradiente', hora: '2026-07-15 15:00:00', enlace: 'https://meet.google.com/abc-777', estado: 'confirmada' },
            { doc: DOC_ROBERTO, sol: ALU_RODRIGO, grupo: null, motivo: 'Solicitud de carta de recomendación', desc: 'Necesito una carta para postular a una beca internacional', hora: '2026-07-22 10:00:00', enlace: 'https://meet.google.com/abc-888', estado: 'pendiente' },
            { doc: DOC_JULIO, sol: ALU_GONZALO, grupo: null, motivo: 'Problemas con el laboratorio', desc: 'Mi máquina virtual no inicia correctamente', hora: '2026-07-03 14:00:00', enlace: 'https://meet.google.com/abc-999', estado: 'rechazada' },
            { doc: DOC_PATRICIA, sol: ALU_LUCIA, grupo: null, motivo: 'Consulta sobre sprint retrospective', desc: 'No sé cómo facilitar la retrospectiva de mi equipo', hora: '2026-07-25 16:00:00', enlace: 'https://meet.google.com/abc-aaa', estado: 'pendiente' },
        ];

        for (const a of asesoriasData) {
            const res = await client.query(
                `INSERT INTO ASESORIA (ID_DOCENTE, ID_SOLICITANTE, ID_GRUPO, MOTIVO, DESCRIPCION, FECHA_HORA, ENLACE_REUNION, ESTADO)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ID_ASESORIA`,
                [a.doc, a.sol, a.grupo, a.motivo, a.desc, a.hora, a.enlace, a.estado]
            );
            // Agregar participantes
            await client.query(
                `INSERT INTO PARTICIPANTE_ASESORIA (ID_ASESORIA, ID_USUARIO) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [res.rows[0].id_asesoria, a.sol]
            );
        }
        console.log(`   ✓ ${asesoriasData.length} asesorías creadas`);

        // ============================================================
        // 17. SESIONES DE CLASE (tabla legacy, aún usada por el frontend)
        // ============================================================
        console.log('📖 Insertando Sesiones de Clase...');
        const sesionesData = [
            { clase: CL_POO_A, tema: 'Clases y Objetos', desc: 'Definición de clases, atributos y métodos', fecha: '2026-06-05' },
            { clase: CL_POO_A, tema: 'Herencia', desc: 'Extends, super, protected', fecha: '2026-06-12' },
            { clase: CL_POO_A, tema: 'Polimorfismo', desc: 'Overriding y overloading', fecha: '2026-06-19' },
            { clase: CL_POO_A, tema: 'Interfaces y Clases Abstractas', desc: 'Contratos y abstracción', fecha: '2026-06-26' },
            { clase: CL_POO_A, tema: 'Patrones Creacionales', desc: 'Singleton, Factory, Builder', fecha: '2026-07-03' },
            { clase: CL_BD, tema: 'Subconsultas avanzadas', desc: 'IN, EXISTS, ALL, ANY', fecha: '2026-06-06' },
            { clase: CL_BD, tema: 'Window Functions', desc: 'ROW_NUMBER, RANK, LEAD, LAG', fecha: '2026-06-13' },
            { clase: CL_BD, tema: 'Stored Procedures', desc: 'PL/pgSQL funciones y procedimientos', fecha: '2026-06-20' },
            { clase: CL_FULLSTACK, tema: 'Componentes React', desc: 'JSX, props y estado', fecha: '2026-06-07' },
            { clase: CL_FULLSTACK, tema: 'React Router', desc: 'Navegación SPA', fecha: '2026-06-14' },
            { clase: CL_FULLSTACK, tema: 'Express.js', desc: 'Rutas, middleware, controladores', fecha: '2026-06-21' },
            { clase: CL_IA, tema: 'Regresión Lineal', desc: 'Algoritmo y función de costo', fecha: '2026-06-08' },
            { clase: CL_IA, tema: 'Clasificación', desc: 'Logistic Regression y SVM', fecha: '2026-06-15' },
            { clase: CL_SEG, tema: 'Reconocimiento de Red', desc: 'Nmap, Masscan, Shodan', fecha: '2026-06-09' },
            { clase: CL_SEG, tema: 'Inyección SQL', desc: 'Tipos, herramientas (SQLMap), prevención', fecha: '2026-06-16' },
        ];

        for (const s of sesionesData) {
            await client.query(
                `INSERT INTO SESION_CLASE (ID_CLASE, TEMA, DESCRIPCION, FECHA, HORA_INICIO, HORA_FIN)
                 VALUES ($1, $2, $3, $4, '08:00:00', '10:00:00')`,
                [s.clase, s.tema, s.desc, s.fecha]
            );
        }
        console.log(`   ✓ ${sesionesData.length} sesiones de clase`);

        // ============================================================
        // 18. ANUNCIOS
        // ============================================================
        console.log('📢 Insertando Anuncios...');
        const anunciosData = [
            { titulo: 'Bienvenidos al Ciclo 2026-I', contenido: 'Damos la bienvenida a todos los estudiantes y docentes al nuevo periodo académico. Les deseamos mucho éxito en este semestre.', nivel: 'info', autor: ADMIN, orden: 1 },
            { titulo: 'Proceso de Matrículas Abierto', contenido: 'El proceso de matrícula extraordinaria estará disponible hasta el 15 de julio. Los alumnos que necesiten agregar o retirar cursos pueden hacerlo a través de la plataforma.', nivel: 'info', autor: ADMIN, orden: 2 },
            { titulo: 'Mantenimiento del Sistema - 26 de Julio', contenido: 'El sistema estará en mantenimiento preventivo el sábado 26 de julio de 2:00am a 6:00am. Durante este periodo, la plataforma no estará disponible.', nivel: 'advertencia', autor: ADMIN, orden: 3 },
            { titulo: 'Feriado por Fiestas Patrias', contenido: 'Se suspenden las clases los días 28 y 29 de julio con motivo de las Fiestas Patrias. Las clases se retoman el miércoles 30 de julio.', nivel: 'urgente', autor: ADMIN, orden: 4 },
            { titulo: 'Nuevos Laboratorios Habilitados', contenido: 'Los laboratorios 501 y 502 han sido equipados con nuevas computadoras. Están disponibles para prácticas de los cursos de IA y Seguridad Informática.', nivel: 'info', autor: ADMIN, orden: 5 },
        ];

        for (const a of anunciosData) {
            await client.query(
                `INSERT INTO ANUNCIO (TITULO, CONTENIDO, NIVEL, ID_AUTOR, ACTIVO, ORDEN)
                 VALUES ($1, $2, $3, $4, TRUE, $5)`,
                [a.titulo, a.contenido, a.nivel, a.autor, a.orden]
            );
        }
        console.log(`   ✓ ${anunciosData.length} anuncios`);

        // ============================================================
        // 19. INCIDENCIAS DE SOPORTE (variedad: pendientes y resueltas)
        // ============================================================
        console.log('🔧 Insertando Incidencias de Soporte...');
        const incidenciasData = [
            { usuario: ALU_ALEJANDRO, asunto: 'No puedo subir archivos', desc: 'Al intentar subir mi entrega en formato PDF, la plataforma se queda cargando y luego muestra error 500.', estado: 'pendiente' },
            { usuario: ALU_VALENTINA, asunto: 'Mi contraseña no funciona', desc: 'Cambié mi contraseña ayer pero ahora no puedo iniciar sesión con la nueva. Ya intenté borrar cookies.', estado: 'resuelto' },
            { usuario: ALU_CAMILA, asunto: 'No veo mis notas', desc: 'En el curso de POO-B no aparecen las notas del laboratorio 1, aunque el profesor dice que ya las subió.', estado: 'pendiente' },
            { usuario: DOC_ROBERTO, asunto: 'Error al crear evaluación', desc: 'Cuando intento crear una nueva evaluación para Full Stack, me sale "Error interno del servidor". Pasa con cualquier porcentaje.', estado: 'pendiente' },
            { usuario: ALU_FERNANDO, asunto: 'Solicitud de cambio de sección', desc: 'Necesito cambiarme de la sección B de POO a la sección A por cruce de horarios con mi trabajo.', estado: 'pendiente' },
            { usuario: ALU_MARTIN, asunto: 'Link de WhatsApp no funciona', desc: 'El enlace de WhatsApp del curso de Ingeniería de Software está expirado. No puedo unirme al grupo.', estado: 'resuelto' },
            { usuario: ALU_RODRIGO, asunto: 'Problema de acceso a recursos', desc: 'No puedo descargar el PDF del sílabo de Base de Datos. Me redirige a una página en blanco.', estado: 'pendiente' },
            { usuario: DOC_PATRICIA, asunto: 'Exportar reporte CSV vacío', desc: 'Al exportar el reporte de notas sale un archivo vacío. Antes funcionaba correctamente.', estado: 'pendiente' },
        ];

        for (const i of incidenciasData) {
            await client.query(
                `INSERT INTO INCIDENCIA_SOPORTE (ID_USUARIO, ASUNTO, DESCRIPCION, ESTADO)
                 VALUES ($1, $2, $3, $4)`,
                [i.usuario, i.asunto, i.desc, i.estado]
            );
        }
        console.log(`   ✓ ${incidenciasData.length} incidencias de soporte`);

        // ============================================================
        // 20. NOTIFICACIONES
        // ============================================================
        console.log('🔔 Insertando Notificaciones...');
        const notifData = [
            // Notificaciones para alumnos
            { dest: ALU_ALEJANDRO, titulo: 'Nueva nota publicada', msg: 'Tu calificación de "Práctica Calificada 1" en POO ha sido publicada.', leida: true, enlace: null },
            { dest: ALU_ALEJANDRO, titulo: 'Asesoría confirmada', msg: 'Tu asesoría con el Prof. García sobre patrones de diseño ha sido confirmada para el 5 de julio.', leida: true, enlace: null },
            { dest: ALU_ALEJANDRO, titulo: 'Nuevo recurso disponible', msg: 'Se ha subido "Video - Herencia en Java" en el curso POO.', leida: false, enlace: null },
            { dest: ALU_VALENTINA, titulo: 'Evaluación próxima', msg: 'Recuerda que el "Examen Parcial" de POO es el 15 de julio.', leida: false, enlace: null },
            { dest: ALU_VALENTINA, titulo: 'Respuesta en el foro', msg: 'El Prof. García respondió a tu pregunta sobre interfaces vs clases abstractas.', leida: false, enlace: null },
            { dest: ALU_DANIEL, titulo: 'Nuevo foro creado', msg: 'Se creó un nuevo foro "Errores Comunes" en Desarrollo Web Full Stack.', leida: true, enlace: null },
            { dest: ALU_CAMILA, titulo: 'Asesoría confirmada', msg: 'Tu asesoría sobre error en deployment ha sido confirmada.', leida: true, enlace: null },
            { dest: ALU_MARTIN, titulo: 'Respuesta a tu consulta SQL', msg: 'La Prof. Navarro respondió a tu duda sobre JOINs de 5 tablas.', leida: false, enlace: null },
            { dest: ALU_FERNANDO, titulo: 'Evaluación calificada', msg: 'Tu nota de "Sprint 1 - Frontend" ha sido publicada.', leida: false, enlace: null },
            { dest: ALU_ISABELLA, titulo: 'Grupo de trabajo asignado', msg: 'Has sido asignada al grupo "Java Masters" en POO.', leida: true, enlace: null },
            { dest: ALU_RODRIGO, titulo: 'Incidencia recibida', msg: 'Tu ticket "Problema de acceso a recursos" ha sido registrado. Pronto recibirás respuesta.', leida: false, enlace: null },
            // Notificaciones para docentes
            { dest: DOC_ROBERTO, titulo: 'Nueva asesoría solicitada', msg: 'Rodrigo Paredes solicita una asesoría sobre carta de recomendación.', leida: false, enlace: null },
            { dest: DOC_ROBERTO, titulo: 'Entrega recibida', msg: 'Alejandro López entregó su "Práctica Calificada 1" en POO.', leida: true, enlace: null },
            { dest: DOC_PATRICIA, titulo: 'Nueva asesoría pendiente', msg: 'Natalia Delgado solicita validación de su diagrama ER.', leida: false, enlace: null },
            { dest: DOC_PATRICIA, titulo: 'Incidencia reportada', msg: 'Se ha reportado que el reporte CSV de notas sale vacío.', leida: false, enlace: null },
            // Notificaciones para admin
            { dest: ADMIN, titulo: '6 incidencias pendientes', msg: 'Hay 6 incidencias de soporte pendientes de resolución.', leida: false, enlace: null },
            { dest: ADMIN, titulo: 'Nuevo usuario registrado', msg: 'Kevin Rivera se ha registrado en el sistema pero aún no tiene matrícula.', leida: false, enlace: null },
        ];

        for (const n of notifData) {
            await client.query(
                `INSERT INTO NOTIFICACION (ID_USUARIO_DESTINO, TITULO, MENSAJE, LEIDA, ENLACE_OPCIONAL)
                 VALUES ($1, $2, $3, $4, $5)`,
                [n.dest, n.titulo, n.msg, n.leida, n.enlace]
            );
        }
        console.log(`   ✓ ${notifData.length} notificaciones`);

        // ============================================================
        // 21. BITÁCORA DE ADMINISTRADOR
        // ============================================================
        console.log('📋 Insertando Bitácora de Admin...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS BITACORA_ADMIN (
                ID_BITACORA SERIAL PRIMARY KEY,
                ID_USUARIO INT REFERENCES USUARIO(ID_USUARIO),
                ACCION VARCHAR(255),
                DETALLE TEXT,
                ESTADO VARCHAR(50),
                BADGE VARCHAR(50),
                FECHA TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const logsData = [
            { usuario: ADMIN, accion: 'Creación de usuario', detalle: 'Se creó el usuario Roberto García (rgarcia@edu.pe) con rol Docente Principal', estado: 'exitoso', badge: 'Usuarios' },
            { usuario: ADMIN, accion: 'Creación de curso', detalle: 'Se creó el curso CS201 - Programación Orientada a Objetos', estado: 'exitoso', badge: 'Cursos' },
            { usuario: ADMIN, accion: 'Matriculación masiva', detalle: 'Se matricularon 6 alumnos en POO Sección A', estado: 'exitoso', badge: 'Matrículas' },
            { usuario: ADMIN, accion: 'Resolución de incidencia', detalle: 'Se resolvió la incidencia "Mi contraseña no funciona" de Valentina Herrera', estado: 'exitoso', badge: 'Soporte' },
            { usuario: ADMIN, accion: 'Actualización de configuración', detalle: 'Se actualizó el nombre de la institución a "VirtuClass Academy"', estado: 'exitoso', badge: 'Configuración' },
            { usuario: ADMIN, accion: 'Desactivación de usuario', detalle: 'Se desactivó la cuenta de José Reyes por inactividad prolongada', estado: 'exitoso', badge: 'Usuarios' },
            { usuario: ADMIN, accion: 'Publicación de anuncio', detalle: 'Se publicó el anuncio "Feriado por Fiestas Patrias" con nivel urgente', estado: 'exitoso', badge: 'Anuncios' },
            { usuario: ADMIN, accion: 'Generación de reporte', detalle: 'Se generó reporte CSV de matrículas (período 2026-I)', estado: 'exitoso', badge: 'Reportes' },
            { usuario: ADMIN, accion: 'Asignación de docente', detalle: 'Se asignó a Julio Morales como docente de Seguridad Informática Sec A', estado: 'exitoso', badge: 'Clases' },
            { usuario: ADMIN, accion: 'Cambio de estado de matrícula', detalle: 'Se cambió a RETIRADO la matrícula de Andrea Soto en POO Sección A', estado: 'exitoso', badge: 'Matrículas' },
        ];

        for (const l of logsData) {
            await client.query(
                `INSERT INTO BITACORA_ADMIN (ID_USUARIO, ACCION, DETALLE, ESTADO, BADGE)
                 VALUES ($1, $2, $3, $4, $5)`,
                [l.usuario, l.accion, l.detalle, l.estado, l.badge]
            );
        }
        console.log(`   ✓ ${logsData.length} entradas de bitácora`);

        // ============================================================
        // 22. CONFIGURACIÓN GLOBAL
        // ============================================================
        console.log('⚙️  Actualizando Configuración Global...');
        await client.query(`
            INSERT INTO CONFIGURACION_GLOBAL (CLAVE, VALOR) VALUES
            ('institucion_nombre', 'VirtuClass Academy'),
            ('institucion_descripcion', 'Plataforma de educación virtual para la gestión académica integral'),
            ('institucion_correo', 'soporte@virtuclass.edu.pe'),
            ('institucion_telefono', '(01) 555-0100'),
            ('institucion_direccion', 'Av. Universitaria 1234, Lima, Perú'),
            ('periodo_activo', '2026-I'),
            ('mantenimiento', 'false'),
            ('auto_matricula', 'true')
            ON CONFLICT (CLAVE) DO UPDATE SET VALOR = EXCLUDED.VALOR;
        `);
        console.log('   ✓ Configuración actualizada');

        // ============================================================
        // COMMIT
        // ============================================================
        await client.query('COMMIT');

        console.log('\n╔══════════════════════════════════════════════════════╗');
        console.log('║   ✅ DATOS DE PRUEBA INSERTADOS CORRECTAMENTE       ║');
        console.log('╠══════════════════════════════════════════════════════╣');
        console.log('║                                                      ║');
        console.log('║  🔑 Contraseña para TODOS los usuarios: test123      ║');
        console.log('║                                                      ║');
        console.log('║  👤 Admin:    admin@virtualclass.com                  ║');
        console.log('║  👨‍🏫 Docentes: rgarcia@edu.pe, pnavarro@edu.pe       ║');
        console.log('║               jmorales@edu.pe, svelasquez@edu.pe     ║');
        console.log('║  👨‍🎓 Alumnos:  alopez@est.edu.pe, vherrera@est.edu.pe║');
        console.log('║               dquispe@est.edu.pe, cmontes@est.edu.pe ║');
        console.log('║               + 8 alumnos más (ver script)           ║');
        console.log('║                                                      ║');
        console.log('║  ⚠️  Kevin Rivera (krivera@est.edu.pe):              ║');
        console.log('║     Activo SIN matrícula (caso de prueba)            ║');
        console.log('║  ⚠️  José Reyes (jreyes@est.edu.pe):                ║');
        console.log('║     Cuenta INACTIVA (caso de prueba)                 ║');
        console.log('║  ⚠️  Andrea Soto: RETIRADA de POO-A                 ║');
        console.log('║  ⚠️  Rodrigo Paredes: FINALIZADO en Ing. Software   ║');
        console.log('║                                                      ║');
        console.log('╚══════════════════════════════════════════════════════╝\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERROR - Se hizo ROLLBACK:', error);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
