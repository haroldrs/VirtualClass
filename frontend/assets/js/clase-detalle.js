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
    await cargarCompañeros();
    
    if (!esDocente) {
        await cargarPorcentajeAsistencia();
    }

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
                            <div class="mt-3 text-end pt-3 border-top">
                                <button class="btn btn-sm btn-success me-2 btn-tomar-asistencia" data-id="${sesion.id_sesion}" data-tema="${sesion.tema}"><i class="bi bi-clipboard-check"></i> Tomar Asistencia</button>
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

    async function cargarCompañeros() {
        try {
            const res = await fetch(`http://localhost:3000/api/asistencia/${idClase}/alumnos`);
            const alumnos = await res.json();
            const lista = document.getElementById('listaCompañeros');
            lista.innerHTML = '';
            
            if (alumnos.length === 0) {
                lista.innerHTML = '<li class="list-group-item text-muted">No hay alumnos matriculados.</li>';
                return;
            }

            alumnos.forEach(al => {
                lista.innerHTML += `
                    <li class="list-group-item d-flex align-items-center">
                        <div class="bg-light rounded-circle text-primary d-flex align-items-center justify-content-center me-3 fw-bold" style="width:35px;height:35px">
                            ${al.nombres.charAt(0)}${al.apellidos.charAt(0)}
                        </div>
                        <div>
                            <span class="d-block fw-semibold text-dark">${al.apellidos}, ${al.nombres}</span>
                            <small class="text-muted">${al.correo}</small>
                        </div>
                    </li>`;
            });
        } catch (e) { console.error(e); }
    }

    async function cargarPorcentajeAsistencia() {
        try {
            const res = await fetch(`http://localhost:3000/api/asistencia/${idClase}/alumno/${currentUser.id_usuario}`);
            const data = await res.json();
            if (res.ok) {
                document.getElementById('asistenciaAlumnoContenedor').classList.remove('d-none');
                document.getElementById('porcentajeAsistencia').innerText = data.porcentaje;
            }
        } catch (e) { console.error(e); }
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

        // Asistencia
        document.querySelectorAll('.btn-tomar-asistencia').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idSesion = e.target.dataset.id || e.target.closest('button').dataset.id;
                const tema = e.target.dataset.tema || e.target.closest('button').dataset.tema;
                
                document.getElementById('tituloModalAsistencia').innerText = `Asistencia: ${tema}`;
                const tbody = document.getElementById('tablaAsistenciaCuerpo');
                tbody.innerHTML = '<tr><td colspan="2" class="text-center">Cargando...</td></tr>';
                
                const modalAsistencia = new bootstrap.Modal(document.getElementById('modalAsistencia'));
                modalAsistencia.show();

                try {
                    const res = await fetch(`http://localhost:3000/api/asistencia/${idClase}/sesion/${idSesion}`);
                    const alumnos = await res.json();
                    
                    tbody.innerHTML = '';
                    if (alumnos.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No hay alumnos.</td></tr>';
                        return;
                    }

                    alumnos.forEach(al => {
                        const isPresente = al.estado === 'presente' ? 'checked' : '';
                        const isTardanza = al.estado === 'tardanza' ? 'checked' : '';
                        const isAusente = al.estado === 'ausente' ? 'checked' : '';
                        const isSinMarcar = al.estado === 'sin marcar' ? 'checked' : '';

                        tbody.innerHTML += `
                            <tr>
                                <td>
                                    <span class="d-block fw-semibold text-dark">${al.apellidos}, ${al.nombres}</span>
                                </td>
                                <td class="text-center">
                                    <div class="btn-group btn-group-sm" role="group">
                                        <input type="radio" class="btn-check btn-asistencia" name="asis_${al.id_usuario}" id="pres_${al.id_usuario}" value="presente" data-idsesion="${idSesion}" data-idusuario="${al.id_usuario}" ${isPresente}>
                                        <label class="btn btn-outline-success" for="pres_${al.id_usuario}">P</label>
                                        
                                        <input type="radio" class="btn-check btn-asistencia" name="asis_${al.id_usuario}" id="tard_${al.id_usuario}" value="tardanza" data-idsesion="${idSesion}" data-idusuario="${al.id_usuario}" ${isTardanza}>
                                        <label class="btn btn-outline-warning" for="tard_${al.id_usuario}">T</label>
                                        
                                        <input type="radio" class="btn-check btn-asistencia" name="asis_${al.id_usuario}" id="aus_${al.id_usuario}" value="ausente" data-idsesion="${idSesion}" data-idusuario="${al.id_usuario}" ${isAusente}>
                                        <label class="btn btn-outline-danger" for="aus_${al.id_usuario}">A</label>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });

                    // Añadir evento autoguardado
                    document.querySelectorAll('.btn-asistencia').forEach(radio => {
                        radio.addEventListener('change', async (ev) => {
                            const rb = ev.target;
                            try {
                                await fetch('http://localhost:3000/api/asistencia/marcar', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        idSesion: rb.dataset.idsesion,
                                        idUsuario: rb.dataset.idusuario,
                                        estado: rb.value
                                    })
                                });
                            } catch (error) { console.error("Error al guardar asistencia", error); }
                        });
                    });

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
