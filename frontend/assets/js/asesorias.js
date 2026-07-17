// assets/js/asesorias.js

const API_ASESORIAS = 'https://virtualclass-sm1i.onrender.com/api/asesorias';

let esDocente = false;
let docentesDisponibles = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) return;

    esDocente = currentUser.rol && currentUser.rol.toLowerCase().includes('docente');

    // Configurar UI según rol
    const btnSolicitar = document.getElementById('btnSolicitarAsesoria');
    const filtroEstado = document.getElementById('filtroEstado');

    if (esDocente) {
        // Docentes no solicitan, gestionan
        if (btnSolicitar) btnSolicitar.classList.add('d-none');
        document.getElementById('tituloSeccion').textContent = 'Solicitudes Recibidas';
        document.getElementById('subtituloSeccion').textContent = 'Gestiona las asesorías que tus alumnos han solicitado';
    } else {
        // Alumnos: Cargar docentes para el selector
        if (btnSolicitar) btnSolicitar.classList.remove('d-none');
        try {
            const resp = await fetch(`${API_ASESORIAS}/docentes/${currentUser.id_usuario}`);
            docentesDisponibles = await resp.json();
            const select = document.getElementById('selectDocente');
            select.innerHTML = '<option value="">Seleccione un docente...</option>';
            docentesDisponibles.forEach(d => {
                select.innerHTML += `<option value="${d.id_usuario}">${d.nombres} ${d.apellidos} — ${d.codigo} ${d.nombre_curso}</option>`;
            });
        } catch (e) { console.error('Error cargando docentes:', e); }

        // Formulario de solicitud
        document.getElementById('formSolicitarAsesoria').addEventListener('submit', async (e) => {
            e.preventDefault();
            await solicitarAsesoria();
        });
    }

    // Filtro de estado
    filtroEstado.addEventListener('change', () => cargarAsesorias());

    // Cargar asesorías
    await cargarAsesorias();
});

// =============================================
// 1. CARGAR LISTA DE ASESORÍAS
// =============================================
async function cargarAsesorias() {
    const container = document.getElementById('asesoriasContainer');
    const filtro = document.getElementById('filtroEstado').value;
    
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted mt-2">Cargando asesorías...</p>
        </div>`;

    try {
        const resp = await fetch(`${API_ASESORIAS}/${currentUser.id_usuario}/${encodeURIComponent(currentUser.rol)}`);
        let asesorias = await resp.json();

        // Filtrar por estado si aplica
        if (filtro !== 'todas') {
            asesorias = asesorias.filter(a => a.estado === filtro);
        }

        if (asesorias.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-calendar-x" style="font-size: 3rem; color: #94a3b8;"></i>
                    <p class="text-muted mt-3">No hay asesorías ${filtro !== 'todas' ? `con estado "${filtro}"` : 'registradas'}</p>
                    ${!esDocente ? '<p class="text-muted small">Solicita una asesoría con el botón de arriba</p>' : ''}
                </div>`;
            return;
        }

        container.innerHTML = '';
        asesorias.forEach(a => {
            container.insertAdjacentHTML('beforeend', renderAsesoria(a));
        });

        asignarEventos();
        actualizarContadores(asesorias);

    } catch (error) {
        console.error('Error cargando asesorías:', error);
        container.innerHTML = '<div class="text-center text-danger py-4">Error al cargar asesorías</div>';
    }
}

// =============================================
// 2. RENDERIZAR UNA TARJETA DE ASESORÍA
// =============================================
function renderAsesoria(a) {
    const fecha = new Date(a.fecha_hora);
    const fechaStr = fecha.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    // Estado badge
    const estadoConfig = {
        pendiente: { bg: 'bg-warning text-dark', icon: 'bi-hourglass-split', label: 'Pendiente' },
        confirmada: { bg: 'bg-success', icon: 'bi-check-circle', label: 'Confirmada' },
        rechazada: { bg: 'bg-danger', icon: 'bi-x-circle', label: 'Rechazada' }
    };
    const est = estadoConfig[a.estado] || estadoConfig.pendiente;

    // Borde lateral de color según estado
    const borderColor = a.estado === 'confirmada' ? '#2e7d32' : a.estado === 'rechazada' ? '#dc3545' : '#ffc107';

    // Acciones según rol
    let accionesHtml = '';
    if (esDocente && a.estado === 'pendiente') {
        accionesHtml = `
            <div class="d-flex gap-2 mt-3 pt-3 border-top">
                <button class="btn btn-sm btn-success flex-grow-1 fw-bold btn-confirmar" data-id="${a.id_asesoria}">
                    <i class="bi bi-check-lg me-1"></i>Confirmar
                </button>
                <button class="btn btn-sm btn-outline-danger flex-grow-1 fw-bold btn-rechazar" data-id="${a.id_asesoria}">
                    <i class="bi bi-x-lg me-1"></i>Rechazar
                </button>
            </div>`;
    } else if (esDocente && a.estado === 'confirmada') {
        accionesHtml = `
            <div class="mt-3 pt-3 border-top d-flex gap-2">
                <a href="${a.enlace_reunion || '#'}" target="_blank" class="btn btn-sm btn-primary flex-grow-1 fw-bold ${!a.enlace_reunion ? 'disabled' : ''}">
                    <i class="bi bi-camera-video me-1"></i>Ir a la Reunión
                </a>
                <button class="btn btn-sm btn-outline-secondary fw-bold btn-editar-enlace-asesoria" data-id="${a.id_asesoria}" data-enlace="${a.enlace_reunion || ''}" title="Editar Enlace">
                    <i class="bi bi-pencil"></i>
                </button>
            </div>`;
    }

    if (!esDocente) {
        if (a.estado === 'confirmada' && a.enlace_reunion) {
            accionesHtml = `
                <div class="mt-3 pt-3 border-top">
                    <a href="${a.enlace_reunion}" target="_blank" class="btn btn-sm btn-primary w-100 fw-bold">
                        <i class="bi bi-camera-video me-1"></i>Unirse a la Reunión
                    </a>
                </div>`;
        }
    }

    // Info de personas
    let personaInfo = '';
    if (esDocente) {
        personaInfo = `
            <span class="text-muted" style="font-size: 0.75rem;">
                <i class="bi bi-person me-1"></i>Solicitado por: <strong>${a.solicitante_nombres} ${a.solicitante_apellidos}</strong>
            </span>`;
    } else {
        personaInfo = `
            <span class="text-muted" style="font-size: 0.75rem;">
                <i class="bi bi-person-workspace me-1"></i>Docente: <strong>${a.docente_nombres} ${a.docente_apellidos}</strong>
            </span>`;
    }

    return `
    <div class="col-md-6 col-xl-4">
        <div class="card border-0 shadow-sm rounded-3 h-100 overflow-hidden asesoria-card" style="transition: all 0.2s;">
            <div class="d-flex">
                <div style="width: 5px; background-color: ${borderColor};"></div>
                <div class="card-body p-3 flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge ${est.bg} rounded-pill">
                            <i class="bi ${est.icon} me-1"></i>${est.label}
                        </span>
                        <button class="btn btn-sm btn-light rounded-pill px-2 py-0 btn-ver-detalle" data-id="${a.id_asesoria}" title="Ver detalle">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                    
                    <h6 class="fw-bold text-dark mb-1">${a.motivo}</h6>
                    <p class="text-muted small mb-2" style="line-height: 1.4;">${a.descripcion || 'Sin descripción adicional'}</p>
                    
                    ${personaInfo}
                    
                    <div class="d-flex gap-3 mt-2">
                        <span class="text-muted" style="font-size: 0.75rem;">
                            <i class="bi bi-calendar-event me-1"></i>${fechaStr}
                        </span>
                        <span class="text-muted" style="font-size: 0.75rem;">
                            <i class="bi bi-clock me-1"></i>${horaStr}
                        </span>
                    </div>
                    
                    ${a.nombre_grupo ? `<span class="badge bg-info-subtle text-info mt-2"><i class="bi bi-people me-1"></i>${a.nombre_grupo}</span>` : ''}
                    
                    ${accionesHtml}
                </div>
            </div>
        </div>
    </div>`;
}

// =============================================
// 3. SOLICITAR ASESORÍA (Alumno)
// =============================================
async function solicitarAsesoria() {
    const btn = document.getElementById('btnGuardarSolicitud');
    const datos = {
        id_docente: document.getElementById('selectDocente').value,
        id_solicitante: currentUser.id_usuario,
        motivo: document.getElementById('inputMotivo').value.trim(),
        descripcion: document.getElementById('inputDescripcion').value.trim(),
        fecha_hora: document.getElementById('inputFechaHora').value,
        enlace_reunion: ''
    };

    if (!datos.id_docente || !datos.motivo || !datos.fecha_hora) {
        alert('Completa todos los campos obligatorios.');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';

    try {
        const resp = await fetch(`${API_ASESORIAS}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (resp.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalSolicitar'));
            modal.hide();
            document.getElementById('formSolicitarAsesoria').reset();
            await cargarAsesorias();
        } else {
            const data = await resp.json();
            alert('Error: ' + data.mensaje);
        }
    } catch (error) {
        console.error('Error al solicitar asesoría:', error);
        alert('Error de conexión con el servidor.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-send me-2"></i>Enviar Solicitud';
    }
}

// =============================================
// 4. ASIGNAR EVENTOS A BOTONES
// =============================================
function asignarEventos() {
    // Confirmar asesoría (Docente)
    document.querySelectorAll('.btn-confirmar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idAsesoria = e.target.closest('.btn-confirmar').dataset.id;
            const enlace = prompt('Ingresa el enlace de la reunión (Zoom/Teams/Meet):', 'https://zoom.us/j/');
            if (enlace === null) return;

            try {
                const resp = await fetch(`${API_ASESORIAS}/${idAsesoria}/estado`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: 'confirmada', enlace_reunion: enlace })
                });
                if (resp.ok) await cargarAsesorias();
            } catch (err) { console.error(err); }
        });
    });

    // Editar enlace asesoría (Docente - desde la tarjeta)
    document.querySelectorAll('.btn-editar-enlace-asesoria').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.target.closest('.btn-editar-enlace-asesoria');
            const idAsesoria = btnEl.dataset.id;
            const enlaceActual = btnEl.dataset.enlace || '';
            
            const nuevoEnlace = prompt('Edita el enlace de la reunión (Zoom/Teams/Meet):', enlaceActual);
            if (nuevoEnlace === null || nuevoEnlace === enlaceActual) return;

            try {
                const resp = await fetch(`${API_ASESORIAS}/${idAsesoria}/estado`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: 'confirmada', enlace_reunion: nuevoEnlace })
                });

                if (resp.ok) {
                    await cargarAsesorias();
                } else {
                    const err = await resp.json();
                    alert('Error: ' + err.mensaje);
                }
            } catch (err) {
                console.error(err);
                alert('Error al actualizar el enlace');
            }
        });
    });

    // Rechazar asesoría (Docente)
    document.querySelectorAll('.btn-rechazar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idAsesoria = e.target.closest('.btn-rechazar').dataset.id;
            if (!confirm('¿Seguro que deseas rechazar esta solicitud?')) return;

            try {
                const resp = await fetch(`${API_ASESORIAS}/${idAsesoria}/estado`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: 'rechazada' })
                });
                if (resp.ok) await cargarAsesorias();
            } catch (err) { console.error(err); }
        });
    });

    // Ver detalle
    document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idAsesoria = e.target.closest('.btn-ver-detalle').dataset.id;
            await mostrarDetalle(idAsesoria);
        });
    });
}

// =============================================
// 5. MOSTRAR DETALLE EN MODAL
// =============================================
async function mostrarDetalle(idAsesoria) {
    const body = document.getElementById('detalleAsesoriaBody');
    body.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';

    const modal = new bootstrap.Modal(document.getElementById('modalDetalle'));
    modal.show();

    try {
        const resp = await fetch(`${API_ASESORIAS}/detalle/${idAsesoria}`);
        const data = await resp.json();

        const fecha = new Date(data.fecha_hora);
        const estadoConfig = {
            pendiente: { bg: 'bg-warning text-dark', label: 'Pendiente' },
            confirmada: { bg: 'bg-success', label: 'Confirmada' },
            rechazada: { bg: 'bg-danger', label: 'Rechazada' }
        };
        const est = estadoConfig[data.estado];

        let participantesHtml = '';
        if (data.participantes && data.participantes.length > 0) {
            participantesHtml = data.participantes.map(p => `
                <li class="list-group-item d-flex align-items-center py-2 px-0 border-0">
                    <div class="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-2" style="width:32px;height:32px;font-size:0.75rem;font-weight:700;">
                        ${p.nombres.charAt(0)}${p.apellidos.charAt(0)}
                    </div>
                    <div>
                        <span class="d-block small fw-semibold">${p.nombres} ${p.apellidos}</span>
                        <span class="text-muted" style="font-size:0.7rem;">${p.correo}</span>
                    </div>
                </li>`).join('');
        } else {
            participantesHtml = '<li class="list-group-item text-muted small border-0 px-0">Sin participantes aún</li>';
        }

        body.innerHTML = `
            <div class="mb-3">
                <span class="badge ${est.bg} rounded-pill mb-2">${est.label}</span>
                <h5 class="fw-bold text-dark">${data.motivo}</h5>
                <p class="text-muted small">${data.descripcion || 'Sin descripción'}</p>
            </div>
            
            <div class="row g-3 mb-3">
                <div class="col-6">
                    <div class="bg-light rounded-3 p-3">
                        <span class="d-block text-muted small fw-bold text-uppercase mb-1">Docente</span>
                        <span class="fw-semibold">${data.docente_nombres} ${data.docente_apellidos}</span>
                        <span class="d-block text-muted small">${data.docente_correo}</span>
                    </div>
                </div>
                <div class="col-6">
                    <div class="bg-light rounded-3 p-3">
                        <span class="d-block text-muted small fw-bold text-uppercase mb-1">Solicitante</span>
                        <span class="fw-semibold">${data.solicitante_nombres} ${data.solicitante_apellidos}</span>
                        <span class="d-block text-muted small">${data.solicitante_correo}</span>
                    </div>
                </div>
            </div>

            <div class="row g-3 mb-3">
                <div class="col-6">
                    <div class="bg-light rounded-3 p-3">
                        <span class="d-block text-muted small fw-bold text-uppercase mb-1"><i class="bi bi-calendar3 me-1"></i>Fecha</span>
                        <span class="fw-semibold">${fecha.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                </div>
                <div class="col-6">
                    <div class="bg-light rounded-3 p-3">
                        <span class="d-block text-muted small fw-bold text-uppercase mb-1"><i class="bi bi-clock me-1"></i>Hora</span>
                        <span class="fw-semibold">${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>

            ${data.estado === 'confirmada' ? `
            <div class="bg-primary-subtle rounded-3 p-3 mb-3 d-flex justify-content-between align-items-center">
                <div>
                    <span class="d-block text-primary small fw-bold text-uppercase mb-1"><i class="bi bi-camera-video me-1"></i>Enlace de Reunión</span>
                    ${data.enlace_reunion ? `<a href="${data.enlace_reunion}" target="_blank" class="fw-semibold text-primary text-break">${data.enlace_reunion}</a>` : `<span class="fw-semibold text-muted">Sin enlace asignado</span>`}
                </div>
                ${esDocente ? `<button class="btn btn-sm btn-outline-primary ms-3" onclick="editarEnlaceAsesoriaPrompt(${data.id_asesoria}, '${data.enlace_reunion || ''}')" title="Editar enlace"><i class="bi bi-pencil"></i></button>` : ''}
            </div>` : ''}

            ${data.nombre_grupo ? `
            <div class="bg-info-subtle rounded-3 p-3 mb-3">
                <span class="d-block text-info small fw-bold text-uppercase mb-1"><i class="bi bi-people me-1"></i>Grupo</span>
                <span class="fw-semibold">${data.nombre_grupo}</span>
            </div>` : ''}

            <div class="mt-3">
                <h6 class="fw-bold text-dark mb-2"><i class="bi bi-people me-2"></i>Participantes (${data.participantes ? data.participantes.length : 0})</h6>
                <ul class="list-group list-group-flush">${participantesHtml}</ul>
            </div>

            ${esDocente ? `
            <div class="mt-3 pt-3 border-top">
                <button class="btn btn-sm btn-outline-danger w-100" onclick="eliminarAsesoriaConfirm(${data.id_asesoria})">
                    <i class="bi bi-trash me-1"></i>Eliminar esta asesoría
                </button>
            </div>` : ''}
        `;

    } catch (error) {
        body.innerHTML = '<div class="text-center text-danger py-3">Error al cargar el detalle</div>';
    }
}

// =============================================
// 6. ELIMINAR ASESORÍA
// =============================================
async function eliminarAsesoriaConfirm(idAsesoria) {
    if (!confirm('¿Estás seguro de eliminar esta asesoría permanentemente?')) return;

    try {
        const resp = await fetch(`${API_ASESORIAS}/${idAsesoria}`, { method: 'DELETE' });
        if (resp.ok) {
            const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('modalDetalle'));
            if (modalDetalle) modalDetalle.hide();
            await cargarAsesorias();
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
    }
}

// =============================================
// 7. ACTUALIZAR CONTADORES
// =============================================
function actualizarContadores(asesorias) {
    const pendientes = asesorias.filter(a => a.estado === 'pendiente').length;
    const confirmadas = asesorias.filter(a => a.estado === 'confirmada').length;
    const rechazadas = asesorias.filter(a => a.estado === 'rechazada').length;

    const el1 = document.getElementById('contPendientes');
    const el2 = document.getElementById('contConfirmadas');
    const el3 = document.getElementById('contRechazadas');
    const el4 = document.getElementById('contTotal');

    if (el1) el1.textContent = pendientes;
    if (el2) el2.textContent = confirmadas;
    if (el3) el3.textContent = rechazadas;
    if (el4) el4.textContent = asesorias.length;
}

// =============================================
// 8. FUNCIÓN GLOBAL PARA EDITAR ENLACE DESDE EL MODAL
// =============================================
window.editarEnlaceAsesoriaPrompt = async function(idAsesoria, enlaceActual) {
    const nuevoEnlace = prompt('Edita el enlace de la reunión (Zoom/Teams/Meet):', enlaceActual);
    if (nuevoEnlace === null || nuevoEnlace === enlaceActual) return;

    try {
        const resp = await fetch(`${API_ASESORIAS}/${idAsesoria}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'confirmada', enlace_reunion: nuevoEnlace })
        });
        
        if (resp.ok) {
            await cargarAsesorias();
            await mostrarDetalle(idAsesoria); // Refrescar el modal
        } else {
            const err = await resp.json();
            alert('Error: ' + err.mensaje);
        }
    } catch (err) {
        console.error(err);
        alert('Error al actualizar el enlace');
    }
};
