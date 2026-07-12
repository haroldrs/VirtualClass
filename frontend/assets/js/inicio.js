// assets/js/inicio.js

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) return;

    const API_BASE = 'https://virtualclass-sm1i.onrender.com/api';

    const esDocente = currentUser.rol && currentUser.rol.toLowerCase().includes('docente');

    // Personalizar el hero
    const heroSaludo = document.getElementById('heroSaludo');
    if (heroSaludo) {
        heroSaludo.innerText = `¡Bienvenido, ${currentUser.nombres.split(' ')[0]}!`;
    }

    const heroDesc = document.getElementById('heroDescripcion');
    if (heroDesc) {
        heroDesc.innerText = esDocente
            ? 'Gestiona tus cursos, revisa solicitudes y mantente al día con los comunicados institucionales.'
            : 'Revisa tus cursos, calificaciones y mantente al día con los comunicados de la institución.';
    }

    // ==========================================
    // CARGAR ANUNCIOS
    // ==========================================
    const anunciosContainer = document.getElementById('anunciosContainer');

    try {
        const resAnuncios = await fetch(`${API_BASE}/anuncios/activos`);
        const anuncios = await resAnuncios.json();

        if (!resAnuncios.ok || anuncios.length === 0) {
            anunciosContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-megaphone" style="font-size: 3rem; color: #cbd5e1;"></i>
                    <p class="text-muted mt-3">No hay comunicados publicados por el momento.</p>
                </div>`;
        } else {
            anunciosContainer.innerHTML = '';
            anuncios.forEach((anuncio, index) => {
                const fecha = new Date(anuncio.fecha_publicacion);
                const fechaStr = fecha.toLocaleDateString('es-PE', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                });

                const nivelConfig = {
                    info: { icon: 'bi-info-circle-fill', label: 'Informativo', badgeClass: 'nivel-badge-info', iconClass: 'nivel-icon-info' },
                    advertencia: { icon: 'bi-exclamation-triangle-fill', label: 'Advertencia', badgeClass: 'nivel-badge-advertencia', iconClass: 'nivel-icon-advertencia' },
                    urgente: { icon: 'bi-exclamation-circle-fill', label: 'Urgente', badgeClass: 'nivel-badge-urgente', iconClass: 'nivel-icon-urgente' }
                };
                const nivel = nivelConfig[anuncio.nivel] || nivelConfig.info;
                const autorText = anuncio.autor_nombres
                    ? `${anuncio.autor_nombres} ${anuncio.autor_apellidos}`
                    : 'Administración';

                const cardHtml = `
                    <div class="card anuncio-card anuncio-nivel-${anuncio.nivel} mb-3" style="animation-delay: ${index * 0.08}s;">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="badge rounded-pill ${nivel.badgeClass} px-3 py-2">
                                    <i class="bi ${nivel.icon} me-1"></i>${nivel.label}
                                </span>
                                <span class="text-muted" style="font-size: 0.75rem;">
                                    <i class="bi bi-calendar3 me-1"></i>${fechaStr}
                                </span>
                            </div>
                            <h5 class="fw-bold text-dark mt-2 mb-2">${anuncio.titulo}</h5>
                            <p class="text-muted mb-2" style="line-height: 1.6;">${anuncio.contenido}</p>
                            <div class="d-flex align-items-center mt-3 pt-2 border-top">
                                <div class="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 28px; height: 28px; font-size: 0.7rem; font-weight: 700;">
                                    ${autorText.charAt(0)}
                                </div>
                                <span class="text-muted small">Publicado por <strong>${autorText}</strong></span>
                            </div>
                        </div>
                    </div>
                `;
                anunciosContainer.insertAdjacentHTML('beforeend', cardHtml);
            });

            // Actualizar stat de anuncios
            const statAnuncios = document.getElementById('statAnuncios');
            if (statAnuncios) statAnuncios.innerText = anuncios.length;
        }
    } catch (error) {
        console.error('Error cargando anuncios:', error);
        anunciosContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-wifi-off" style="font-size: 3rem; color: #cbd5e1;"></i>
                <p class="text-muted mt-3">No se pudieron cargar los comunicados.</p>
            </div>`;
    }

    // ==========================================
    // CARGAR ESTADÍSTICAS RÁPIDAS
    // ==========================================
    try {
        const resCursos = await fetch(`${API_BASE}/cursos/mis-cursos/${currentUser.id_usuario}/${currentUser.rol}`);
        const cursos = await resCursos.json();
        const statCursos = document.getElementById('statCursos');
        if (statCursos && Array.isArray(cursos)) statCursos.innerText = cursos.length;
    } catch (e) {
        console.error('Error stats cursos:', e);
    }

    try {
        const resAsesorias = await fetch(`${API_BASE}/asesorias/${currentUser.id_usuario}/${currentUser.rol}`);
        const asesorias = await resAsesorias.json();
        const statAsesorias = document.getElementById('statAsesorias');
        if (statAsesorias && Array.isArray(asesorias)) {
            const pendientes = asesorias.filter(a => a.estado === 'pendiente' || a.estado === 'confirmada').length;
            statAsesorias.innerText = pendientes;
        }
    } catch (e) {
        console.error('Error stats asesorias:', e);
    }

    try {
        const resForos = await fetch(`${API_BASE}/foros/${currentUser.id_usuario}/${currentUser.rol}`);
        const foros = await resForos.json();
        const statForos = document.getElementById('statForos');
        if (statForos && Array.isArray(foros)) {
            let totalTemas = 0;
            foros.forEach(f => { totalTemas += f.temas ? f.temas.length : 0; });
            statForos.innerText = totalTemas;
        }
    } catch (e) {
        console.error('Error stats foros:', e);
    }
});
