// assets/js/clase-detalle.js

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) return;

    const urlParams = new URLSearchParams(window.location.search);
    const idClase = urlParams.get('id');

    if (!idClase) {
        alert("ID de clase no proporcionado");
        window.location.href = 'dashboard.html';
        return;
    }

    const esDocente = currentUser.rol.toLowerCase().includes('docente');

    // UI Elements
    const btnAddTema = document.getElementById('btnAñadirTema');
    const btnAddRecurso = document.getElementById('btnAñadirRecurso');
    const semanasAcordeon = document.getElementById('semanasAcordeon');
    const recursosContainer = document.getElementById('recursosContainer');

    if (esDocente) {
        btnAddTema.classList.remove('d-none');
        btnAddRecurso.classList.remove('d-none');
    }

    // Modal elements
    const modalTema = new bootstrap.Modal(document.getElementById('modalTema'));
    const modalRecurso = new bootstrap.Modal(document.getElementById('modalRecurso'));

    await cargarDetallesClase();
    await cargarSesiones();
    await cargarRecursos();

    async function cargarDetallesClase() {
        try {
            const res = await fetch(`http://localhost:3000/api/clase/${idClase}`);
            const data = await res.json();
            
            if (res.ok) {
                document.getElementById('cursoBadge').innerText = `${data.codigo} • Sección ${data.seccion}`;
                document.getElementById('cursoTitulo').innerText = data.nombre_curso;
                document.getElementById('docenteNombre').innerText = `${data.docente_nombres} ${data.docente_apellidos}`;
                
                // Actualizar breadcrumb
                document.querySelector('.breadcrumb-item.active').innerText = `${data.codigo} ${data.nombre_curso}`;
            }
        } catch (e) {
            console.error("Error al cargar detalles de clase", e);
        }
    }

    async function cargarSesiones() {
        try {
            const res = await fetch(`http://localhost:3000/api/clase/${idClase}/sesiones`);
            const sesiones = await res.json();
            
            if (res.ok) {
                semanasAcordeon.innerHTML = '';
                if (sesiones.length === 0) {
                    semanasAcordeon.innerHTML = '<div class="text-center text-muted p-4">No hay temas registrados aún.</div>';
                }

                sesiones.forEach((sesion, index) => {
                    const isFirst = index === 0;
                    
                    let botonesEdicion = '';
                    if (esDocente) {
                        botonesEdicion = `
                            <div class="mt-3 text-end">
                                <button class="btn btn-sm btn-outline-primary me-2 btn-editar-tema" data-id="${sesion.id_sesion}" data-tema="${sesion.tema}" data-desc="${sesion.descripcion}">Editar</button>
                                <button class="btn btn-sm btn-outline-danger btn-eliminar-tema" data-id="${sesion.id_sesion}">Eliminar</button>
                            </div>
                        `;
                    }

                    const itemHtml = `
                    <div class="accordion-item">
                        <h2 class="accordion-header">
                            <button class="accordion-button ${isFirst ? '' : 'collapsed'} fw-bold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#sm${sesion.id_sesion}">
                                ${sesion.tema}
                            </button>
                        </h2>
                        <div id="sm${sesion.id_sesion}" class="accordion-collapse collapse ${isFirst ? 'show' : ''}" data-bs-parent="#semanasAcordeon">
                            <div class="accordion-body bg-white small">
                                <p class="text-muted">${sesion.descripcion || 'Sin descripción'}</p>
                                ${botonesEdicion}
                            </div>
                        </div>
                    </div>`;
                    semanasAcordeon.insertAdjacentHTML('beforeend', itemHtml);
                });

                asignarEventosSesion();
            }
        } catch (e) {
            console.error("Error al cargar sesiones", e);
        }
    }

    async function cargarRecursos() {
        try {
            const res = await fetch(`http://localhost:3000/api/recursos/${idClase}`);
            const recursos = await res.json();
            
            if (res.ok) {
                recursosContainer.innerHTML = '';
                if (recursos.length === 0) {
                    recursosContainer.innerHTML = '<div class="text-center text-muted p-3">No hay recursos agregados.</div>';
                }

                recursos.forEach(rec => {
                    let iconClass = 'bi-file-earmark-fill text-secondary';
                    if (rec.tipo_recurso === 'pdf') iconClass = 'bi-file-earmark-pdf-fill text-danger';
                    if (rec.tipo_recurso === 'video') iconClass = 'bi-play-btn-fill text-danger';
                    if (rec.tipo_recurso === 'link') iconClass = 'bi-link-45deg text-primary';
                    if (rec.tipo_recurso === 'documento') iconClass = 'bi-file-earmark-word-fill text-info';

                    let botonEliminar = '';
                    if (esDocente) {
                        botonEliminar = `<button class="btn btn-sm btn-outline-danger border-0 ms-2 btn-eliminar-recurso" data-id="${rec.id_recurso}"><i class="bi bi-trash"></i></button>`;
                    }

                    const recHtml = `
                    <div class="d-flex justify-content-between align-items-center bg-white p-2 rounded-2 mb-2 resource-item">
                        <div class="d-flex align-items-center">
                            <i class="bi ${iconClass} fs-4 me-3"></i>
                            <div>
                                <span class="d-block fw-semibold text-dark">${rec.titulo}</span>
                                <small class="text-muted">${rec.tipo_recurso.toUpperCase()}</small>
                            </div>
                        </div>
                        <div class="d-flex">
                            <a href="${rec.url_archivo}" target="_blank" class="btn btn-sm btn-light rounded-pill fw-semibold text-primary">Ver</a>
                            ${botonEliminar}
                        </div>
                    </div>`;
                    recursosContainer.insertAdjacentHTML('beforeend', recHtml);
                });

                asignarEventosRecursos();
            }
        } catch (e) {
            console.error("Error al cargar recursos", e);
        }
    }

    // --- Manejo de Eventos (Docentes) ---
    
    // Guardar/Editar Tema
    document.getElementById('btnGuardarTema').addEventListener('click', async () => {
        const idTema = document.getElementById('temaId').value;
        const temaTitulo = document.getElementById('temaTitulo').value;
        const temaDesc = document.getElementById('temaDescripcion').value;

        if (!temaTitulo) return alert('El título es requerido');

        const method = idTema ? 'PUT' : 'POST';
        const url = idTema 
            ? `http://localhost:3000/api/clase/sesiones/${idTema}` 
            : `http://localhost:3000/api/clase/${idClase}/sesiones`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tema: temaTitulo, descripcion: temaDesc })
            });

            if (res.ok) {
                modalTema.hide();
                await cargarSesiones();
            } else {
                const error = await res.json();
                alert(error.mensaje || 'Error al guardar');
            }
        } catch (e) { console.error(e); }
    });

    // Guardar Recurso
    document.getElementById('btnGuardarRecurso').addEventListener('click', async () => {
        const titulo = document.getElementById('recursoTitulo').value;
        const tipo = document.getElementById('recursoTipo').value;
        const url_archivo = document.getElementById('recursoUrl').value;

        if (!titulo || !url_archivo) return alert('Título y URL son requeridos');

        try {
            const res = await fetch(`http://localhost:3000/api/recursos/${idClase}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo, descripcion: '', tipo_recurso: tipo, url_archivo })
            });

            if (res.ok) {
                modalRecurso.hide();
                await cargarRecursos();
                
                // Limpiar form
                document.getElementById('recursoTitulo').value = '';
                document.getElementById('recursoUrl').value = '';
            }
        } catch (e) { console.error(e); }
    });

    // Limpiar modal al añadir nuevo tema
    btnAddTema.addEventListener('click', () => {
        document.getElementById('modalTemaTitulo').innerText = 'Añadir Tema';
        document.getElementById('temaId').value = '';
        document.getElementById('temaTitulo').value = '';
        document.getElementById('temaDescripcion').value = '';
    });

    // Eventos dinámicos en lista de sesiones
    function asignarEventosSesion() {
        document.querySelectorAll('.btn-editar-tema').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { id, tema, desc } = e.target.dataset;
                document.getElementById('modalTemaTitulo').innerText = 'Editar Tema';
                document.getElementById('temaId').value = id;
                document.getElementById('temaTitulo').value = tema;
                document.getElementById('temaDescripcion').value = desc !== 'null' ? desc : '';
                modalTema.show();
            });
        });

        document.querySelectorAll('.btn-eliminar-tema').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!confirm("¿Seguro que deseas eliminar este tema?")) return;
                try {
                    const res = await fetch(`http://localhost:3000/api/clase/sesiones/${e.target.dataset.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        await cargarSesiones();
                    } else {
                        const error = await res.json();
                        alert(error.mensaje);
                    }
                } catch (err) { console.error(err); }
            });
        });
    }

    // Eventos dinámicos en recursos
    function asignarEventosRecursos() {
        document.querySelectorAll('.btn-eliminar-recurso').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                // Prevenir comportamiento default en caso de que capture el clic del link o icon
                e.preventDefault(); 
                const btnElem = e.target.closest('button');
                if (!confirm("¿Seguro que deseas eliminar este recurso?")) return;
                try {
                    const res = await fetch(`http://localhost:3000/api/recursos/${btnElem.dataset.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        await cargarRecursos();
                    }
                } catch (err) { console.error(err); }
            });
        });
    }

});
