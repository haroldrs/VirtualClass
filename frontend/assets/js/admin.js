// --- INICIALIZACION Y LOGS ---
let globalUsuarios = []; // Para el filtro
let logsActividad = [
    { usr: 'Admin', act: 'Inicio de sesión exitoso', fecha: new Date(), estado: 'Completado', badge: 'bg-success' }
];

document.addEventListener('DOMContentLoaded', () => {
    cargarEstadisticas();
    cargarRoles();
    cargarConfiguracion();
    renderLogs();

    document.querySelector('a[href="#usuarios"]').addEventListener('click', cargarUsuarios);
    document.querySelector('a[href="#cursos"]').addEventListener('click', cargarCursos);
    document.querySelector('a[href="#matriculas"]').addEventListener('click', cargarDatosMatricula);

    // Quick Actions Mocks
    // El botón de Aviso Global ahora usa Bootstrap data-bs-toggle="modal"

    const btnRespaldo = document.querySelector('button.btn-outline-danger');
    if (btnRespaldo) btnRespaldo.onclick = () => {
        alert('Respaldo de BD iniciado. Se guardará un dump en S3.');
        agregarLog('Sistema', 'Backup BD Iniciado', 'En Proceso', 'bg-warning text-dark');
    };


    // Configuracion
    const btnConfig = document.querySelector('#configuracion button.btn-primary');
    if (btnConfig) btnConfig.onclick = async () => {
        const config = {
            institucion_nombre: document.getElementById('configInstitucion').value,
            institucion_descripcion: document.getElementById('configDescripcion')?.value || '',
            institucion_correo: document.getElementById('configCorreo')?.value || '',
            institucion_telefono: document.getElementById('configTelefono')?.value || '',
            institucion_direccion: document.getElementById('configDireccion')?.value || '',
            periodo_activo: document.getElementById('configPeriodo').value,
            mantenimiento: document.getElementById('mantenimiento').checked,
            auto_matricula: document.getElementById('autoMatricula').checked
        };
        try {
            const res = await fetch(`${getApiUrl()}/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                alert('Configuraciones globales guardadas correctamente.');
                agregarLog('Admin', 'Actualización de Configuración', 'Completado', 'bg-success');
                // Actualizar la vista local sin recargar (opcional)
                const brand = document.querySelector('.brand-text');
                if (brand) brand.textContent = config.institucion_nombre;
            } else {
                alert('Error al guardar la configuración');
            }
        } catch (e) { console.error(e); }
    };
});

function agregarLog(usr, act, estado, badge) {
    logsActividad.unshift({ usr, act, fecha: new Date(), estado, badge });
    if (logsActividad.length > 6) logsActividad.pop();
    renderLogs();
}

async function cargarConfiguracion() {
    try {
        const res = await fetch(`${getApiUrl()}/config`);
        const config = await res.json();

        const instInput = document.getElementById('configInstitucion');
        const descInput = document.getElementById('configDescripcion');
        const correoInput = document.getElementById('configCorreo');
        const telfInput = document.getElementById('configTelefono');
        const dirInput = document.getElementById('configDireccion');

        const perInput = document.getElementById('configPeriodo');
        const mantInput = document.getElementById('mantenimiento');
        const autoMatInput = document.getElementById('autoMatricula');

        if (instInput) instInput.value = config.institucion_nombre || '';
        if (descInput) descInput.value = config.institucion_descripcion || '';
        if (correoInput) correoInput.value = config.institucion_correo || '';
        if (telfInput) telfInput.value = config.institucion_telefono || '';
        if (dirInput) dirInput.value = config.institucion_direccion || '';

        if (perInput) perInput.value = config.periodo_activo || '';
        if (mantInput) mantInput.checked = config.mantenimiento === 'true';
        if (autoMatInput) autoMatInput.checked = config.auto_matricula === 'true';

        // Reflejar globalmente en esta pantalla de inmediato
        const brand = document.querySelector('.brand-text');
        if (brand && config.institucion_nombre) {
            brand.textContent = config.institucion_nombre;
        }
    } catch (e) { console.error('Error cargando config:', e); }
}

function renderLogs() {
    const tbody = document.getElementById('tbodyActividad');
    if (!tbody) return;
    tbody.innerHTML = '';
    logsActividad.forEach(log => {
        const timeStr = log.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        tbody.innerHTML += `<tr>
            <td>${log.usr}</td>
            <td>${log.act}</td>
            <td>Hoy, ${timeStr}</td>
            <td><span class="badge ${log.badge}">${log.estado}</span></td>
        </tr>`;
    });
}

const API_URL = '/api/admin'; // Ruta relativa para producción en render, en dev agregar http://localhost:3000 si se corre frontend separado. 
// PERO el usuario lo sirve todo junto, mejor usar '/api/admin' o mantener localhost para prueba local. Para render, ideal es ruta relativa si ambos corren en el mismo servidor de Express, pero el frontend son archivos HTML estáticos.
// Voy a dejar la URL base en función del host para que funcione en local y render.
const getApiUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api/admin';
    }
    return 'https://virtualclass-sm1i.onrender.com/api/admin';
};
const getUsuariosApiUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api/usuarios';
    }
    return 'https://virtualclass-sm1i.onrender.com/api/usuarios';
};

// --- DASHBOARD ---
async function cargarEstadisticas() {
    try {
        const response = await fetch(`${getApiUrl()}/stats`);
        const stats = await response.json();
        const h3Elements = document.querySelectorAll('#dashboard .stat-card h3');
        if (h3Elements.length >= 4) {
            h3Elements[0].textContent = stats.totalUsuarios;
            h3Elements[1].textContent = stats.cursosActivos;
            h3Elements[2].textContent = stats.alumnosSinMatricula;
            h3Elements[3].textContent = stats.incidencias;
        }
    } catch (error) { console.error(error); }
}

async function cargarAlumnosSinMatricula() {
    const tbody = document.querySelector('#tablaSinMatricula tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted"><div class="spinner-border text-warning" role="status"></div></td></tr>';

    try {
        const response = await fetch(`${getApiUrl()}/alumnos-sin-matricula`);
        const alumnos = await response.json();

        if (!alumnos || alumnos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted"><i class="bi bi-check-circle fs-3 d-block mb-2 text-success"></i> ¡Todos los alumnos están matriculados!</td></tr>';
            return;
        }

        tbody.innerHTML = alumnos.map(al => `
            <tr>
                <td class="fw-semibold">${al.nombres}</td>
                <td class="fw-semibold">${al.apellidos}</td>
                <td><a href="mailto:${al.correo}" class="text-decoration-none">${al.correo}</a></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="irAMatricular(${al.id_usuario})" title="Ir a Matrículas">
                        <i class="bi bi-arrow-right-circle"></i> Matricular
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger"><i class="bi bi-x-circle fs-3 d-block mb-2"></i> Error al cargar los alumnos.</td></tr>';
    }
}

function irAMatricular(id_usuario) {
    // 1. Cerrar el modal limpiamente
    const modalEl = document.getElementById('modalSinMatricula');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // 2. Esperar que la animación del modal termine para no romper el scroll/UI
    setTimeout(() => {
        // Asegurarnos de limpiar el backdrop si Bootstrap se atasca
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();

        // 3. Simular el clic real en el enlace del menú para que dispare TODO (cargarDatosMatricula y showSection)
        const btnMatriculas = document.querySelector('a[href="#matriculas"]');
        if (btnMatriculas) {
            btnMatriculas.click();

            // Opcional: pre-seleccionar el alumno si fuera posible (requeriría modificar cargarDatosMatricula)
            // Por ahora, solo lo llevamos a la pestaña lista y sin bug de UI.
        }
    }, 300);
}

async function cargarIncidencias() {
    const tbody = document.querySelector('#tablaIncidencias tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted"><div class="spinner-border text-primary" role="status"></div></td></tr>';

    try {
        const response = await fetch(`${getApiUrl()}/incidencias`);
        const incidencias = await response.json();

        if (!incidencias || incidencias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted"><i class="bi bi-check-circle fs-3 d-block mb-2 text-success"></i> No hay incidencias pendientes.</td></tr>';
            return;
        }

        tbody.innerHTML = incidencias.map(inc => {
            const fecha = new Date(inc.fecha_hora).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
            return `
                <tr>
                    <td><span class="text-muted small"><i class="bi bi-calendar me-1"></i>${fecha}</span></td>
                    <td class="fw-semibold">${inc.solicitante_nombres} ${inc.solicitante_apellidos}</td>
                    <td class="fw-bold">${inc.asunto}</td>
                    <td class="text-muted small">${inc.descripcion}</td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="resolverIncidencia(${inc.id_incidencia})" title="Marcar como Resuelto">
                            <i class="bi bi-check2-circle"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger"><i class="bi bi-x-circle fs-3 d-block mb-2"></i> Error al cargar incidencias.</td></tr>';
    }
}

async function resolverIncidencia(id) {
    if (!confirm('¿Estás seguro de marcar esta incidencia como resuelta?')) return;
    try {
        const res = await fetch(`${getApiUrl()}/incidencias/${id}/resolver`, { method: 'PUT' });
        if (res.ok) {
            alert('Incidencia resuelta exitosamente.');
            cargarIncidencias();
            cargarEstadisticas();
        } else {
            alert('Error al resolver la incidencia.');
        }
    } catch (error) { console.error(error); }
}

// --- USUARIOS ---
async function cargarUsuarios() {
    try {
        const response = await fetch(`${getApiUrl()}/usuarios`);
        globalUsuarios = await response.json();
        renderTablaUsuarios(globalUsuarios);
    } catch (error) { console.error(error); }
}

function renderTablaUsuarios(usuarios) {
    const tbody = document.querySelector('#usuarios tbody');
    tbody.innerHTML = '';
    usuarios.forEach(user => {
        let estadoBadge = 'bg-danger';
        if (user.estado === 'Activo' || user.estado === 'ACTIVO') estadoBadge = 'bg-success';
        if (user.estado === 'PENDIENTE') estadoBadge = 'bg-warning text-dark';

        let rolBadge = 'bg-secondary';
        if (user.nombre_rol?.includes('Admin')) rolBadge = 'bg-danger';
        else if (user.nombre_rol?.includes('Docente')) rolBadge = 'bg-primary';
        else if (user.nombre_rol?.includes('Alumno')) rolBadge = 'bg-info text-dark';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${user.id_usuario}</td>
            <td>${user.nombres} ${user.apellidos}</td>
            <td>${user.correo}</td>
            <td><span class="badge ${rolBadge}">${user.nombre_rol || 'Sin Rol'}</span></td>
            <td><span class="badge ${estadoBadge}">${user.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-secondary" onclick="abrirModalEditarUsuario(${user.id_usuario})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-${(user.estado === 'Activo' || user.estado === 'ACTIVO') ? 'danger' : 'success'}" title="${(user.estado === 'Activo' || user.estado === 'ACTIVO') ? 'Desactivar usuario' : 'Activar usuario'}" onclick="cambiarEstadoUsuario(${user.id_usuario}, '${(user.estado === 'Activo' || user.estado === 'ACTIVO') ? 'Inactivo' : 'Activo'}')">
                    <i class="bi bi-${(user.estado === 'Activo' || user.estado === 'ACTIVO') ? 'trash' : 'check-circle'}"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarUsuarios() {
    const texto = document.getElementById('buscarUsuarioInput').value.toLowerCase();
    const rolFiltro = document.getElementById('filtroRolSelect').value;

    const filtrados = globalUsuarios.filter(u => {
        const coincideTexto = u.nombres.toLowerCase().includes(texto) ||
            u.apellidos.toLowerCase().includes(texto) ||
            u.correo.toLowerCase().includes(texto) ||
            u.id_usuario.toString().includes(texto);

        const coincideRol = rolFiltro === '' || (u.nombre_rol && u.nombre_rol.includes(rolFiltro));
        return coincideTexto && coincideRol;
    });
    renderTablaUsuarios(filtrados);
}

function abrirModalEditarUsuario(id) {
    const user = globalUsuarios.find(u => u.id_usuario === id);
    if (user) {
        document.getElementById('eIdUsuario').value = user.id_usuario;
        document.getElementById('eNombres').value = user.nombres;
        document.getElementById('eApellidos').value = user.apellidos;
        document.getElementById('eCorreo').value = user.correo;
        const modal = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));
        modal.show();
    }
}

async function actualizarUsuario() {
    const id = document.getElementById('eIdUsuario').value;
    const nombres = document.getElementById('eNombres').value;
    const apellidos = document.getElementById('eApellidos').value;
    const correo = document.getElementById('eCorreo').value;

    try {
        const res = await fetch(`${getUsuariosApiUrl()}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombres, apellidos, correo, telefono: '' })
        });
        if (res.ok) {
            alert('Usuario actualizado');
            bootstrap.Modal.getInstance(document.getElementById('modalEditarUsuario')).hide();
            cargarUsuarios();
        } else alert('Error al actualizar');
    } catch (e) { console.error(e); }
}

async function cambiarEstadoUsuario(id, nuevoEstado) {
    if (!confirm(`¿Estás seguro de cambiar el estado a ${nuevoEstado}?`)) return;
    try {
        const response = await fetch(`${getApiUrl()}/usuarios/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (response.ok) { cargarUsuarios(); cargarEstadisticas(); }
    } catch (error) { console.error(error); }
}

async function cargarRoles() {
    try {
        const res = await fetch(`${getApiUrl()}/roles`);
        const roles = await res.json();
        const select = document.getElementById('uRol');
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione un rol...</option>';
        roles.forEach(r => select.innerHTML += `<option value="${r.id_rol}">${r.nombre_rol}</option>`);
    } catch (error) { console.error(error); }
}

async function guardarUsuario() {
    const nombres = document.getElementById('uNombres').value;
    const apellidos = document.getElementById('uApellidos').value;
    const correo = document.getElementById('uCorreo').value;
    const contrasena = document.getElementById('uContrasena').value;
    const idRol = document.getElementById('uRol').value;

    if (!nombres || !apellidos || !correo || !contrasena || !idRol) return alert('Campos incompletos');

    try {
        const res = await fetch(`${getApiUrl()}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombres, apellidos, correo, contrasena, idRol })
        });
        if (res.ok) {
            alert('Usuario creado correctamente');
            bootstrap.Modal.getInstance(document.getElementById('modalNuevoUsuario')).hide();
            document.getElementById('formNuevoUsuario').reset();
            cargarUsuarios();
            cargarEstadisticas();
            agregarLog('Admin', `Usuario creado: ${correo}`, 'Completado', 'bg-success');
        } else alert('Error al crear usuario');
    } catch (e) { console.error(e); }
}

// --- CURSOS ---
let globalCursos = [];

async function cargarCursos() {
    try {
        const response = await fetch(`${getApiUrl()}/cursos`);
        globalCursos = await response.json();
        renderizarCursos(globalCursos);
    } catch (error) { console.error(error); }
}

function renderizarCursos(cursos) {
    const tbody = document.querySelector('#cursos tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    cursos.forEach(curso => {
        const estadoLabel = curso.estado === 'Inactivo' ? '<span class="badge bg-danger">Inactivo</span>' : '<span class="badge bg-success">Activo</span>';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${curso.codigo}</td>
            <td>${curso.nombre} ${estadoLabel}</td>
            <td>${curso.creditos}</td>
            <td>${curso.total_clases || 0}</td>
            <td>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle dropdown-toggle-custom" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-gear"></i> Acciones
                    </button>
                    <ul class="dropdown-menu shadow border-0">
                        <li><a class="dropdown-item" href="#" onclick="abrirModalCrearClase(${curso.id_curso}, '${curso.nombre}')"><i class="bi bi-plus-circle me-2"></i> Añadir Clase</a></li>
                        <li><a class="dropdown-item" href="#" onclick="verClases(${curso.id_curso}, '${curso.nombre}')"><i class="bi bi-eye me-2"></i> Ver Clases</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick='abrirModalEditarCurso(${JSON.stringify(curso).replace(/'/g, "&apos;")})'><i class="bi bi-pencil me-2"></i> Editar Curso</a></li>
                        <li><a class="dropdown-item text-${curso.estado === 'Inactivo' ? 'success' : 'danger'}" href="#" onclick="cambiarEstadoCurso(${curso.id_curso}, '${curso.estado === 'Inactivo' ? 'Activo' : 'Inactivo'}')">
                            <i class="bi ${curso.estado === 'Inactivo' ? 'bi-check-circle' : 'bi-x-circle'} me-2"></i> ${curso.estado === 'Inactivo' ? 'Habilitar' : 'Inhabilitar'}
                        </a></li>
                    </ul>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function abrirModalEditarCurso(curso) {
    document.getElementById('eIdCurso').value = curso.id_curso;
    document.getElementById('eCodigoCurso').value = curso.codigo;
    document.getElementById('eNombreCurso').value = curso.nombre;
    document.getElementById('eCreditosCurso').value = curso.creditos;
    document.getElementById('eCreditosCurso').value = curso.creditos;
    document.getElementById('eDescripcionCurso').value = curso.descripcion || '';

    const modalEl = document.getElementById('modalEditarCurso');
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

async function actualizarCurso() {
    const id = document.getElementById('eIdCurso').value;
    const codigo = document.getElementById('eCodigoCurso').value;
    const nombre = document.getElementById('eNombreCurso').value;
    const creditos = document.getElementById('eCreditosCurso').value;
    const descripcion = document.getElementById('eDescripcionCurso').value;

    try {
        const res = await fetch(`${getApiUrl()}/cursos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, nombre, descripcion, creditos })
        });
        if (res.ok) {
            alert('Curso actualizado');
            const modalEl = document.getElementById('modalEditarCurso');
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
            cargarCursos();
            agregarLog('Admin', `Curso actualizado: ${codigo}`, 'Completado', 'bg-success');
        } else alert('Error al actualizar curso');
    } catch (e) { console.error(e); }
}

async function cambiarEstadoCurso(idCurso, nuevoEstado) {
    if (!confirm(`¿Estás seguro de cambiar el estado del curso a ${nuevoEstado}?`)) return;
    try {
        const response = await fetch(`${getApiUrl()}/cursos/${idCurso}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (response.ok) {
            cargarCursos();
            agregarLog('Admin', `Estado de curso ${idCurso} a ${nuevoEstado}`, 'Completado', 'bg-warning text-dark');
        }
    } catch (error) { console.error(error); }
}

function filtrarCursos() {
    const term = document.getElementById('buscadorCursos').value.toLowerCase();
    const filtrados = globalCursos.filter(c =>
        c.nombre.toLowerCase().includes(term) ||
        c.codigo.toLowerCase().includes(term)
    );
    renderizarCursos(filtrados);
}

async function guardarCurso() {
    const codigo = document.getElementById('cCodigo').value;
    const nombre = document.getElementById('cNombre').value;
    const creditos = document.getElementById('cCreditos').value;
    const descripcion = document.getElementById('cDescripcion').value;

    if (!codigo || !nombre || !creditos) return alert('Campos incompletos');

    try {
        const res = await fetch(`${getApiUrl()}/cursos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, nombre, creditos, descripcion })
        });
        if (res.ok) {
            alert('Curso creado correctamente');
            bootstrap.Modal.getInstance(document.getElementById('modalNuevoCurso')).hide();
            document.getElementById('formNuevoCurso').reset();
            cargarCursos();
            cargarEstadisticas();
            agregarLog('Admin', `Curso creado: ${codigo}`, 'Completado', 'bg-success');
        } else alert('Error al crear curso');
    } catch (e) { console.error(e); }
}

async function verClases(idCurso, nombreCurso) {
    const tbody = document.querySelector('#tablaClasesDetalle tbody');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando...</td></tr>';

    document.getElementById('nombreCursoModal').textContent = nombreCurso;
    const modalEl = document.getElementById('modalVerClases');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    try {
        const response = await fetch(`${getApiUrl()}/clases-disponibles`);
        const todasClases = await response.json();
        // Filtrar solo las de este curso (como id_curso no viene siempre en getAvailableClasses, lo filtramos por nombre por ahora)
        const clases = todasClases.filter(c => c.nombre === nombreCurso);

        tbody.innerHTML = '';
        if (clases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay clases activas para este curso</td></tr>';
            return;
        }
        clases.forEach(c => {
            const estadoLabel = c.estado === 'Inactivo' ? '<span class="badge bg-danger">Inactivo</span>' : '<span class="badge bg-success">Activo</span>';
            const btnEstadoClass = c.estado === 'Inactivo' ? 'btn-outline-success' : 'btn-outline-danger';
            const iconEstado = c.estado === 'Inactivo' ? 'bi-check-circle' : 'bi-x-circle';
            const textEstado = c.estado === 'Inactivo' ? 'Habilitar' : 'Inhabilitar';
            const nuevoEstado = c.estado === 'Inactivo' ? 'Activo' : 'Inactivo';

            tbody.innerHTML += `
                <tr>
                    <td>Sec. ${c.seccion} <br> ${estadoLabel}</td>
                    <td>${c.periodo}</td>
                    <td>${c.aula || 'A definir'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick='abrirModalEditarClase(${JSON.stringify(c).replace(/'/g, "&apos;")}, "${nombreCurso}")'><i class="bi bi-pencil"></i> Editar</button>
                        <button class="btn btn-sm ${btnEstadoClass}" onclick="cambiarEstadoClase(${c.id_clase}, '${nuevoEstado}', '${nombreCurso}')"><i class="bi ${iconEstado}"></i> ${textEstado}</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) { console.error(e); }
}

let cursoEditandoClase = '';
function abrirModalEditarClase(clase, nombreCurso) {
    cursoEditandoClase = nombreCurso; // Para refrescar la tabla después de guardar
    document.getElementById('eIdClase').value = clase.id_clase;
    document.getElementById('eClaseSeccion').value = clase.seccion;
    document.getElementById('eClasePeriodo').value = clase.periodo;
    document.getElementById('eClaseCiclo').value = clase.ciclo || '';
    document.getElementById('eClaseAula').value = clase.aula || '';
    document.getElementById('eClaseNombreClase').value = clase.nombre_clase || '';
    // Cerrar el modal de Ver Clases temporalmente o simplemente abrir encima
    const modalEl = document.getElementById('modalEditarClase');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

async function actualizarClase() {
    const id = document.getElementById('eIdClase').value;
    const seccion = document.getElementById('eClaseSeccion').value;
    const periodo = document.getElementById('eClasePeriodo').value;
    const ciclo = document.getElementById('eClaseCiclo').value;
    const aula = document.getElementById('eClaseAula').value;
    const nombreClase = document.getElementById('eClaseNombreClase').value;

    try {
        const res = await fetch(`${getApiUrl()}/clases/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombreClase, periodo, ciclo, seccion, aula })
        });
        if (res.ok) {
            alert('Clase actualizada');
            const modalEl = document.getElementById('modalEditarClase');
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
            // Refrescar la tabla de clases
            verClases(null, cursoEditandoClase);
            agregarLog('Admin', `Clase actualizada: Sec. ${seccion}`, 'Completado', 'bg-success');
        } else alert('Error al actualizar clase');
    } catch (e) { console.error(e); }
}

async function cambiarEstadoClase(idClase, nuevoEstado, nombreCurso) {
    if (!confirm(`¿Estás seguro de cambiar el estado de la clase a ${nuevoEstado}?`)) return;
    try {
        const response = await fetch(`${getApiUrl()}/clases/${idClase}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (response.ok) {
            verClases(null, nombreCurso);
            agregarLog('Admin', `Estado de clase ${idClase} a ${nuevoEstado}`, 'Completado', 'bg-warning text-dark');
        } else {
            alert('Error al cambiar el estado de la clase');
        }
    } catch (error) { console.error(error); }
}

function abrirModalCrearClase(idCurso, nombreCurso) {
    document.getElementById('claseIdCurso').value = idCurso;
    document.getElementById('claseNombreCurso').value = nombreCurso;

    // Autocompletar el periodo actual activo desde la configuración global
    const configPeriodo = document.getElementById('configPeriodo');
    if (configPeriodo && configPeriodo.value) {
        document.getElementById('clasePeriodo').value = configPeriodo.value;
    }

    const modalEl = document.getElementById('modalCrearClase');
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

async function guardarClase() {
    const idCurso = document.getElementById('claseIdCurso').value;
    const seccion = document.getElementById('claseSeccion').value;
    const periodo = document.getElementById('clasePeriodo').value;
    const ciclo = document.getElementById('claseCiclo').value;
    const aula = document.getElementById('claseAula').value;
    const nombreClase = document.getElementById('claseNombreClase').value;

    if (!seccion || !periodo || !ciclo || !aula) return alert('Campos incompletos');

    try {
        const res = await fetch(`${getApiUrl()}/clases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idCurso, nombreClase, periodo, ciclo, seccion, aula })
        });
        if (res.ok) {
            alert('Clase creada exitosamente');
            const modalEl = document.getElementById('modalCrearClase');
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
            document.getElementById('formCrearClase').reset();
            cargarCursos(); // Refrescar la tabla
            agregarLog('Admin', `Nueva clase creada en curso`, 'Completado', 'bg-success');
        } else {
            alert('Error al crear la clase');
        }
    } catch (e) { console.error(e); }
}

let currentMatriculaMode = 'Alumno';
let matriculaUsuariosCache = [];
let matriculaClasesCache = [];

async function cargarDatosMatricula() {
    try {
        if (matriculaUsuariosCache.length === 0) {
            const resU = await fetch(`${getApiUrl()}/usuarios`);
            matriculaUsuariosCache = await resU.json();
            const resC = await fetch(`${getApiUrl()}/clases-disponibles`);
            matriculaClasesCache = await resC.json();
        }

        renderizarSelectsMatricula();

        // Configurar Event Listeners de las pestañas
        const tabAlumno = document.getElementById('tabMatriculaAlumno');
        const tabDocente = document.getElementById('tabAsignacionDocente');

        if (tabAlumno && tabDocente) {
            tabAlumno.onclick = (e) => {
                e.preventDefault();
                currentMatriculaMode = 'Alumno';
                tabAlumno.classList.add('active');
                tabDocente.classList.remove('active');
                document.getElementById('lblSeleccionarUsuario').textContent = 'Seleccionar Alumno';
                document.getElementById('btnConfirmarMatricula').textContent = 'Confirmar Matrícula';
                renderizarSelectsMatricula();
            };

            tabDocente.onclick = (e) => {
                e.preventDefault();
                currentMatriculaMode = 'Docente';
                tabDocente.classList.add('active');
                tabAlumno.classList.remove('active');
                document.getElementById('lblSeleccionarUsuario').textContent = 'Seleccionar Docente';
                document.getElementById('btnConfirmarMatricula').textContent = 'Asignar Docente a Clase';
                renderizarSelectsMatricula();
            };
        }

        const selectClase = document.getElementById('selectClaseMatricula');
        selectClase.onchange = async () => {
            const idC = selectClase.value;
            const container = document.getElementById('containerParticipantesClase');
            const listD = document.getElementById('listaDocentesClase');
            const listA = document.getElementById('listaAlumnosClase');

            if (!idC) {
                container.style.display = 'none';
                return;
            }

            container.style.display = 'block';
            listD.innerHTML = '<li class="list-group-item text-muted">Cargando...</li>';
            listA.innerHTML = '<li class="list-group-item text-muted">Cargando...</li>';

            try {
                const res = await fetch(`${getApiUrl()}/clases-disponibles/${idC}/participantes`);
                const data = await res.json();

                listD.innerHTML = data.docentes.length > 0
                    ? data.docentes.map(d => `<li class="list-group-item">${d.nombres} ${d.apellidos} <span class="badge bg-primary float-end">Docente</span></li>`).join('')
                    : '<li class="list-group-item text-muted">No hay docentes asignados.</li>';

                listA.innerHTML = data.alumnos.length > 0
                    ? data.alumnos.map(a => `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${a.nombres} ${a.apellidos}
                            <button class="btn btn-sm btn-outline-danger" onclick="cambiarEstadoMatricula(${idC}, ${a.id_usuario}, 'RETIRADO')">
                                <i class="bi bi-x-circle"></i> Retirar
                            </button>
                        </li>`).join('')
                    : '<li class="list-group-item text-muted">No hay alumnos matriculados.</li>';
            } catch (e) {
                console.error('Error al cargar participantes:', e);
            }
        };

        const btnMatricular = document.getElementById('btnConfirmarMatricula');
        btnMatricular.onclick = async () => {
            const idU = document.getElementById('selectUsuarioMatricula').value;
            const idC = document.getElementById('selectClaseMatricula').value;
            if (!idU || !idC) return alert('Seleccione ambos campos');

            try {
                let url = `${getApiUrl()}/matricular`;
                let options = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idUsuario: idU, idClase: idC })
                };

                if (currentMatriculaMode === 'Docente') {
                    url = `${getApiUrl()}/clases/${idC}/docente`;
                    options = {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idDocente: idU })
                    };
                }

                const res = await fetch(url, options);
                const data = await res.json();

                if (res.ok) {
                    alert(`${currentMatriculaMode === 'Alumno' ? 'Matrícula' : 'Reasignación de docente'} registrada exitosamente`);
                    cargarEstadisticas();
                    agregarLog('Admin', `${currentMatriculaMode === 'Alumno' ? 'Alumno matriculado' : 'Docente reasignado'} a clase ${idC}`, 'Completado', 'bg-success');
                    document.getElementById('selectUsuarioMatricula').value = '';
                    // Refrescar la lista de participantes de esta clase
                    selectClase.dispatchEvent(new Event('change'));
                } else {
                    alert(data.error || data.mensaje || 'Error en la asignación');
                }
            } catch (e) { console.error(e); }
        };
    } catch (e) { console.error(e); }
}

async function cambiarEstadoMatricula(idClase, idUsuario, nuevoEstado) {
    if (!confirm('¿Estás seguro de que deseas retirar a este alumno de la clase? Perderá acceso a los materiales, pero sus notas se mantendrán.')) return;

    try {
        const res = await fetch(`${getApiUrl()}/clases/${idClase}/alumnos/${idUsuario}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (res.ok) {
            alert('Alumno retirado exitosamente.');
            // Refrescar la lista disparando el change del select
            document.getElementById('selectClaseMatricula').dispatchEvent(new Event('change'));
            cargarEstadisticas();
            agregarLog('Admin', `Alumno ${idUsuario} retirado de clase ${idClase}`, 'Completado', 'bg-danger');
        } else {
            alert('Hubo un error al intentar retirar al alumno.');
        }
    } catch (error) {
        console.error(error);
    }
}

function renderizarSelectsMatricula() {
    const selectUsuario = document.getElementById('selectUsuarioMatricula');
    const selectClase = document.getElementById('selectClaseMatricula');
    const selectClaseMasiva = document.getElementById('claseMatriculaMasiva');
    const selectAlumnosMasiva = document.getElementById('alumnosMatriculaMasiva');

    if (!selectUsuario || !selectClase) return;

    selectUsuario.innerHTML = `<option value="">Seleccione un ${currentMatriculaMode.toLowerCase()}...</option>`;
    selectClase.innerHTML = '<option value="">Seleccione una clase...</option>';

    if (selectClaseMasiva) selectClaseMasiva.innerHTML = '<option value="">Seleccione una clase destino...</option>';
    if (selectAlumnosMasiva) selectAlumnosMasiva.innerHTML = '';

    // Limpiar campos de búsqueda
    ['buscarUsuarioMatricula', 'buscarClaseMatricula', 'buscarClaseMasiva', 'buscarAlumnoMasiva'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });

    matriculaUsuariosCache.forEach(u => {
        if (u.nombre_rol?.includes(currentMatriculaMode)) {
            selectUsuario.innerHTML += `<option value="${u.id_usuario}">${u.nombres} ${u.apellidos} (${u.correo})</option>`;
        }
        // Para masiva, siempre listar alumnos
        if (u.nombre_rol?.includes('Alumno') && selectAlumnosMasiva) {
            selectAlumnosMasiva.innerHTML += `<option value="${u.id_usuario}">${u.nombres} ${u.apellidos} (${u.correo})</option>`;
        }
    });

    matriculaClasesCache.forEach(c => {
        selectClase.innerHTML += `<option value="${c.id_clase}">${c.nombre} - Sec ${c.seccion} (${c.periodo})</option>`;
        if (selectClaseMasiva) {
            selectClaseMasiva.innerHTML += `<option value="${c.id_clase}">${c.nombre} - Sec ${c.seccion} (${c.periodo})</option>`;
        }
    });
}

function descargarReporte(tipo) {
    window.location.href = `${getApiUrl()}/reportes/${tipo}`;
    agregarLog('Admin', `Reporte exportado: ${tipo}`, 'Completado', 'bg-info');
}

// --- EXPORTAR A CSV ---
function generarReporteUsuariosCSV() {
    if (globalUsuarios.length === 0) return alert('No hay datos para exportar');
    let csvContent = "data:text/csv;charset=utf-8,ID,Nombres,Apellidos,Correo,Rol,Estado\n";
    globalUsuarios.forEach(u => {
        csvContent += `${u.id_usuario},"${u.nombres}","${u.apellidos}","${u.correo}","${u.nombre_rol}","${u.estado}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_usuarios.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
}



// --- MATRICULA MASIVA ---
async function procesarMatriculaMasiva() {
    const idClase = document.getElementById('claseMatriculaMasiva').value;
    const optionsSeleccionadas = document.getElementById('alumnosMatriculaMasiva').selectedOptions;

    if (!idClase || optionsSeleccionadas.length === 0) {
        return alert('Por favor, selecciona una clase destino y al menos un alumno.');
    }

    const alumnosArray = Array.from(optionsSeleccionadas).map(opt => opt.value);

    let exitosos = 0;
    let fallidos = 0;

    // Procesar en paralelo para mayor rapidez
    await Promise.all(alumnosArray.map(async (idUsuario) => {
        try {
            const res = await fetch(`${getApiUrl()}/matricular`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idUsuario, idClase })
            });
            if (res.ok) exitosos++;
            else fallidos++;
        } catch (e) {
            fallidos++;
        }
    }));

    alert(`Proceso masivo completado.\n✅ Exitosos: ${exitosos}\n❌ Fallidos o ya matriculados: ${fallidos}`);

    if (exitosos > 0) {
        cargarEstadisticas();
        agregarLog('Admin', `Matrícula Masiva en clase ${idClase}`, 'Completado', 'bg-primary');
        // Refrescar el DOM si esa clase estaba seleccionada
        const selectClasePrincipal = document.getElementById('selectClaseMatricula');
        if (selectClasePrincipal.value === idClase) {
            selectClasePrincipal.dispatchEvent(new Event('change'));
        }
    }

    bootstrap.Modal.getInstance(document.getElementById('modalMatriculaMasiva')).hide();
}

// ==========================================
// GESTIÓN DE ANUNCIOS INSTITUCIONALES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('a[href="#anuncios"]').addEventListener('click', cargarAnuncios);
    const formAnuncio = document.getElementById('formAnuncio');
    if (formAnuncio) formAnuncio.addEventListener('submit', guardarAnuncio);
});

function getAnunciosApiUrl() {
    return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
        ? 'http://localhost:3000/api/anuncios'
        : 'https://virtualclass-sm1i.onrender.com/api/anuncios';
}

async function cargarAnuncios() {
    const tbody = document.getElementById('tablaAnunciosBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>';

    try {
        const resp = await fetch(getAnunciosApiUrl());
        const anuncios = await resp.json();

        tbody.innerHTML = '';
        if (anuncios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No hay anuncios publicados.</td></tr>';
            return;
        }

        anuncios.forEach(anuncio => {
            const fecha = new Date(anuncio.fecha_publicacion).toLocaleDateString('es-PE');
            const autor = anuncio.autor_nombres ? `${anuncio.autor_nombres} ${anuncio.autor_apellidos}` : 'Admin';

            let badgeColor = 'bg-primary';
            let icon = 'bi-info-circle';
            if (anuncio.nivel === 'advertencia') { badgeColor = 'bg-warning text-dark'; icon = 'bi-exclamation-triangle'; }
            if (anuncio.nivel === 'urgente') { badgeColor = 'bg-danger'; icon = 'bi-exclamation-circle'; }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="ps-4">
                    <span class="badge ${badgeColor} rounded-pill px-3 py-2"><i class="bi ${icon} me-1"></i>${anuncio.nivel}</span>
                </td>
                <td class="fw-bold">${anuncio.titulo}</td>
                <td>
                    <span class="d-block small"><i class="bi bi-calendar3 me-1"></i>${fecha}</span>
                    <span class="d-block text-muted" style="font-size:0.75rem;"><i class="bi bi-person me-1"></i>${autor}</span>
                </td>
                <td>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" 
                            ${anuncio.activo ? 'checked' : ''} 
                            onchange="toggleEstadoAnuncio(${anuncio.id_anuncio}, this.checked)">
                    </div>
                </td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-light rounded-circle me-1" title="Editar" 
                        onclick='editarAnuncio(${JSON.stringify(anuncio).replace(/'/g, "&#39;")})'>
                        <i class="bi bi-pencil text-primary"></i>
                    </button>
                    <button class="btn btn-sm btn-light rounded-circle" title="Eliminar" 
                        onclick="eliminarAnuncio(${anuncio.id_anuncio})">
                        <i class="bi bi-trash text-danger"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-3">Error al cargar anuncios.</td></tr>';
    }
}

function limpiarModalAnuncio() {
    document.getElementById('formAnuncio').reset();
    document.getElementById('anuncioId').value = '';
    document.getElementById('anuncioImagenUrl').value = '';
    document.getElementById('anuncioImagenFile').value = '';
    document.getElementById('btnQuitarImagen').classList.add('d-none');
    document.getElementById('anuncioImagenStatus').innerHTML = 'Sube una imagen desde tu computadora. Se guardará en Drive.<br><small class="text-muted">Dimensiones recomendadas: <strong>1200x400px (Banner)</strong> o <strong>1920x1080px (Diapositiva 16:9)</strong>. La imagen se ajustará automáticamente sin recortarse.</small>';
    document.getElementById('modalAnuncioTitle').innerText = 'Nuevo Anuncio';
}

function editarAnuncio(anuncio) {
    document.getElementById('modalAnuncioTitle').innerText = 'Editar Anuncio';
    document.getElementById('anuncioId').value = anuncio.id_anuncio;
    document.getElementById('anuncioTitulo').value = anuncio.titulo;
    document.getElementById('anuncioNivel').value = anuncio.nivel;
    document.getElementById('anuncioContenido').value = anuncio.contenido;
    document.getElementById('anuncioImagenUrl').value = anuncio.imagen_url || '';
    document.getElementById('anuncioImagenFile').value = '';
    if (anuncio.imagen_url && anuncio.imagen_url !== 'null' && anuncio.imagen_url.trim() !== '') {
        document.getElementById('anuncioImagenStatus').innerHTML = '<span class="text-success"><i class="bi bi-check-circle"></i> Ya tiene una imagen adjunta. Sube una nueva para reemplazarla.</span>';
        document.getElementById('btnQuitarImagen').classList.remove('d-none');
    } else {
        document.getElementById('anuncioImagenStatus').innerHTML = 'Sube una imagen desde tu computadora. Se guardará en Drive.<br><small class="text-muted">Dimensiones recomendadas: <strong>1200x400px (Banner)</strong> o <strong>1920x1080px (Diapositiva 16:9)</strong>. La imagen se ajustará automáticamente sin recortarse.</small>';
        document.getElementById('btnQuitarImagen').classList.add('d-none');
    }
    new bootstrap.Modal(document.getElementById('modalAnuncio')).show();
}

function quitarImagenAnuncio() {
    document.getElementById('anuncioImagenUrl').value = '';
    document.getElementById('anuncioImagenFile').value = '';
    document.getElementById('btnQuitarImagen').classList.add('d-none');
    document.getElementById('anuncioImagenStatus').innerHTML = '<span class="text-danger"><i class="bi bi-trash"></i> Imagen marcada para eliminación.</span> (Guarda los cambios para aplicar)';
}

async function guardarAnuncio(e) {
    e.preventDefault();
    const btn = document.querySelector('#formAnuncio button[type="submit"]') || e.target;
    const btnOriginalText = btn.innerText;

    const id = document.getElementById('anuncioId').value;
    const titulo = document.getElementById('anuncioTitulo').value.trim();
    const nivel = document.getElementById('anuncioNivel').value;
    const contenido = document.getElementById('anuncioContenido').value.trim();
    let imagen_url = document.getElementById('anuncioImagenUrl').value.trim() || null;
    const imagenFile = document.getElementById('anuncioImagenFile').files[0];

    // currentUser se obtiene de utils.js, ya estamos en zona logueada
    const idAutor = currentUser ? currentUser.id_usuario : null;

    btn.disabled = true;

    // 1. Subir la imagen si hay una nueva
    if (imagenFile) {
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Subiendo...';
        const formData = new FormData();
        formData.append('archivo', imagenFile);

        try {
            const baseUrl = getApiUrl().replace('/admin', '');
            const uploadRes = await fetch(`${baseUrl}/drive/upload`, {
                method: 'POST',
                body: formData
            });
            if (!uploadRes.ok) {
                const text = await uploadRes.text();
                throw new Error(`Error HTTP: ${uploadRes.status}`);
            }
            const uploadData = await uploadRes.json();
            if (uploadData.success && uploadData.data && uploadData.data.id) {
                imagen_url = `${baseUrl}/drive/view/${uploadData.data.id}`;
            } else {
                throw new Error(uploadData.message || 'Error al subir la imagen');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('No se pudo subir la imagen a Drive. Detalle: ' + error.message);
            btn.disabled = false;
            btn.innerText = btnOriginalText;
            return;
        }
    }

    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Guardando Anuncio...';

    const body = JSON.stringify({ titulo, contenido, nivel, imagen_url, id_autor: idAutor });
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${getAnunciosApiUrl()}/${id}` : getAnunciosApiUrl();

    try {
        const resp = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body
        });
        if (resp.ok) {
            const modalEl = document.getElementById('modalAnuncio');
            const modalInst = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInst.hide();
            cargarAnuncios();
            agregarLog(`Anuncio ${id ? 'editado' : 'creado'}: ${titulo}`, 'Completado');
        } else {
            const err = await resp.json();
            alert('Error: ' + err.mensaje);
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    } finally {
        btn.disabled = false;
        btn.innerText = btnOriginalText;
    }
}

async function toggleEstadoAnuncio(id, estadoActivo) {
    try {
        await fetch(`${getAnunciosApiUrl()}/${id}/toggle`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activo: estadoActivo })
        });
    } catch (e) {
        console.error(e);
        cargarAnuncios(); // Revertir si falla
    }
}

async function eliminarAnuncio(id) {
    if (!confirm('¿Seguro que deseas eliminar este anuncio permanentemente?')) return;
    try {
        const resp = await fetch(`${getAnunciosApiUrl()}/${id}`, { method: 'DELETE' });
        if (resp.ok) {
            cargarAnuncios();
            agregarLog(`Anuncio ID ${id} eliminado`, 'Eliminado');
        }
    } catch (e) {
        console.error(e);
    }
}

// =============================================
// UTILIDADES: FILTRAR SELECTS
// =============================================
function filtrarOpcionesSelect(inputId, selectId) {
    const input = document.getElementById(inputId);
    const filter = input.value.toLowerCase();
    const select = document.getElementById(selectId);
    const options = select.getElementsByTagName('option');

    for (let i = 0; i < options.length; i++) {
        // Ignorar la primera opcion si es un placeholder (value="")
        if (options[i].value === "") {
            options[i].hidden = false;
            continue;
        }

        const txtValue = options[i].textContent || options[i].innerText;
        if (txtValue.toLowerCase().indexOf(filter) > -1) {
            options[i].hidden = false;
        } else {
            options[i].hidden = true;
        }
    }
}
