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
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
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
