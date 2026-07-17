// assets/js/utils.js

// 1. Proteger las rutas (si no hay usuario, redirigir a login)
const usuarioGuardado = localStorage.getItem('usuario');
if (!usuarioGuardado && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
}

const currentUser = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

// URL base de la API (centralizada para evitar repetición)
const API_BASE_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:3000' 
    : 'https://virtualclass-sm1i.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser) return;

    // Renderizar datos del usuario en la barra superior
    renderizarPerfilUsuario();

    // Configurar botón de cerrar sesión
    const btnCerrarSesionList = document.querySelectorAll('a[href="index.html"].text-danger, .dropdown-item.text-danger');
    btnCerrarSesionList.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            cerrarSesion();
        });
    });

    // Resaltar el enlace activo en el sidebar basado en la URL
    resaltarMenuActivo();

    // Inyectar campanita y arrancar polling de notificaciones
    inyectarCampanita();
    cargarNotificaciones();
    setInterval(cargarNotificaciones, 60000);
});

function renderizarPerfilUsuario() {
    const greetingElement = document.querySelector('.top-navbar h5');
    const roleElement = document.querySelector('.top-navbar p.small');
    const profileName = document.querySelector('.dropdown span.fw-semibold');
    const profileRole = document.querySelector('.dropdown span.extra-small');
    const avatarCircles = document.querySelectorAll('.rounded-circle.bg-primary');

    const esDocente = currentUser.rol && currentUser.rol.toLowerCase().includes('docente');

    if (greetingElement) {
        // En el dashboard el saludo dice "¡Hola, Alumno!", lo cambiamos.
        // En otras vistas puede tener otro título, así que validamos si dice Hola.
        if (greetingElement.innerText.includes('¡Hola')) {
            greetingElement.innerText = `¡Hola, ${currentUser.nombres.split(' ')[0]}!`;
        }
    }

    if (roleElement && roleElement.innerText.includes('Ciclo Académico')) {
        // Si estamos en el dashboard, mostramos el rol debajo del saludo
        roleElement.innerText = currentUser.rol || 'Estudiante';
    }

    if (profileName) profileName.innerText = `${currentUser.nombres} ${currentUser.apellidos}`;
    if (profileRole) profileRole.innerText = currentUser.rol || 'Estudiante';

    // Iniciales
    if (avatarCircles.length > 0) {
        const iniciales = (currentUser.nombres.charAt(0) + currentUser.apellidos.charAt(0)).toUpperCase();
        avatarCircles.forEach(circle => {
            circle.innerText = iniciales;
        });
    }
}

function cerrarSesion() {
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
}

function resaltarMenuActivo() {
    const currentPage = window.location.pathname.split('/').pop() || 'inicio.html';
    const navLinks = document.querySelectorAll('#sidebar .nav-link-custom');
    
    navLinks.forEach(link => {
        // Ignorar el de cerrar sesión
        if (link.classList.contains('text-danger')) return;
        
        const href = link.getAttribute('href');
        if (href && href === currentPage) {
            link.classList.add('active');
        } else if (href && href !== '#') {
            link.classList.remove('active');
        }
    });
}

// =============================================
// SISTEMA DE NOTIFICACIONES (CAMPANITA)
// =============================================

function inyectarCampanita() {
    if (document.getElementById('notifDropdownContainer')) return;
    
    const topNavbar = document.querySelector('.top-navbar');
    if (!topNavbar) return;
    
    const bellHTML = `
        <div class="dropdown me-3" id="notifDropdownContainer">
            <div class="position-relative" data-bs-toggle="dropdown" aria-expanded="false" style="cursor: pointer; padding: 8px;">
                <i class="bi bi-bell text-muted" style="font-size: 1.4rem;"></i>
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="notifBadge" style="display: none; font-size: 0.65rem; padding: 0.25em 0.5em;">0</span>
            </div>
            <div class="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2 p-0 rounded-3" style="width: 340px; overflow: hidden; z-index: 1050;">
                <div class="bg-primary text-white px-3 py-2 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 fw-bold small"><i class="bi bi-bell-fill me-1"></i> Notificaciones</h6>
                    <span class="badge bg-light text-primary" style="cursor:pointer;" onclick="marcarTodasLeidas()">Marcar leídas</span>
                </div>
                <div id="notifList" class="list-group list-group-flush" style="max-height: 350px; overflow-y: auto;">
                    <div class="text-center py-4 text-muted small">
                        <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        Cargando notificaciones...
                    </div>
                </div>
            </div>
        </div>
    `;

    // Buscar el último contenedor flex de la barra superior (donde está el avatar)
    const lastChild = topNavbar.lastElementChild;
    if (lastChild && lastChild.classList.contains('d-flex') && lastChild.classList.contains('align-items-center')) {
        lastChild.insertAdjacentHTML('afterbegin', bellHTML);
    } else {
        // Fallback: crear un wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'd-flex align-items-center';
        wrapper.innerHTML = bellHTML;
        if (lastChild) {
            topNavbar.insertBefore(wrapper, lastChild);
            wrapper.appendChild(lastChild);
        } else {
            topNavbar.appendChild(wrapper);
        }
    }
}

async function cargarNotificaciones() {
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');
    if (!badge || !list || !currentUser) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/notificaciones/${currentUser.id_usuario}`);
        
        if (!res.ok) {
            // Si el servidor responde pero con error, mostrar mensaje amigable
            list.innerHTML = '<div class="text-center py-4 text-muted small"><i class="bi bi-wifi-off me-1"></i> No se pudieron cargar las notificaciones.</div>';
            return;
        }
        
        const data = await res.json();
        
        // Actualizar badge
        if (data.unread > 0) {
            badge.style.display = 'block';
            badge.innerText = data.unread > 9 ? '+9' : data.unread;
        } else {
            badge.style.display = 'none';
        }
        
        // Renderizar lista
        if (!data.notificaciones || data.notificaciones.length === 0) {
            list.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-bell-slash fs-3 d-block mb-2 opacity-50"></i>
                    <span class="small">No tienes notificaciones recientes.</span>
                </div>`;
            return;
        }
        
        list.innerHTML = data.notificaciones.map(n => {
            const bgClass = n.leida ? 'bg-white' : 'bg-light';
            const borderStyle = n.leida ? 'border-left: 3px solid transparent' : 'border-left: 3px solid var(--bs-primary)';
            const titulo = n.titulo || '';
            const tituloLower = titulo.toLowerCase();
            
            // Iconos según tipo de notificación
            let icon = 'bi-info-circle text-info';
            if (tituloLower.includes('calificación') || tituloLower.includes('calific') || tituloLower.includes('nota')) {
                icon = 'bi-journal-check text-success';
            } else if (tituloLower.includes('asesoría') || tituloLower.includes('asesoria')) {
                icon = 'bi-headset text-primary';
            } else if (tituloLower.includes('anuncio')) {
                icon = 'bi-megaphone text-warning';
            } else if (tituloLower.includes('foro') || tituloLower.includes('respuesta')) {
                icon = 'bi-chat-square-text text-info';
            } else if (tituloLower.includes('actividad') || tituloLower.includes('evaluación') || tituloLower.includes('tarea')) {
                icon = 'bi-clipboard-check text-danger';
            }

            // Escapar comillas simples en el enlace para evitar errores JS
            const enlaceSafe = (n.enlace_opcional || '').replace(/'/g, "\\'");
            
            // Formato de fecha relativo
            const fechaTexto = formatearFechaRelativa(n.fecha_creacion);
            
            return `
                <div class="list-group-item list-group-item-action p-3 ${bgClass}" style="${borderStyle}; cursor: pointer;" onclick="marcarUnaLeida(${n.id_notificacion}, '${enlaceSafe}')">
                    <div class="d-flex align-items-start">
                        <div class="me-3 mt-1"><i class="bi ${icon} fs-5"></i></div>
                        <div class="flex-grow-1">
                            <div class="fw-semibold small text-dark mb-1">${titulo}</div>
                            <div class="small text-muted mb-1" style="line-height: 1.3;">${n.mensaje}</div>
                            <div class="text-muted" style="font-size: 0.65rem;"><i class="bi bi-clock me-1"></i>${fechaTexto}</div>
                        </div>
                        ${!n.leida ? '<span class="ms-2 mt-1 bg-primary rounded-circle" style="width:8px;height:8px;display:inline-block;flex-shrink:0;"></span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch(e) {
        console.warn('Notificaciones: servidor no disponible -', e.message);
        // Si falla completamente (servidor caído), mostrar mensaje amigable en vez de "Cargando..."
        list.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="bi bi-wifi-off fs-3 d-block mb-2 opacity-50"></i>
                <span class="small">Servidor no disponible. Se reintentará automáticamente.</span>
            </div>`;
    }
}

// Formato de fecha relativo (hace 5 min, hace 2 horas, etc.)
function formatearFechaRelativa(fechaISO) {
    const ahora = new Date();
    const fecha = new Date(fechaISO);
    const diffMs = ahora - fecha;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

async function marcarTodasLeidas() {
    try {
        await fetch(`${API_BASE_URL}/api/notificaciones/${currentUser.id_usuario}/leer-todas`, { method: 'PUT' });
        cargarNotificaciones();
    } catch(e) { console.warn('No se pudo marcar como leídas:', e.message); }
}

async function marcarUnaLeida(id, enlace) {
    try {
        await fetch(`${API_BASE_URL}/api/notificaciones/leida/${id}`, { method: 'PUT' });
        if (enlace && enlace.trim() !== '' && enlace !== 'null' && enlace !== 'undefined') {
            window.location.href = enlace;
        } else {
            cargarNotificaciones();
        }
    } catch(e) { console.warn('No se pudo marcar como leída:', e.message); }
}
