// assets/js/dashboard.js

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
    } else {
        // Mostrar botón de automatrícula
        const btnContainer = document.getElementById('btnMatriculaContainer');
        if (btnContainer) {
            btnContainer.style.display = 'block';
            const modalEl = document.getElementById('modalMatricula');
            if (modalEl) {
                modalEl.addEventListener('show.bs.modal', cargarCursosDisponibles);
            }
        }
    }

    try {
        // Fetch cursos
        const response = await fetch(`https://virtualclass-sm1i.onrender.com/api/cursos/mis-cursos/${currentUser.id_usuario}/${encodeURIComponent(currentUser.rol)}`);
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

async function cargarCursosDisponibles() {
    const contenedor = document.getElementById('listaCursosDisponibles');
    const statsInfo = document.getElementById('matriculaStats');
    
    contenedor.innerHTML = `
        <div class="text-center py-5 w-100">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted mt-2 small">Buscando cursos disponibles...</p>
        </div>`;
    
    try {
        const response = await fetch(`https://virtualclass-sm1i.onrender.com/api/cursos/disponibles/${currentUser.id_usuario}`);
        
        if (response.status === 403) {
            contenedor.innerHTML = `
                <div class="text-center py-5 w-100">
                    <i class="bi bi-x-circle text-danger mb-3" style="font-size: 3rem;"></i>
                    <h5 class="fw-bold">Matrícula Cerrada</h5>
                    <p class="text-muted">La institución ha deshabilitado la auto-matrícula temporalmente.</p>
                </div>`;
            statsInfo.innerText = "Proceso no disponible";
            return;
        }

        const cursos = await response.json();
        
        if (!response.ok) throw new Error('Error al cargar cursos');

        if (cursos.length === 0) {
            contenedor.innerHTML = '<div class="col-12 text-center py-4 text-muted">No hay cursos disponibles para el periodo activo.</div>';
            return;
        }

        contenedor.innerHTML = '';
        let totalCreditosMatriculados = 0;

        cursos.forEach(c => {
            if(c.esta_matriculado) totalCreditosMatriculados += parseInt(c.creditos) || 0;
            
            const btnMatricular = c.esta_matriculado 
                ? `<button class="btn btn-sm btn-outline-success fw-bold w-100" disabled><i class="bi bi-check-circle"></i> Matriculado</button>`
                : `<button class="btn btn-sm btn-primary fw-bold w-100" onclick="matricularse(${c.id_clase}, ${c.creditos}, ${totalCreditosMatriculados})">Matricularse</button>`;

            const html = `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm" style="border-radius:12px">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="badge bg-primary-subtle text-primary">${c.codigo}</span>
                            <span class="badge bg-light text-dark border">Sección ${c.seccion}</span>
                        </div>
                        <h6 class="fw-bold mb-1">${c.nombre}</h6>
                        <p class="text-muted small mb-3 flex-grow-1" style="font-size: 0.8rem;">${c.descripcion.substring(0, 100)}...</p>
                        
                        <div class="d-flex justify-content-between text-muted small mb-3">
                            <span><i class="bi bi-award"></i> ${c.creditos} Crds.</span>
                            <span><i class="bi bi-person"></i> ${c.docente_nombres ? c.docente_apellidos : 'Sin Asignar'}</span>
                        </div>
                        
                        ${btnMatricular}
                    </div>
                </div>
            </div>`;
            contenedor.insertAdjacentHTML('beforeend', html);
        });

        statsInfo.innerHTML = `Llevas <strong>${totalCreditosMatriculados} créditos</strong> inscritos. Límite: <strong>22</strong>.`;

    } catch (e) {
        console.error(e);
        contenedor.innerHTML = '<div class="col-12 text-center py-4 text-danger">Ocurrió un error al cargar la información.</div>';
    }
}

window.matricularse = async function(idClase, creditosCurso, creditosActuales) {
    if (creditosActuales + creditosCurso > 22) {
        alert(`No puedes matricularte. Este curso tiene ${creditosCurso} créditos y excederías tu límite de 22 créditos.`);
        return;
    }
    
    if(!confirm("¿Estás seguro de que deseas matricularte en esta asignatura?")) return;
    
    try {
        const response = await fetch(`https://virtualclass-sm1i.onrender.com/api/cursos/matricular`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idUsuario: currentUser.id_usuario, idClase })
        });
        
        const resData = await response.json();
        
        if(response.ok) {
            alert('¡Matrícula exitosa!');
            cargarCursosDisponibles(); // Recargar modal
            // Recargar página para actualizar dashboard principal
            setTimeout(() => window.location.reload(), 1000);
        } else {
            alert(resData.mensaje || 'Error al procesar la matrícula.');
        }
    } catch (e) {
        alert('Error de red al intentar matricularse.');
    }
};
