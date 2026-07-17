// assets/js/agenda.js

const API_CAL = 'https://virtualclass-sm1i.onrender.com/api/calendario';

let mesActual, anioActual;
let eventosDelMes = [];
let esDocente = false;
let clasesDocente = [];

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const TIPO_COLORES = {
    examen:  { bg: '#ffeef0', text: '#dc3545', icon: 'bi-journal-x', label: 'Examen' },
    entrega: { bg: '#fff3e0', text: '#e65100', icon: 'bi-file-earmark-arrow-up', label: 'Entrega' },
    feriado: { bg: '#e8f5e9', text: '#2e7d32', icon: 'bi-calendar-heart', label: 'Feriado' },
    reunion: { bg: '#e8f0fe', text: '#1a73e8', icon: 'bi-people', label: 'Reunión' },
    otro:    { bg: '#f3f4f6', text: '#6b7280', icon: 'bi-calendar-event', label: 'Otro' }
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) return;

    esDocente = currentUser.rol && currentUser.rol.toLowerCase().includes('docente');

    // Inicializar en el mes actual
    const hoy = new Date();
    mesActual = hoy.getMonth() + 1; // 1-12
    anioActual = hoy.getFullYear();

    // Configurar navegación del calendario
    document.getElementById('btnMesAnterior').addEventListener('click', () => {
        mesActual--;
        if (mesActual < 1) { mesActual = 12; anioActual--; }
        cargarCalendario();
    });

    document.getElementById('btnMesSiguiente').addEventListener('click', () => {
        mesActual++;
        if (mesActual > 12) { mesActual = 1; anioActual++; }
        cargarCalendario();
    });

    document.getElementById('btnHoy').addEventListener('click', () => {
        mesActual = hoy.getMonth() + 1;
        anioActual = hoy.getFullYear();
        cargarCalendario();
    });

    // Mostrar/ocultar botón de crear evento según rol
    const btnCrear = document.getElementById('btnCrearEvento');
    if (esDocente && btnCrear) {
        btnCrear.classList.remove('d-none');

        // Cargar clases del docente para el selector del modal
        try {
            const resp = await fetch(`${API_CAL}/clases/${currentUser.id_usuario}`);
            clasesDocente = await resp.json();
            const select = document.getElementById('selectClaseEvento');
            select.innerHTML = clasesDocente.map(c =>
                `<option value="${c.id_clase}">${c.codigo} - ${c.nombre_curso} (Sec. ${c.seccion})</option>`
            ).join('');
        } catch (e) { console.error('Error cargando clases:', e); }

        // Formulario de crear evento
        document.getElementById('formCrearEvento').addEventListener('submit', async (e) => {
            e.preventDefault();
            await crearEvento();
        });
    }

    // Cargar calendario y próximos eventos
    await cargarCalendario();
    await cargarProximosEventos();
});

// =============================================
// 1. CARGAR CALENDARIO DEL MES
// =============================================
async function cargarCalendario() {
    document.getElementById('tituloMes').textContent = `${MESES[mesActual - 1]} ${anioActual}`;

    try {
        const resp = await fetch(`${API_CAL}/eventos/${currentUser.id_usuario}/${encodeURIComponent(currentUser.rol)}?mes=${mesActual}&anio=${anioActual}`);
        const rawEventos = await resp.json();
        
        // Corregir zona horaria: PostgreSQL devuelve '...Z' (UTC) pero son horas locales
        eventosDelMes = rawEventos.map(ev => ({
            ...ev,
            fecha_inicio: ev.fecha_inicio ? ev.fecha_inicio.replace('Z', '') : ev.fecha_inicio,
            fecha_fin: ev.fecha_fin ? ev.fecha_fin.replace('Z', '') : ev.fecha_fin
        }));
        
        renderizarCalendario();
    } catch (error) {
        console.error('Error cargando eventos:', error);
    }
}

// =============================================
// 2. RENDERIZAR GRILLA DEL CALENDARIO
// =============================================
function renderizarCalendario() {
    const grid = document.getElementById('calendarGrid');

    // Calcular datos del mes
    const primerDia = new Date(anioActual, mesActual - 1, 1);
    const ultimoDia = new Date(anioActual, mesActual, 0);
    const diasEnMes = ultimoDia.getDate();

    // Día de la semana del primer día (0=Dom, 1=Lun...)
    // Ajustar para que Lunes sea el primer día
    let diaInicio = primerDia.getDay();
    diaInicio = diaInicio === 0 ? 6 : diaInicio - 1; // Lun=0, Mar=1, ..., Dom=6

    const hoy = new Date();
    const esHoyMes = hoy.getMonth() + 1 === mesActual && hoy.getFullYear() === anioActual;

    let html = '';

    // Días vacíos antes del primer día
    for (let i = 0; i < diaInicio; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const esHoy = esHoyMes && dia === hoy.getDate();
        const eventosDelDia = obtenerEventosDelDia(dia);

        html += `<div class="calendar-day${esHoy ? ' today' : ''}" ${eventosDelDia.length > 0 ? 'style="cursor:pointer"' : ''} ${eventosDelDia.length > 0 ? `onclick="mostrarEventosDelDia(${dia})"` : ''}>`;
        html += `<span class="day-number">${dia}</span>`;

        // Mostrar máximo 2 eventos en la celda
        eventosDelDia.slice(0, 2).forEach(ev => {
            const tipo = TIPO_COLORES[ev.tipo_evento] || TIPO_COLORES.otro;
            const hora = new Date(ev.fecha_inicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
            html += `<span class="calendar-event" style="background-color:${tipo.bg}; color:${tipo.text};" title="${ev.titulo_evento}">${hora} ${truncar(ev.titulo_evento, 12)}</span>`;
        });

        if (eventosDelDia.length > 2) {
            html += `<span class="calendar-event" style="background-color:#f3f4f6; color:#6b7280;">+${eventosDelDia.length - 2} más</span>`;
        }

        html += '</div>';
    }

    grid.innerHTML = html;
}

function obtenerEventosDelDia(dia) {
    return eventosDelMes.filter(ev => {
        const fecha = new Date(ev.fecha_inicio);
        return fecha.getDate() === dia;
    });
}

// =============================================
// 3. MOSTRAR DETALLE DE EVENTOS DE UN DÍA
// =============================================
function mostrarEventosDelDia(dia) {
    const eventos = obtenerEventosDelDia(dia);
    if (eventos.length === 0) return;

    const container = document.getElementById('detalleEventosContenido');
    const titulo = document.getElementById('detalleDiaTitulo');
    const fecha = new Date(anioActual, mesActual - 1, dia);

    titulo.textContent = fecha.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    container.innerHTML = eventos.map(ev => {
        const tipo = TIPO_COLORES[ev.tipo_evento] || TIPO_COLORES.otro;
        const horaInicio = new Date(ev.fecha_inicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        const horaFin = new Date(ev.fecha_fin).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

        return `
        <div class="card border-0 shadow-sm mb-3 rounded-3 overflow-hidden">
            <div class="d-flex">
                <div style="width: 5px; background-color: ${tipo.text};"></div>
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="badge rounded-pill mb-2" style="background-color: ${tipo.bg}; color: ${tipo.text};">
                                <i class="bi ${tipo.icon} me-1"></i>${tipo.label}
                            </span>
                            <h6 class="fw-bold text-dark mb-1">${ev.titulo_evento}</h6>
                            <p class="text-muted small mb-1">${ev.descripcion || 'Sin descripción'}</p>
                            <span class="text-muted" style="font-size: 0.75rem;">
                                <i class="bi bi-clock me-1"></i>${horaInicio} - ${horaFin}
                                <span class="ms-2"><i class="bi bi-book me-1"></i>${ev.codigo} - ${ev.nombre_curso}</span>
                            </span>
                        </div>
                        ${(esDocente && ev.codigo !== 'ASE') ? `
                        <div class="dropdown">
                            <button class="btn btn-sm btn-light rounded-pill" data-bs-toggle="dropdown">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                                <li><a class="dropdown-item small" href="#" onclick="eliminarEventoConfirm(${ev.id_evento})"><i class="bi bi-trash me-2 text-danger"></i>Eliminar</a></li>
                            </ul>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetalleEvento'));
    modal.show();
}

// =============================================
// 4. CARGAR PRÓXIMOS EVENTOS (panel lateral)
// =============================================
async function cargarProximosEventos() {
    const container = document.getElementById('proximosEventos');

    try {
        const resp = await fetch(`${API_CAL}/proximos/${currentUser.id_usuario}/${encodeURIComponent(currentUser.rol)}`);
        const eventos = await resp.json();

        if (eventos.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-calendar-check text-muted" style="font-size: 2rem;"></i>
                    <p class="text-muted small mt-2">No hay eventos próximos</p>
                </div>`;
            return;
        }

        container.innerHTML = eventos.map(ev => {
            const tipo = TIPO_COLORES[ev.tipo_evento] || TIPO_COLORES.otro;
            const fecha = new Date(ev.fecha_inicio);
            const diasRestantes = Math.ceil((fecha - new Date()) / (1000 * 60 * 60 * 24));

            let badgeClass, badgeText;
            if (diasRestantes <= 0) {
                badgeClass = 'bg-danger'; badgeText = 'Hoy';
            } else if (diasRestantes <= 3) {
                badgeClass = 'bg-danger'; badgeText = `${diasRestantes} día${diasRestantes > 1 ? 's' : ''}`;
            } else if (diasRestantes <= 7) {
                badgeClass = 'bg-warning text-dark'; badgeText = `${diasRestantes} días`;
            } else {
                badgeClass = 'bg-secondary'; badgeText = `${diasRestantes} días`;
            }

            return `
            <div class="card border-0 bg-white p-3 rounded-3 shadow-sm mb-3">
                <div class="d-flex align-items-start gap-3">
                    <div class="p-2 rounded-3" style="background-color: ${tipo.bg}; color: ${tipo.text};">
                        <i class="bi ${tipo.icon} fs-5"></i>
                    </div>
                    <div class="flex-grow-1">
                        <span class="d-block fw-bold text-dark small">${ev.titulo_evento}</span>
                        <span class="text-muted d-block mb-2" style="font-size: 0.75rem;">
                            <i class="bi bi-calendar-event me-1"></i>${fecha.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}
                            · ${ev.codigo}
                        </span>
                        <span class="badge ${badgeClass} rounded-pill" style="font-size: 0.7rem;">${badgeText}</span>
                    </div>
                </div>
            </div>`;
        }).join('');

    } catch (error) {
        console.error('Error cargando próximos eventos:', error);
    }
}

// =============================================
// 5. CREAR EVENTO (Docente)
// =============================================
async function crearEvento() {
    const btn = document.getElementById('btnGuardarEvento');
    const datos = {
        id_clase: document.getElementById('selectClaseEvento').value,
        titulo_evento: document.getElementById('inputTituloEvento').value.trim(),
        descripcion: document.getElementById('inputDescEvento').value.trim(),
        fecha_inicio: document.getElementById('inputFechaInicio').value,
        fecha_fin: document.getElementById('inputFechaFin').value,
        tipo_evento: document.getElementById('selectTipoEvento').value
    };

    if (!datos.titulo_evento || !datos.fecha_inicio || !datos.fecha_fin) {
        alert('Completa los campos obligatorios.');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

    try {
        const resp = await fetch(`${API_CAL}/eventos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (resp.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearEvento'));
            modal.hide();
            document.getElementById('formCrearEvento').reset();
            await cargarCalendario();
            await cargarProximosEventos();
        } else {
            const data = await resp.json();
            alert('Error: ' + data.mensaje);
        }
    } catch (error) {
        console.error('Error al crear evento:', error);
        alert('Error de conexión con el servidor.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Guardar Evento';
    }
}

// =============================================
// 6. ELIMINAR EVENTO (Docente)
// =============================================
async function eliminarEventoConfirm(idEvento) {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;

    try {
        const resp = await fetch(`${API_CAL}/eventos/${idEvento}`, { method: 'DELETE' });

        if (resp.ok) {
            // Cerrar modal de detalle si está abierto
            const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('modalDetalleEvento'));
            if (modalDetalle) modalDetalle.hide();

            await cargarCalendario();
            await cargarProximosEventos();
        } else {
            alert('Error al eliminar el evento.');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
    }
}

// =============================================
// UTILIDAD
// =============================================
function truncar(texto, max) {
    if (!texto) return '';
    return texto.length <= max ? texto : texto.substring(0, max) + '…';
}
