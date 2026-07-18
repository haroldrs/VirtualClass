// assets/js/inicio.js

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) return;

    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000/api'
        : 'https://virtualclass-sm1i.onrender.com/api';

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
            const anunciosConImagen = anuncios.filter(a => a.imagen_url && a.imagen_url !== 'null' && a.imagen_url.trim() !== '');
            const anunciosTexto = anuncios.filter(a => !a.imagen_url || a.imagen_url === 'null' || a.imagen_url.trim() === '');

            let finalHtml = '';

            const generarFecha = (fechaPub) => {
                const fecha = new Date(fechaPub);
                fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
                return fecha.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            };

            const getBadge = (nivel) => {
                const nivelConfig = {
                    info: { icon: 'bi-info-circle-fill', label: 'Informativo', badgeClass: 'nivel-badge-info' },
                    advertencia: { icon: 'bi-exclamation-triangle-fill', label: 'Advertencia', badgeClass: 'nivel-badge-advertencia' },
                    urgente: { icon: 'bi-exclamation-circle-fill', label: 'Urgente', badgeClass: 'nivel-badge-urgente' }
                };
                return nivelConfig[nivel] || nivelConfig.info;
            };

            // 1. CAROUSEL PARA ANUNCIOS CON IMAGEN
            if (anunciosConImagen.length > 0) {
                let indicatorsHtml = '';
                let innerHtml = '';

                anunciosConImagen.forEach((anuncio, index) => {
                    const fechaStr = generarFecha(anuncio.fecha_publicacion);
                    const nivel = getBadge(anuncio.nivel);
                    const autorText = anuncio.autor_nombres ? `${anuncio.autor_nombres} ${anuncio.autor_apellidos}` : 'Administración';

                    indicatorsHtml += `<button type="button" data-bs-target="#anunciosCarousel" data-bs-slide-to="${index}" class="${index === 0 ? 'active' : ''} bg-light"></button>`;

                    innerHtml += `
                        <div class="carousel-item ${index === 0 ? 'active' : ''}">
                            <div class="card border-0 shadow-sm mx-auto position-relative" style="overflow:hidden; border-radius:12px; max-width:100%; height: 400px; background-color: #000;">
                                <!-- Imagen de fondo desenfocada -->
                                <div style="position: absolute; top: -10%; left: -10%; right: -10%; bottom: -10%; background-image: url('${anuncio.imagen_url}'); background-size: cover; background-position: center; filter: blur(25px) brightness(0.6); z-index: 1;"></div>
                                
                                <!-- Imagen principal nítida -->
                                <img src="${anuncio.imagen_url}" alt="Anuncio" style="position: relative; width: 100%; height: 100%; object-fit: contain; z-index: 2;">
                                
                                <div class="card-img-overlay d-flex flex-column justify-content-end p-0" style="z-index: 3;">
                                    <div style="background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 60%, transparent 100%); padding: 3rem 2rem 1.5rem 2rem;">
                                        <div class="d-flex align-items-center mb-2">
                                            <span class="badge rounded-pill ${nivel.badgeClass} px-3 py-2 me-3"><i class="bi ${nivel.icon} me-1"></i>${nivel.label}</span>
                                            <small class="text-light"><i class="bi bi-calendar3 me-1"></i>${fechaStr}</small>
                                        </div>
                                        <h4 class="card-title fw-bold mb-2 text-white">${anuncio.titulo}</h4>
                                        <p class="card-text mb-0 text-light" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${anuncio.contenido}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });

                finalHtml += `
                    <div id="anunciosCarousel" class="carousel slide mb-5" data-bs-ride="carousel" data-bs-interval="5000">
                        <div class="carousel-indicators" style="bottom: 10px;">${indicatorsHtml}</div>
                        <div class="carousel-inner" style="border-radius:12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">${innerHtml}</div>
                        <button class="carousel-control-prev" type="button" data-bs-target="#anunciosCarousel" data-bs-slide="prev" style="width: 8%;">
                            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Anterior</span>
                        </button>
                        <button class="carousel-control-next" type="button" data-bs-target="#anunciosCarousel" data-bs-slide="next" style="width: 8%;">
                            <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Siguiente</span>
                        </button>
                    </div>
                `;
            }

            // 2. LISTA EN GRILLA PARA ANUNCIOS DE SOLO TEXTO
            if (anunciosTexto.length > 0) {
                let textoHtml = '<div class="row g-4">';
                anunciosTexto.forEach(anuncio => {
                    const fechaStr = generarFecha(anuncio.fecha_publicacion);
                    const nivel = getBadge(anuncio.nivel);
                    const autorText = anuncio.autor_nombres ? `${anuncio.autor_nombres} ${anuncio.autor_apellidos}` : 'Administración';

                    textoHtml += `
                        <div class="col-md-6 col-lg-4">
                            <div class="card h-100 anuncio-card anuncio-nivel-${anuncio.nivel} border-0 shadow-sm" style="animation:none;">
                                <div class="card-body p-4 d-flex flex-column">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <span class="badge rounded-pill ${nivel.badgeClass} px-3 py-2"><i class="bi ${nivel.icon} me-1"></i>${nivel.label}</span>
                                        <span class="text-muted" style="font-size: 0.75rem;"><i class="bi bi-calendar3 me-1"></i>${fechaStr}</span>
                                    </div>
                                    <h5 class="fw-bold text-dark mb-3">${anuncio.titulo}</h5>
                                    <p class="text-muted mb-4 flex-grow-1" style="line-height: 1.6;">${anuncio.contenido}</p>
                                    <div class="d-flex align-items-center pt-3 border-top mt-auto">
                                        <div class="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 28px; height: 28px; font-size: 0.7rem; font-weight: 700;">
                                            ${autorText.charAt(0)}
                                        </div>
                                        <span class="text-muted small">Por <strong>${autorText}</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                textoHtml += '</div>';
                finalHtml += `
                    <h5 class="fw-bold text-secondary mb-4 mt-2"><i class="bi bi-journal-text me-2"></i>Avisos Recientes</h5>
                    ${textoHtml}
                `;
            }

            anunciosContainer.innerHTML = finalHtml;

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
        const resCursos = await fetch(`${API_BASE}/cursos/mis-cursos/${currentUser.id_usuario}/${encodeURIComponent(currentUser.rol)}`);
        const cursos = await resCursos.json();
        const statCursos = document.getElementById('statCursos');
        if (statCursos && Array.isArray(cursos)) statCursos.innerText = cursos.length;
    } catch (e) {
        console.error('Error stats cursos:', e);
    }

    try {
        const resAsesorias = await fetch(`${API_BASE}/asesorias/${currentUser.id_usuario}/${encodeURIComponent(currentUser.rol)}`);
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
        const resForos = await fetch(`${API_BASE}/foros/mis-foros/${currentUser.id_usuario}/${encodeURIComponent(currentUser.rol)}`);
        const foros = await resForos.json();
        const statForos = document.getElementById('statForos');
        if (statForos && Array.isArray(foros)) {
            let totalTemas = 0;
            foros.forEach(f => { totalTemas += parseInt(f.total_temas) || 0; });
            statForos.innerText = totalTemas;
        }
    } catch (e) {
        console.error('Error stats foros:', e);
    }

    // ==========================================
    // CARGAR CONFIGURACIÓN GLOBAL
    // ==========================================
    try {
        const resConfig = await fetch(`${API_BASE}/admin/config`);
        if (resConfig.ok) {
            const config = await resConfig.json();

            const infoNombre = document.getElementById('infoInstitucionNombre');
            const infoDesc = document.getElementById('infoInstitucionDescripcion');
            const infoCorreo = document.getElementById('infoInstitucionCorreo');
            const infoTelf = document.getElementById('infoInstitucionTelefono');
            const infoDir = document.getElementById('infoInstitucionDireccion');

            if (infoNombre && config.institucion_nombre) infoNombre.innerText = config.institucion_nombre;
            if (infoDesc && config.institucion_descripcion) infoDesc.innerText = config.institucion_descripcion;
            if (infoCorreo && config.institucion_correo) infoCorreo.innerText = config.institucion_correo;
            if (infoTelf && config.institucion_telefono) infoTelf.innerText = config.institucion_telefono;
            if (infoDir && config.institucion_direccion) infoDir.innerText = config.institucion_direccion;

            // Si quieres actualizar el brand-text global (logo arriba a la izquierda si lo hay en inicio.html)
            const brandText = document.querySelector('.brand-text');
            if (brandText && config.institucion_nombre) brandText.innerText = config.institucion_nombre;
        }
    } catch (e) {
        console.error('Error cargando configuracion global:', e);
    }
});
