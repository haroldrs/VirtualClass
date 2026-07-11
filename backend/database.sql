
CREATE TABLE USUARIO (
    ID_USUARIO SERIAL PRIMARY KEY,
    NOMBRES VARCHAR (100) NOT NULL,
    APELLIDOS VARCHAR (100) NOT NULL,
    CORREO VARCHAR (100) UNIQUE NOT NULL,
    CONTRASENA VARCHAR (100) NOT NULL,
    TELEFONO VARCHAR (20),
    ESTADO VARCHAR(20) DEFAULT 'Activo' CHECK (ESTADO IN ('Activo', 'Inactivo')),
    FECHA_REGISTRO TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ROL (
    ID_ROL SERIAL PRIMARY KEY,
    NOMBRE_ROL VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE USUARIO_ROL (
    ID_USUARIO INT,
    ID_ROL INT,
    PRIMARY KEY (ID_USUARIO, ID_ROL),
    FOREIGN KEY (ID_USUARIO) REFERENCES USUARIO(ID_USUARIO),
    FOREIGN KEY (ID_ROL) REFERENCES ROL(ID_ROL)
);

CREATE TABLE CURSO (
    ID_CURSO SERIAL PRIMARY KEY,
    CODIGO VARCHAR(50) UNIQUE NOT NULL,
    NOMBRE VARCHAR(100) NOT NULL,
    DESCRIPCION TEXT NULL,
    CREDITOS INT
);

CREATE TABLE CLASE (
    ID_CLASE SERIAL PRIMARY KEY,
    ID_CURSO INT NOT NULL,
    NOMBRE_CLASE VARCHAR(100),
    PERIODO VARCHAR(20),
    CICLO VARCHAR(20),
    SECCION VARCHAR(20),
    AULA VARCHAR(20),
    FECHA_INICIO DATE,
    FECHA_FIN DATE,
    ENLACE_VIDEO VARCHAR(255),
    ENLACE_WHATSAPP VARCHAR(255),
    FOREIGN KEY (ID_CURSO) REFERENCES CURSO(ID_CURSO)
);

CREATE TABLE CLASE_DOCENTE (
    ID_CLASE INT NOT NULL,
    ID_USUARIO INT NOT NULL,
    FOREIGN KEY (ID_CLASE) REFERENCES CLASE(ID_CLASE),
    FOREIGN KEY (ID_USUARIO) REFERENCES USUARIO(ID_USUARIO)
);

CREATE TABLE MATRICULA (
    ID_MATRICULA SERIAL PRIMARY KEY,
    ID_CLASE INT NOT NULL,
    ID_USUARIO INT NOT NULL,
    FECHA_MATRICULA TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ESTADO_MATRICULA VARCHAR(20) DEFAULT 'ACTIVO' CHECK (ESTADO_MATRICULA IN ('ACTIVO','RETIRADO','FINALIZADO')),
    FOREIGN KEY (ID_USUARIO) REFERENCES USUARIO(ID_USUARIO),
    FOREIGN KEY (ID_CLASE) REFERENCES CLASE(ID_CLASE)
);

CREATE TABLE UNIDAD (
    ID_UNIDAD SERIAL PRIMARY KEY,
    ID_CLASE INT NOT NULL,
    TITULO VARCHAR(100) NOT NULL,
    NUMERO INT DEFAULT 1,
    FOREIGN KEY (ID_CLASE) REFERENCES CLASE(ID_CLASE)
);

CREATE TABLE MODULO_CLASE (
    ID_MODULO SERIAL PRIMARY KEY,
    ID_CLASE INT NOT NULL,
    ID_UNIDAD INT,
    TITULO VARCHAR(100) NOT NULL,
    DESCRIPCION TEXT,
    ORDEN INT DEFAULT 0,
    FOREIGN KEY (ID_CLASE) REFERENCES CLASE(ID_CLASE),
    FOREIGN KEY (ID_UNIDAD) REFERENCES UNIDAD(ID_UNIDAD)
);
CREATE TABLE RECURSOS(
    ID_RECURSO SERIAL PRIMARY KEY,
    ID_CLASE INT NOT NULL,
    TITULO VARCHAR(100),
    DESCRIPCION TEXT,
    TIPO_RECURSO VARCHAR(20) CHECK (TIPO_RECURSO IN ('pdf','video','documento','link','imagen','otro')),
    URL_ARCHIVO VARCHAR(255),
    FECHA_PUBLICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ID_MODULO INT,
    FOREIGN KEY (ID_CLASE) REFERENCES CLASE(ID_CLASE),
    FOREIGN KEY (ID_MODULO) REFERENCES MODULO_CLASE(ID_MODULO)
);

CREATE TABLE EVALUACION (
    ID_EVALUACION SERIAL PRIMARY KEY,
    ID_CLASE INT NOT NULL,
    NOMBRE_EVA VARCHAR(100) NOT NULL,
    PORCENTAJE DECIMAL(5,2) NOT NULL,
    FECHA_EVALUACION DATE NOT NULL,
    ID_MODULO INT,
    FOREIGN KEY(ID_CLASE) REFERENCES CLASE(ID_CLASE),
    FOREIGN KEY (ID_MODULO) REFERENCES MODULO_CLASE(ID_MODULO)
);

CREATE TABLE ENTREGA_EVALUACION (
    ID_ENTREGA SERIAL PRIMARY KEY,
    ID_EVALUACION INT NOT NULL,
    ID_USUARIO INT NOT NULL,
    ARCHIVO_URL VARCHAR(255),
    FECHA_ENTREGA TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_EVALUACION) REFERENCES EVALUACION(ID_EVALUACION),
    FOREIGN KEY (ID_USUARIO) REFERENCES USUARIO(ID_USUARIO)
);

CREATE TABLE NOTA(
    ID_NOTA SERIAL PRIMARY KEY,
    ID_EVALUACION INT NOT NULL,
    ID_USUARIO INT NOT NULL,
    CALIFICACION DECIMAL(5,2),
    COMENTARIO TEXT,
    FECHA_REGISTRO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ID_EVALUACION) REFERENCES EVALUACION(ID_EVALUACION),
    FOREIGN KEY(ID_USUARIO) REFERENCES USUARIO(ID_USUARIO)
);

CREATE TABLE GRUPO(
    ID_GRUPO SERIAL PRIMARY KEY,
    ID_CLASE INT NOT NULL,
    NOMBRE_GRUPO VARCHAR(100),
    FECHA_CREACION TIMESTAMP,
    FOREIGN KEY(ID_CLASE) REFERENCES CLASE(ID_CLASE)
);

CREATE TABLE GRUPO_ESTUDIANTE (
    ID_GRUPO INT,
    ID_USUARIO INT,
    PRIMARY KEY (ID_GRUPO,ID_USUARIO),
    FOREIGN KEY (ID_GRUPO) REFERENCES GRUPO (ID_GRUPO),
    FOREIGN KEY (ID_USUARIO) REFERENCES USUARIO (ID_USUARIO)
);

CREATE TABLE CALENDARIO_ACADEMICO(
    ID_EVENTO SERIAL PRIMARY KEY,
    ID_CLASE INT NOT NULL,
    TITULO_EVENTO VARCHAR(100) NOT NULL,
    DESCRIPCION TEXT NULL,
    FECHA_INICIO TIMESTAMP NOT NULL,
    FECHA_FIN TIMESTAMP NOT NULL,
    TIPO_EVENTO VARCHAR(20) CHECK (TIPO_EVENTO IN ('examen','feriado','entrega','reunion','otro')),
    FOREIGN KEY (ID_CLASE) REFERENCES CLASE(ID_CLASE)
);

CREATE TABLE SESION_CLASE(
    ID_SESION SERIAL PRIMARY KEY,
    ID_CLASE INT NOT NULL,
    TEMA VARCHAR(150),
    DESCRIPCION TEXT,
    FECHA DATE,
    HORA_INICIO TIME,
    HORA_FIN TIME,
    ID_MODULO INT,
    FOREIGN KEY(ID_CLASE) REFERENCES CLASE(ID_CLASE),
    FOREIGN KEY (ID_MODULO) REFERENCES MODULO_CLASE(ID_MODULO)
);

CREATE TABLE ASISTENCIA (
    ID_ASISTENCIA SERIAL PRIMARY KEY,
    ID_SESION INT NOT NULL,
    ID_USUARIO INT NOT NULL,
    FECHA DATE,
    ESTADO VARCHAR(20) CHECK (ESTADO IN ('presente','ausente','tardanza')),
    FOREIGN KEY(ID_SESION) REFERENCES SESION_CLASE(ID_SESION),
    FOREIGN KEY(ID_USUARIO) REFERENCES USUARIO(ID_USUARIO)
);

CREATE TABLE ASESORIA(
    ID_ASESORIA SERIAL PRIMARY KEY,
    ID_DOCENTE INT,
    ID_SOLICITANTE INT,
    ID_GRUPO INT,
    MOTIVO VARCHAR(150),
    DESCRIPCION TEXT,
    FECHA_HORA TIMESTAMP,
    ENLACE_REUNION VARCHAR(255),
    ESTADO VARCHAR(20) DEFAULT 'pendiente' CHECK (ESTADO IN ('pendiente','confirmada','rechazada')),
    FOREIGN KEY(ID_DOCENTE) REFERENCES USUARIO(ID_USUARIO),
    FOREIGN KEY(ID_SOLICITANTE) REFERENCES USUARIO(ID_USUARIO),
    FOREIGN KEY(ID_GRUPO) REFERENCES GRUPO(ID_GRUPO)
);

CREATE TABLE PARTICIPANTE_ASESORIA(
    ID_ASESORIA INT,
    ID_USUARIO INT,
    PRIMARY KEY(ID_ASESORIA, ID_USUARIO),
    FOREIGN KEY(ID_ASESORIA) REFERENCES ASESORIA(ID_ASESORIA),
    FOREIGN KEY(ID_USUARIO) REFERENCES USUARIO(ID_USUARIO)
);

CREATE TABLE FORO(
    ID_FORO SERIAL PRIMARY KEY,
    ID_CLASE INT NOT NULL,
    TITULO_FORO VARCHAR(100),
    DESCRIPCION TEXT,
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ID_CLASE) REFERENCES CLASE(ID_CLASE)
);

CREATE TABLE TEMA_FORO(
    ID_TEMA SERIAL PRIMARY KEY,
    ID_FORO INT NOT NULL,
    ID_USUARIO INT NOT NULL,
    TITULO_TEMA VARCHAR(100),
    MENSAJE_INICIAL TEXT,
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ID_FORO) REFERENCES FORO(ID_FORO),
    FOREIGN KEY(ID_USUARIO) REFERENCES USUARIO(ID_USUARIO)
);

CREATE TABLE RESPUESTA_FORO(
    ID_RESPUESTA SERIAL PRIMARY KEY,
    ID_TEMA INT NOT NULL,
    ID_USUARIO INT NOT NULL,
    CONTENIDO TEXT,
    FECHA_RESPUESTA TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ID_TEMA) REFERENCES TEMA_FORO(ID_TEMA),
    FOREIGN KEY(ID_USUARIO) REFERENCES USUARIO(ID_USUARIO)
);

/* --------------------------------------------------------
   1. USUARIO (10 usuarios: 3 docentes, 7 alumnos)
-------------------------------------------------------- */
INSERT INTO USUARIO (NOMBRES, APELLIDOS, CORREO, CONTRASENA, TELEFONO, ESTADO) VALUES
('Carlos', 'Mendoza', 'cmendoza@edu.com', 'hash123', '987654321', 'Activo'),
('Lucia', 'Fernandez', 'lfernandez@edu.com', 'hash123', '987654322', 'Activo'),
('Miguel', 'Torres', 'mtorres@edu.com', 'hash123', '987654323', 'Activo'),
('Ana', 'Gomez', 'agomez@edu.com', 'hash123', '987654324', 'Activo'),
('Luis', 'Perez', 'lperez@edu.com', 'hash123', '987654325', 'Activo'),
('Maria', 'Vargas', 'mvargas@edu.com', 'hash123', '987654326', 'Activo'),
('Jorge', 'Salas', 'jsalas@edu.com', 'hash123', '987654327', 'Activo'),
('Elena', 'Rojas', 'erojas@edu.com', 'hash123', '987654328', 'Activo'),
('Diego', 'Castro', 'dcastro@edu.com', 'hash123', '987654329', 'Activo'),
('Carla', 'Ruiz', 'cruiz@edu.com', 'hash123', '987654330', 'Activo');

/* --------------------------------------------------------
   2. ROL (10 perfiles para cumplir el requerimiento)
-------------------------------------------------------- */
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
('Auditor');

/* --------------------------------------------------------
   3. USUARIO_ROL (Asignando roles a los 10 usuarios)
-------------------------------------------------------- */
INSERT INTO USUARIO_ROL (ID_USUARIO, ID_ROL) VALUES
(1, 1), (2, 1), (3, 2), 
(4, 3), (5, 3), (6, 3), (7, 4), (8, 3), (9, 4), (10, 3);

/* --------------------------------------------------------
   4. CURSO (10 materias)
-------------------------------------------------------- */
INSERT INTO CURSO (CODIGO, NOMBRE, DESCRIPCION, CREDITOS) VALUES
('INF101', 'Programacion Basica', 'Introduccion a la logica de programacion', 4),
('INF102', 'Base de Datos', 'Modelado y SQL', 4),
('INF103', 'Desarrollo Web', 'HTML, CSS y JS', 3),
('INF104', 'Ingenieria de Software', 'Metodologias agiles y cascada', 4),
('MAT201', 'Calculo I', 'Limites y derivadas', 5),
('MAT202', 'Estadistica', 'Probabilidad y distribuciones', 3),
('RED301', 'Redes de Computadoras', 'Modelo OSI y TCP/IP', 4),
('SIS401', 'Sistemas Operativos', 'Gestion de memoria y procesos', 4),
('SEG501', 'Seguridad Informatica', 'Criptografia y vulnerabilidades', 3),
('GES601', 'Gestion de Proyectos', 'PMBOK y Scrum', 3);

/* --------------------------------------------------------
   5. CLASE (10 instancias de los cursos)
-------------------------------------------------------- */
INSERT INTO CLASE (ID_CURSO, NOMBRE_CLASE, PERIODO, CICLO, SECCION, AULA, FECHA_INICIO, FECHA_FIN) VALUES
(1, 'Prog. Basica - Sec A', '2026-I', 'I', 'A', 'Aula 101', '2026-03-01', '2026-07-15'),
(2, 'Base de Datos - Sec A', '2026-I', 'III', 'A', 'Lab 1', '2026-03-01', '2026-07-15'),
(3, 'Desarrollo Web - Sec B', '2026-I', 'IV', 'B', 'Lab 2', '2026-03-01', '2026-07-15'),
(4, 'Ing. Software - Sec A', '2026-I', 'V', 'A', 'Aula 202', '2026-03-01', '2026-07-15'),
(5, 'Calculo I - Sec C', '2026-I', 'I', 'C', 'Aula 105', '2026-03-01', '2026-07-15'),
(6, 'Estadistica - Sec A', '2026-I', 'III', 'A', 'Aula 106', '2026-03-01', '2026-07-15'),
(7, 'Redes - Sec A', '2026-I', 'VI', 'A', 'Lab 3', '2026-03-01', '2026-07-15'),
(8, 'Sistemas Op. - Sec B', '2026-I', 'VI', 'B', 'Lab 4', '2026-03-01', '2026-07-15'),
(9, 'Seguridad - Sec A', '2026-I', 'VII', 'A', 'Lab 5', '2026-03-01', '2026-07-15'),
(10, 'Proyectos - Sec A', '2026-I', 'VIII', 'A', 'Aula 301', '2026-03-01', '2026-07-15');

/* --------------------------------------------------------
   6. CLASE_DOCENTE 
-------------------------------------------------------- */
INSERT INTO CLASE_DOCENTE (ID_CLASE, ID_USUARIO) VALUES
(1, 1), (2, 2), (3, 3), (4, 1), (5, 2),
(6, 3), (7, 1), (8, 2), (9, 3), (10, 1);

/* --------------------------------------------------------
   7. MATRICULA
-------------------------------------------------------- */
INSERT INTO MATRICULA (ID_CLASE, ID_USUARIO, ESTADO_MATRICULA) VALUES
(1, 4, 'ACTIVO'), (1, 5, 'ACTIVO'), (2, 6, 'ACTIVO'), (2, 7, 'ACTIVO'),
(3, 8, 'ACTIVO'), (4, 9, 'ACTIVO'), (4, 10, 'ACTIVO'), (5, 4, 'ACTIVO'),
(6, 5, 'RETIRADO'), (7, 6, 'ACTIVO');

/* --------------------------------------------------------
   8. RECURSOS
-------------------------------------------------------- */
INSERT INTO RECURSOS (ID_CLASE, TITULO, DESCRIPCION, TIPO_RECURSO, URL_ARCHIVO) VALUES
(1, 'Silabo del curso', 'Documento general', 'pdf', 'url/silabo1.pdf'),
(2, 'Modelo Relacional', 'Diapositivas sem 1', 'documento', 'url/clase1.pptx'),
(3, 'Tutorial HTML', 'Video introductorio', 'video', 'url/video_html.mp4'),
(4, 'Manifiesto Agil', 'Lectura obligatoria', 'link', 'url/manifiesto.com'),
(5, 'Tabla de Derivadas', 'Formulario', 'pdf', 'url/derivadas.pdf'),
(6, 'Dataset de prueba', 'Excel para practica', 'otro', 'url/datos.xlsx'),
(7, 'Topologia de red', 'Diagrama Packet Tracer', 'imagen', 'url/topologia.png'),
(8, 'Instalacion Linux', 'Guia paso a paso', 'documento', 'url/guia_linux.pdf'),
(9, 'OWASP Top 10', 'Reporte de vulnerabilidades', 'pdf', 'url/owasp.pdf'),
(10, 'Plantilla Scrum', 'Tablero en Excel', 'documento', 'url/plantilla.xlsx');

/* --------------------------------------------------------
   9. EVALUACION 
-------------------------------------------------------- */
INSERT INTO EVALUACION (ID_CLASE, NOMBRE_EVA, PORCENTAJE, FECHA_EVALUACION) VALUES
(1, 'Practica 1', 15.00, '2026-04-10'),
(2, 'Examen Parcial', 30.00, '2026-05-15'),
(3, 'Proyecto Web', 40.00, '2026-07-01'),
(4, 'Ensayo Scrum', 20.00, '2026-04-20'),
(5, 'Examen Final', 30.00, '2026-07-10'),
(6, 'Cuestionario 1', 10.00, '2026-04-05'),
(7, 'Laboratorio 1', 15.00, '2026-04-25'),
(8, 'Practica SO', 20.00, '2026-05-20'),
(9, 'Auditoria Web', 25.00, '2026-06-15'),
(10, 'Sustentacion', 30.00, '2026-07-05');

/* --------------------------------------------------------
   10. ENTREGA_EVALUACION 
-------------------------------------------------------- */
INSERT INTO ENTREGA_EVALUACION (ID_EVALUACION, ID_USUARIO, ARCHIVO_URL) VALUES
(1, 4, 'url/tarea_ana.pdf'),
(1, 5, 'url/tarea_luis.pdf'),
(2, 6, 'url/parcial_maria.pdf'),
(2, 7, 'url/parcial_jorge.pdf'),
(3, 8, 'url/proyecto_elena.zip'),
(4, 9, 'url/ensayo_diego.pdf'),
(4, 10, 'url/ensayo_carla.pdf'),
(5, 4, 'url/final_ana.pdf'),
(7, 6, 'url/lab_maria.pkt'),
(8, 8, 'url/practica_elena.sh');

/* --------------------------------------------------------
   11. NOTA 
-------------------------------------------------------- */
INSERT INTO NOTA (ID_EVALUACION, ID_USUARIO, CALIFICACION, COMENTARIO) VALUES
(1, 4, 18.50, 'Excelente trabajo'),
(1, 5, 14.00, 'Falto explicar el codigo'),
(2, 6, 16.00, 'Buen modelado relacional'),
(2, 7, 10.50, 'Revisar normalizacion'),
(3, 8, 19.00, 'Diseño responsivo perfecto'),
(4, 9, 15.00, 'Buenos argumentos'),
(4, 10, 17.00, 'Excelente conclusion'),
(5, 4, 16.50, 'Aprobado'),
(7, 6, 18.00, 'Topologia correcta'),
(8, 8, 13.00, 'Comandos incompletos');

/* --------------------------------------------------------
   12. GRUPOS
-------------------------------------------------------- */
INSERT INTO GRUPO (ID_CLASE, NOMBRE_GRUPO, FECHA_CREACION) VALUES
(1, 'Los Programadores', '2026-03-10 10:00:00'),
(2, 'DBA Masters', '2026-03-12 11:00:00'),
(3, 'Frontend Team', '2026-03-15 09:00:00'),
(4, 'Agile Squad', '2026-03-18 14:00:00'),
(5, 'Matematicos', '2026-03-20 15:00:00'),
(6, 'Estadisticos', '2026-03-22 16:00:00'),
(7, 'Cisco Group', '2026-03-25 10:30:00'),
(8, 'Linuxeros', '2026-03-26 12:00:00'),
(9, 'Hackers Eticos', '2026-03-28 08:00:00'),
(10, 'PMO Team', '2026-03-30 09:30:00');

/* --------------------------------------------------------
   13. GRUPO_ESTUDIANTE 
-------------------------------------------------------- */
INSERT INTO GRUPO_ESTUDIANTE (ID_GRUPO, ID_USUARIO) VALUES
(1, 4), (1, 5), 
(2, 6), (2, 7), 
(3, 8), 
(4, 9), (4, 10), 
(5, 4), 
(7, 6), 
(8, 8);

/* --------------------------------------------------------
   14. CALENDARIO_ACADEMICO 
-------------------------------------------------------- */
INSERT INTO CALENDARIO_ACADEMICO (ID_CLASE, TITULO_EVENTO, DESCRIPCION, FECHA_INICIO, FECHA_FIN, TIPO_EVENTO) VALUES
(1, 'Simulacro Examen', 'Preparacion', '2026-04-01 10:00:00', '2026-04-01 12:00:00', 'examen'),
(2, 'Feriado Nacional', 'Semana Santa', '2026-04-15 00:00:00', '2026-04-16 23:59:59', 'feriado'),
(3, 'Entrega Avance Web', 'Subir a GitHub', '2026-05-01 08:00:00', '2026-05-01 23:59:00', 'entrega'),
(4, 'Reunion Grupal Scrum', 'Daily Standup', '2026-04-10 14:00:00', '2026-04-10 14:30:00', 'reunion'),
(5, 'Charla de Calculo', 'Invitado especial', '2026-05-10 10:00:00', '2026-05-10 12:00:00', 'otro'),
(6, 'Taller SPSS', 'Practica extra', '2026-06-05 16:00:00', '2026-06-05 18:00:00', 'otro'),
(7, 'Examen Certificacion', 'CNA', '2026-07-01 09:00:00', '2026-07-01 13:00:00', 'examen'),
(8, 'Instalacion Masiva', 'Lab 4', '2026-04-20 14:00:00', '2026-04-20 18:00:00', 'reunion'),
(9, 'Torneo CTF', 'Capture the flag', '2026-06-20 08:00:00', '2026-06-21 18:00:00', 'otro'),
(10, 'Presentacion Final', 'Frente a jurado', '2026-07-10 09:00:00', '2026-07-10 12:00:00', 'entrega');

/* --------------------------------------------------------
   15. SESION_CLASE
-------------------------------------------------------- */
INSERT INTO SESION_CLASE (ID_CLASE, TEMA, DESCRIPCION, FECHA, HORA_INICIO, HORA_FIN) VALUES
(1, 'Variables y Tipos', 'Clase intro', '2026-03-05', '08:00:00', '10:00:00'),
(1, 'Estructuras de Control', 'If, Else, Switch', '2026-03-12', '08:00:00', '10:00:00'),
(2, 'Modelo ER', 'Entidades y Atributos', '2026-03-06', '10:00:00', '12:00:00'),
(3, 'Etiquetas HTML5', 'Estructura basica', '2026-03-07', '14:00:00', '16:00:00'),
(4, 'Que es la agilidad?', 'Valores y principios', '2026-03-08', '16:00:00', '18:00:00'),
(5, 'Limites Infinitos', 'Teoremas', '2026-03-09', '08:00:00', '10:00:00'),
(6, 'Media y Moda', 'Medidas de tendencia', '2026-03-10', '10:00:00', '12:00:00'),
(7, 'Capa Fisica', 'Medios guiados', '2026-03-11', '14:00:00', '16:00:00'),
(8, 'Kernel de Linux', 'Arquitectura', '2026-03-12', '16:00:00', '18:00:00'),
(9, 'SQL Injection', 'Prevencion', '2026-03-13', '18:00:00', '20:00:00');

/* --------------------------------------------------------
   16. ASISTENCIA 
-------------------------------------------------------- */
INSERT INTO ASISTENCIA (ID_SESION, ID_USUARIO, FECHA, ESTADO) VALUES
(1, 4, '2026-03-05', 'presente'),
(1, 5, '2026-03-05', 'tardanza'),
(2, 4, '2026-03-12', 'presente'),
(2, 5, '2026-03-12', 'ausente'),
(3, 6, '2026-03-06', 'presente'),
(3, 7, '2026-03-06', 'presente'),
(4, 8, '2026-03-07', 'presente'),
(5, 9, '2026-03-08', 'tardanza'),
(5, 10, '2026-03-08', 'presente'),
(6, 4, '2026-03-09', 'presente');

/* --------------------------------------------------------
   17. ASESORIA 
-------------------------------------------------------- */
INSERT INTO ASESORIA (ID_DOCENTE, ID_SOLICITANTE, ID_GRUPO, MOTIVO, DESCRIPCION, FECHA_HORA, ENLACE_REUNION, ESTADO) VALUES
(1, 4, 1, 'Ayuda con bucles', 'No entiendo el ciclo For', '2026-03-20 15:00:00', 'zoom.us/j/123', 'confirmada'),
(2, 6, 2, 'Duda de Normalizacion', 'Tercera forma normal', '2026-03-21 16:00:00', 'zoom.us/j/124', 'confirmada'),
(3, 8, 3, 'Error en CSS', 'Flexbox no funciona', '2026-03-22 17:00:00', 'zoom.us/j/125', 'pendiente'),
(1, 9, 4, 'Roles de Scrum', 'Duda sobre el Product Owner', '2026-03-23 18:00:00', 'zoom.us/j/126', 'confirmada'),
(2, 4, NULL, 'Reclamo de nota', 'Revision de examen', '2026-03-24 19:00:00', 'zoom.us/j/127', 'rechazada'),
(3, 5, NULL, 'Asesoria Estadistica', 'Distribucion Normal', '2026-03-25 10:00:00', 'zoom.us/j/128', 'pendiente'),
(1, 6, 7, 'Configuracion Router', 'Packet Tracer error', '2026-03-26 11:00:00', 'zoom.us/j/129', 'confirmada'),
(2, 8, 8, 'Permisos Linux', 'Chmod no aplica', '2026-03-27 12:00:00', 'zoom.us/j/130', 'confirmada'),
(3, 7, NULL, 'XSS vulnerabilidad', 'Como parchar el input', '2026-03-28 14:00:00', 'zoom.us/j/131', 'pendiente'),
(1, 10, NULL, 'Alcance del proyecto', 'Aprobacion de tema', '2026-03-29 15:00:00', 'zoom.us/j/132', 'confirmada');

/* --------------------------------------------------------
   18. PARTICIPANTE_ASESORIA 
-------------------------------------------------------- */
INSERT INTO PARTICIPANTE_ASESORIA (ID_ASESORIA, ID_USUARIO) VALUES
(1, 4), (1, 5), 
(2, 6), (2, 7), 
(3, 8), 
(4, 9), (4, 10), 
(5, 4), 
(7, 6), 
(8, 8);

/* --------------------------------------------------------
   19. FORO 
-------------------------------------------------------- */
INSERT INTO FORO (ID_CLASE, TITULO_FORO, DESCRIPCION) VALUES
(1, 'Dudas Generales - Prog', 'Posteen sus errores de codigo aqui'),
(2, 'Consultas de Modelado', 'Preguntas sobre llaves foraneas'),
(3, 'Foro HTML/CSS', 'Comparte tus diseños'),
(4, 'Debate Agilidad', 'Scrum vs Kanban'),
(5, 'Problemas de Calculo', 'Resolucion de ejercicios'),
(6, 'Dudas de Probabilidad', 'Casos practicos'),
(7, 'Cisco Packet Tracer', 'Errores de conexion'),
(8, 'Comandos Bash', 'Scripts utiles de Linux'),
(9, 'Noticias de Ciberseguridad', 'Hacks recientes'),
(10, 'Casos de Fracaso', 'Debate sobre NHS y Queensland');

/* --------------------------------------------------------
   20. TEMA_FORO
-------------------------------------------------------- */
INSERT INTO TEMA_FORO (ID_FORO, ID_USUARIO, TITULO_TEMA, MENSAJE_INICIAL) VALUES
(1, 4, 'Me sale SyntaxError', 'Estoy tratando de compilar y me sale error en la linea 5.'),
(2, 6, 'Relacion N a N', 'Como rompo una relacion de muchos a muchos en SQL?'),
(3, 8, 'Centrar un Div', 'Llevo 3 horas tratando de centrar un texto, ayuda.'),
(4, 9, 'El Daily Scrum', 'Es obligatorio que dure 15 minutos exactos?'),
(5, 4, 'Limite infinito', 'No entiendo como factorizar el ejercicio 3.'),
(6, 5, 'Campana de Gauss', 'Alguien tiene la tabla de valores de Z?'),
(7, 6, 'Ping no llega', 'Hago ping al router 2 y me da Time Out.'),
(8, 8, 'Error de Sudo', 'Me dice que no estoy en el archivo sudoers.'),
(9, 7, 'Ransomware 2026', 'Vieron la noticia del ultimo ataque a hospitales?'),
(10, 10, 'El error de Excel en NHS', 'Increible que usaran XLS para una pandemia.');

/* --------------------------------------------------------
   21. RESPUESTA_FORO
-------------------------------------------------------- */
INSERT INTO RESPUESTA_FORO (ID_TEMA, ID_USUARIO, CONTENIDO) VALUES
(1, 1, 'Revisa que no te falte un punto y coma (;) al final de la linea 4.'),
(2, 2, 'Tienes que crear una tabla intermedia que almacene ambas llaves primarias.'),
(3, 3, 'Usa Flexbox: display: flex; justify-content: center; align-items: center;'),
(4, 1, 'No tiene que durar 15 exactos, pero es el tiempo limite (Timebox).'),
(5, 2, 'Multiplica por la conjugada arriba y abajo.'),
(6, 3, 'Te la mande al correo interno del campus.'),
(7, 1, 'Verifica que las interfaces esten encendidas (no shutdown).'),
(8, 2, 'Tienes que entrar como root usando su - para darte permisos.'),
(9, 3, 'Si, fue por no actualizar los parches de seguridad de Windows.'),
(10, 1, 'Fue una negligencia de analisis de requisitos y escalabilidad.');
