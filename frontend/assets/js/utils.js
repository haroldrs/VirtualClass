// assets/js/utils.js

// 1. Proteger las rutas (si no hay usuario, redirigir a login)
const usuarioGuardado = localStorage.getItem('usuario');
if (!usuarioGuardado && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
}

const currentUser = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

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
// SISTEMA DE NOTIFICACIONES
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    if (currentUser && document.querySelector('.bi-bell')) {
        cargarNotificaciones();
        // Polling cada 60 segundos
        setInterval(cargarNotificaciones, 60000);
    }
});

async function cargarNotificaciones() {
    try {
        const apiUrl = window.location.origin.includes('localhost') ? 'http://localhost:3000' : 'https://virtualclass-backend.onrender.com';
        const res = await fetch(`${apiUrl}/api/notificaciones/${currentUser.id_usuario}`);
        if (!res.ok) return;
        const data = await res.json();
        
        const badge = document.getElementById('notifBadge');
        const list = document.getElementById('notifList');
        if(!badge || !list) return;
        
        if (data.unread > 0) {
            badge.style.display = 'block';
            badge.innerText = data.unread > 9 ? '+9' : data.unread;
        } else {
            badge.style.display = 'none';
        }
        
        if (data.notificaciones.length === 0) {
            list.innerHTML = '<div class="text-center py-4 text-muted small">No tienes notificaciones recientes.</div>';
            return;
        }
        
        list.innerHTML = data.notificaciones.map(n => {
            const bgClass = n.leida ? 'bg-white' : 'bg-light';
            const icon = n.titulo.toLowerCase().includes('evaluación') || n.titulo.toLowerCase().includes('calific') ? 'bi-journal-check text-success' : 
                         n.titulo.toLowerCase().includes('asesoría') ? 'bi-headset text-primary' : 
                         n.titulo.toLowerCase().includes('anuncio') ? 'bi-megaphone text-warning' : 'bi-info-circle text-info';
            return `
                <div class="list-group-item list-group-item-action p-3 ${bgClass}" style="border-left: ${n.leida ? '0' : '4px solid var(--bs-primary)'}; cursor: pointer;" onclick="marcarUnaLeida(${n.id_notificacion}, '${n.enlace_opcional || ''}')">
                    <div class="d-flex align-items-start">
                        <div class="me-3 mt-1"><i class="bi ${icon} fs-5"></i></div>
                        <div>
                            <div class="fw-semibold small text-dark mb-1">${n.titulo}</div>
                            <div class="small text-muted mb-1" style="line-height: 1.2;">${n.mensaje}</div>
                            <div class="extra-small text-muted" style="font-size: 0.65rem;">${new Date(n.fecha_creacion).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch(e) {
        console.error('Error cargando notificaciones:', e);
    }
}

async function marcarTodasLeidas() {
    try {
        const apiUrl = window.location.origin.includes('localhost') ? 'http://localhost:3000' : 'https://virtualclass-backend.onrender.com';
        await fetch(`${apiUrl}/api/notificaciones/${currentUser.id_usuario}/leer-todas`, { method: 'PUT' });
        cargarNotificaciones();
    } catch(e) { console.error(e); }
}

async function marcarUnaLeida(id, enlace) {
    try {
        const apiUrl = window.location.origin.includes('localhost') ? 'http://localhost:3000' : 'https://virtualclass-backend.onrender.com';
        await fetch(`${apiUrl}/api/notificaciones/leida/${id}`, { method: 'PUT' });
        if (enlace && enlace.trim() !== '' && enlace !== 'null') {
            window.location.href = enlace;
        } else {
            cargarNotificaciones();
        }
    } catch(e) { console.error(e); }
}
