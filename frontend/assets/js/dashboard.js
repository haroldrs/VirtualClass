// assets/js/dashboard.js

const API_BASE_GLOBAL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
    ? 'http://localhost:3000/api'
    : '${API_BASE_GLOBAL}';

document.addEventListener('DOMContentLoaded', async () => {
    // currentUser viene de utils.js
    if (!currentUser) return;

    const rowContainer = document.querySelector('.row.row-cols-1.row-cols-md-2.row-cols-xl-3.g-4');
    const headerTitle = document.querySelector('.row.mb-4 h4');
    const headerSubtitle = document.querySelector('.row.mb-4 p');

    const esDocente = currentUser.rol.toLowerCase().includes('docente');

    if (esDocente) {
        headerTitle.innerText = "Mis Asignaturas a Cargo";
        headerSubtitle.innerText = "Selecciona un curso para ver alumnos y gestionar sesiones.";
    }

    try {
        // Fetch cursos
        const response = await fetch(`${API_BASE_GLOBAL}/cursos/mis-cursos/${currentUser.id_usuario}/${currentUser.rol}`);
        const cursos = await response.json();

        if (response.ok) {
            rowContainer.innerHTML = ''; // Limpiar estáticos

            if (cursos.length === 0) {
                rowContainer.innerHTML = '<div class="col-12"><p class="text-muted">No tienes cursos asignados.</p></div>';
                return;
            }

            cursos.forEach(curso => {
                const isDocenteText = esDocente ? 'Gestionar' : 'Ingresar';
                const instructorText = esDocente ? `Sec: ${curso.seccion}` : `${curso.docente_nombres} ${curso.docente_apellidos}`;
                const icon = esDocente ? 'bi-diagram-3' : 'bi-person-video3';

                const cardHTML = `
                <div class="col">
                    <div class="card course-card h-100">
                        <div class="card-body p-4 d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <span class="course-badge">${curso.codigo}</span>
                                <span class="text-muted small fw-semibold">Sección ${curso.seccion}</span>
                            </div>
                            <h5 class="card-title fw-bold text-dark mb-2">${curso.nombre}</h5>
                            <p class="card-text text-muted small flex-grow-1">${curso.descripcion}</p>
                            <div class="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
                                <span class="text-muted small"><i class="bi ${icon} me-1"></i> ${instructorText}</span>
                                <a href="clase-detalle.html?id=${curso.id_clase}" class="btn btn-sm btn-primary px-3 rounded-pill fw-semibold">${isDocenteText}</a>
                            </div>
                        </div>
                    </div>
                </div>`;
                rowContainer.insertAdjacentHTML('beforeend', cardHTML);
            });
        }
    } catch (error) {
        console.error('Error fetching cursos:', error);
    }
});
