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
    const btnAddActividad = document.getElementById('btnAñadirActividad');
    const btnAñadirGrupo = document.getElementById('btnAñadirGrupo');
    const semanasAcordeon = document.getElementById('semanasAcordeon');
    const recursosContainer = document.getElementById('recursosContainer');
    const actividadesContainer = document.getElementById('actividadesContainer');
    const gruposContainer = document.getElementById('gruposContainer');

    if (esDocente) {
        btnAddTema.classList.remove('d-none');
        btnAddRecurso.classList.remove('d-none');
        btnAddActividad.classList.remove('d-none');
        if(btnAñadirGrupo) btnAñadirGrupo.classList.remove('d-none');
    }

    // Modal elements
    const modalTema = new bootstrap.Modal(document.getElementById('modalTema'));
    const modalRecurso = new bootstrap.Modal(document.getElementById('modalRecurso'));
    const modalCrearActividad = new bootstrap.Modal(document.getElementById('modalCrearActividad'));
    const modalEntregarActividad = new bootstrap.Modal(document.getElementById('modalEntregarActividad'));
    const modalCrearGrupo = new bootstrap.Modal(document.getElementById('modalCrearGrupo'));
    const modalGestionarIntegrantes = new bootstrap.Modal(document.getElementById('modalGestionarIntegrantes'));
    const offcanvasRevision = new bootstrap.Offcanvas(document.getElementById('offcanvasRevision'));

    await cargarDetallesClase();
    await cargarCompañeros();
    
    if (!esDocente) {
        await cargarPorcentajeAsistencia();
    }

    await cargarSesiones();
    await cargarRecursos();
    await cargarActividades();
    await cargarGrupos();
    await cargarEstructuraModular();

    // URL base del API modular
    const API_MODULAR = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000/api/modular'
        : 'https://virtualclass-sm1i.onrender.com/api/modular';

    // ===================== ESTRUCTURA MODULAR =====================

    async function cargarEstructuraModular() {
        const contenedor = document.getElementById('contenedorUnidades');
        if (!contenedor) return;

        try {
            const idUsuarioParam = !esDocente ? `?idUsuario=${currentUser.id_usuario}` : '';
            const res = await fetch(`${API_MODULAR}/${idClase}/estructura${idUsuarioParam}`);
            const data = await res.json();

            if (!res.ok || !data.estructura || data.estructura.length === 0) {
                contenedor.innerHTML = '<div class="text-center text-muted p-4">No hay unidades creadas. El docente puede crear la estructura del curso.</div>';
                
                // Mostrar nota final si hay
                if (data.notaFinal !== null && data.notaFinal !== undefined) {
                    document.getElementById('cardNotaFinal').style.display = 'block';
                    document.getElementById('notaFinalValor').textContent = `${data.notaFinal} / 20`;
                }
                return;
            }

            contenedor.innerHTML = '';

            data.estructura.forEach((unidad, uIdx) => {
                let semanasHtml = '';

                unidad.semanas.forEach((semana, sIdx) => {
                    // Recursos de la semana
                    let recursosHtml = '';
                    if (semana.recursos.length > 0) {
                        semana.recursos.forEach(rec => {
                            let iconClass = 'bi-file-earmark-fill text-secondary';
                            if (rec.tipo_recurso === 'pdf') iconClass = 'bi-file-earmark-pdf-fill text-danger';
                            if (rec.tipo_recurso === 'video') iconClass = 'bi-play-btn-fill text-danger';
                            if (rec.tipo_recurso === 'link') iconClass = 'bi-link-45deg text-primary';
                            if (rec.tipo_recurso === 'documento') iconClass = 'bi-file-earmark-word-fill text-info';

                            recursosHtml += `
                                <div class="d-flex align-items-center bg-white p-2 rounded-2 mb-1 border">
                                    <i class="bi ${iconClass} me-2"></i>
                                    <a href="${rec.url_archivo}" target="_blank" class="text-decoration-none small fw-semibold">${rec.titulo}</a>
                                    <span class="badge bg-light text-muted ms-auto">${rec.tipo_recurso}</span>
                                </div>`;
                        });
                    }

                    // Actividades/Evaluaciones de la semana
                    let actividadesHtml = '';
                    if (semana.evaluaciones.length > 0) {
                        semana.evaluaciones.forEach(ev => {
                            const dateObj = new Date(ev.fecha_evaluacion);
                            dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
                            const fecha = dateObj.toLocaleDateString('es-ES');

                            let notaInfo = '';
                            if (!esDocente) {
                                if (ev.calificacion !== null && ev.calificacion !== undefined) {
                                    notaInfo = `<span class="badge bg-success ms-auto">Nota: ${ev.calificacion}/20</span>`;
                                } else if (ev.id_entrega) {
                                    notaInfo = `<span class="badge bg-primary ms-auto">Entregado</span>`;
                                } else {
                                    notaInfo = `<span class="badge bg-warning text-dark ms-auto">Pendiente</span>`;
                                }
                            }

                            actividadesHtml += `
                                <div class="d-flex align-items-center bg-success-subtle p-2 rounded-2 mb-1 border border-success-subtle">
                                    <i class="bi bi-journal-text text-success me-2"></i>
                                    <div class="small">
                                        <span class="fw-semibold d-block">${ev.nombre_eva}</span>
                                        <span class="text-muted">Límite: ${fecha} | Peso: ${ev.porcentaje}%</span>
                                    </div>
                                    ${notaInfo}
                                </div>`;
                        });
                    }

                    // Botones para docentes
                    let botonesDocente = '';
                    if (esDocente) {
                        botonesDocente = `
                            <div class="mt-2 pt-2 border-top d-flex gap-2">
                                <button class="btn btn-sm btn-outline-warning btn-add-recurso-semana" data-idmodulo="${semana.id_modulo}"><i class="bi bi-folder-plus"></i> Recurso</button>
                                <button class="btn btn-sm btn-outline-success btn-add-actividad-semana" data-idmodulo="${semana.id_modulo}"><i class="bi bi-journal-plus"></i> Actividad</button>
                                <button class="btn btn-sm btn-outline-danger ms-auto btn-eliminar-semana" data-idmodulo="${semana.id_modulo}"><i class="bi bi-trash"></i></button>
                            </div>`;
                    }

                    semanasHtml += `
                        <div class="ms-3 mb-2">
                            <div class="card border-0 shadow-sm">
                                <div class="card-header bg-white py-2 px-3 d-flex align-items-center cursor-pointer" 
                                     data-bs-toggle="collapse" data-bs-target="#semana_${semana.id_modulo}" role="button">
                                    <i class="bi bi-calendar-week text-info me-2"></i>
                                    <span class="fw-semibold small">${semana.titulo}</span>
                                    <i class="bi bi-chevron-down ms-auto small text-muted"></i>
                                </div>
                                <div class="collapse ${sIdx === 0 && uIdx === 0 ? 'show' : ''}" id="semana_${semana.id_modulo}">
                                    <div class="card-body p-3">
                                        ${semana.descripcion ? `<p class="text-muted small mb-2">${semana.descripcion}</p>` : ''}
                                        ${recursosHtml || '<div class="text-muted small mb-1">Sin recursos</div>'}
                                        ${actividadesHtml ? `<div class="mt-2">${actividadesHtml}</div>` : ''}
                                        ${botonesDocente}
                                    </div>
                                </div>
                            </div>
                        </div>`;
                });

                // Botón añadir semana (docente)
                let btnAddSemana = '';
                if (esDocente) {
                    btnAddSemana = `<button class="btn btn-sm btn-outline-info ms-auto btn-add-semana" data-idunidad="${unidad.id_unidad}"><i class="bi bi-plus"></i> Semana</button>`;
                }

                // Promedio de la unidad
                let promedioHtml = '';
                if (unidad.promedio !== null && unidad.promedio !== undefined) {
                    const color = unidad.promedio >= 11 ? 'text-success' : 'text-danger';
                    promedioHtml = `<div class="text-end mt-2 me-3"><span class="badge bg-light ${color} border px-3 py-2">Promedio: ${unidad.promedio} / 20</span></div>`;
                }

                let btnDeleteUnidad = '';
                if (esDocente) {
                    btnDeleteUnidad = `<button class="btn btn-sm btn-outline-danger ms-2 btn-eliminar-unidad" data-idunidad="${unidad.id_unidad}"><i class="bi bi-trash"></i></button>`;
                }

                const unidadHtml = `
                    <div class="card border-start border-4 border-primary mb-4 shadow-sm">
                        <div class="card-header bg-white d-flex align-items-center py-3" 
                             data-bs-toggle="collapse" data-bs-target="#unidad_${unidad.id_unidad}" role="button">
                            <i class="bi bi-book-half text-primary me-2 fs-5"></i>
                            <h6 class="fw-bold mb-0">${unidad.titulo}</h6>
                            ${btnAddSemana}
                            ${btnDeleteUnidad}
                            <i class="bi bi-chevron-down ms-2 text-muted"></i>
                        </div>
                        <div class="collapse ${uIdx === 0 ? 'show' : ''}" id="unidad_${unidad.id_unidad}">
                            <div class="card-body p-2">
                                ${semanasHtml || '<div class="text-center text-muted p-3 small">No hay semanas. Haga clic en "+ Semana" para añadir.</div>'}
                                ${promedioHtml}
                            </div>
                        </div>
                    </div>`;
                contenedor.insertAdjacentHTML('beforeend', unidadHtml);
            });

            // Nota final
            if (data.notaFinal !== null && data.notaFinal !== undefined) {
                document.getElementById('cardNotaFinal').style.display = 'block';
                document.getElementById('notaFinalValor').textContent = `${data.notaFinal} / 20`;
            }

            // Asignar eventos del docente
            if (esDocente) asignarEventosModulares();

        } catch (e) {
            console.error('Error al cargar estructura modular:', e);
            contenedor.innerHTML = '<div class="text-center text-muted p-4">Error al cargar la estructura. El servidor podría estar iniciando.</div>';
        }
    }

    function asignarEventosModulares() {
        // Añadir semana
        document.querySelectorAll('.btn-add-semana').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // No colapsar el acordeón
                document.getElementById('semanaIdUnidad').value = btn.dataset.idunidad;
                document.getElementById('semanaTitulo').value = '';
                document.getElementById('semanaDescripcion').value = '';
                document.getElementById('semanaOrden').value = '';
                new bootstrap.Modal(document.getElementById('modalCrearSemana')).show();
            });
        });

        // Añadir recurso a semana
        document.querySelectorAll('.btn-add-recurso-semana').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('recursoSemanaIdModulo').value = btn.dataset.idmodulo;
                document.getElementById('recursoSemanaTitulo').value = '';
                document.getElementById('recursoSemanaUrl').value = '';
                new bootstrap.Modal(document.getElementById('modalRecursoSemana')).show();
            });
        });

        // Añadir actividad a semana
        document.querySelectorAll('.btn-add-actividad-semana').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('actSemanaIdModulo').value = btn.dataset.idmodulo;
                document.getElementById('actSemanaNombre').value = '';
                document.getElementById('actSemanaPeso').value = '';
                document.getElementById('actSemanaFecha').value = '';
                new bootstrap.Modal(document.getElementById('modalActividadSemana')).show();
            });
        });

        // Eliminar semana
        document.querySelectorAll('.btn-eliminar-semana').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('¿Seguro que deseas eliminar esta semana?')) return;
                try {
                    await fetch(`${API_MODULAR}/semanas/${btn.dataset.idmodulo}`, { method: 'DELETE' });
                    await cargarEstructuraModular();
                } catch (e) { console.error(e); }
            });
        });

        // Eliminar unidad
        document.querySelectorAll('.btn-eliminar-unidad').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!confirm('¿Seguro que deseas eliminar esta unidad y todas sus semanas?')) return;
                try {
                    await fetch(`${API_MODULAR}/unidades/${btn.dataset.idunidad}`, { method: 'DELETE' });
                    await cargarEstructuraModular();
                } catch (e) { console.error(e); }
            });
        });
    }

    // ===== BOTONES DE GUARDAR DE LOS MODALES MODULARES =====

    // Crear Unidad
    const btnCrearUnidad = document.getElementById('btnCrearUnidad');
    if (btnCrearUnidad) {
        btnCrearUnidad.addEventListener('click', () => {
            document.getElementById('unidadTitulo').value = '';
            document.getElementById('unidadNumero').value = '';
            new bootstrap.Modal(document.getElementById('modalCrearUnidad')).show();
        });
    }

    document.getElementById('btnGuardarUnidad')?.addEventListener('click', async () => {
        const titulo = document.getElementById('unidadTitulo').value;
        const numero = document.getElementById('unidadNumero').value;
        if (!titulo || !numero) return alert('Completa todos los campos');

        try {
            const res = await fetch(`${API_MODULAR}/${idClase}/unidades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo, numero: parseInt(numero) })
            });
            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('modalCrearUnidad')).hide();
                await cargarEstructuraModular();
            }
        } catch (e) { console.error(e); }
    });

    // Crear Semana
    document.getElementById('btnGuardarSemana')?.addEventListener('click', async () => {
        const idUnidad = document.getElementById('semanaIdUnidad').value;
        const titulo = document.getElementById('semanaTitulo').value;
        const descripcion = document.getElementById('semanaDescripcion').value;
        const orden = document.getElementById('semanaOrden').value;
        if (!titulo || !orden) return alert('Título y orden son obligatorios');

        try {
            const res = await fetch(`${API_MODULAR}/${idClase}/semanas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idUnidad, titulo, descripcion, orden: parseInt(orden) })
            });
            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('modalCrearSemana')).hide();
                await cargarEstructuraModular();
            }
        } catch (e) { console.error(e); }
    });

    // Crear Recurso en Semana
    document.getElementById('btnGuardarRecursoSemana')?.addEventListener('click', async () => {
        const idModulo = document.getElementById('recursoSemanaIdModulo').value;
        const titulo = document.getElementById('recursoSemanaTitulo').value;
        const tipo = document.getElementById('recursoSemanaTipo').value;
        const url_archivo = document.getElementById('recursoSemanaUrl').value;
        if (!titulo || !url_archivo) return alert('Título y URL son obligatorios');

        try {
            const res = await fetch(`${API_MODULAR}/${idClase}/semanas/${idModulo}/recursos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo, descripcion: '', tipo_recurso: tipo, url_archivo })
            });
            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('modalRecursoSemana')).hide();
                await cargarEstructuraModular();
            }
        } catch (e) { console.error(e); }
    });

    // Crear Actividad en Semana
    document.getElementById('btnGuardarActividadSemana')?.addEventListener('click', async () => {
        const idModulo = document.getElementById('actSemanaIdModulo').value;
        const nombre = document.getElementById('actSemanaNombre').value;
        const peso = document.getElementById('actSemanaPeso').value;
        const fecha = document.getElementById('actSemanaFecha').value;
        if (!nombre || !peso || !fecha) return alert('Todos los campos son obligatorios');

        try {
            const res = await fetch(`${API_MODULAR}/${idClase}/semanas/${idModulo}/evaluaciones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_eva: nombre, porcentaje: peso, fecha_evaluacion: fecha })
            });
            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('modalActividadSemana')).hide();
                await cargarEstructuraModular();
                await cargarActividades(); // También actualizar la lista plana de actividades
            }
        } catch (e) { console.error(e); }
    });

    // Mostrar botón de crear unidad si es docente
    if (esDocente) {
        const btnUnidad = document.getElementById('btnCrearUnidad');
        if (btnUnidad) btnUnidad.classList.remove('d-none');
    }

    async function cargarDetallesClase() {
        try {
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/clase/${idClase}`);
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
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/clase/${idClase}/sesiones`);
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
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/recursos/${idClase}`);
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

    async function cargarActividades() {
        try {
            const url = `https://virtualclass-sm1i.onrender.com/api/evaluaciones/${idClase}/${currentUser.id_usuario}?rol=${currentUser.rol}`;
            const res = await fetch(url);
            const actividades = await res.json();
            
            if (res.ok) {
                actividadesContainer.innerHTML = '';
                if (actividades.length === 0) {
                    actividadesContainer.innerHTML = '<div class="col-12"><div class="text-center text-muted p-3">No hay actividades programadas.</div></div>';
                    return;
                }

                actividades.forEach(act => {
                    const dateObj = new Date(act.fecha_evaluacion);
                    // Añadir zona horaria para que no se atrase un día
                    dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
                    const date = dateObj.toLocaleDateString('es-ES');

                    let actionHtml = '';
                    let statusBadge = '';

                    if (esDocente) {
                        actionHtml = `<button class="btn btn-sm btn-outline-success mt-3 w-100 fw-bold btn-revisar-entregas" data-id="${act.id_evaluacion}" data-nombre="${act.nombre_eva}">Revisar Entregas</button>`;
                    } else {
                        if (act.calificacion !== null && act.calificacion !== undefined) {
                            statusBadge = `<span class="badge bg-success position-absolute top-0 end-0 m-3">Calificado: ${act.calificacion}</span>`;
                            actionHtml = `
                                <div class="mt-3 p-2 bg-light rounded text-center small">
                                    <span class="text-success fw-bold d-block">Nota: ${act.calificacion} / 20</span>
                                    <span class="text-muted fst-italic">"${act.comentario}"</span>
                                </div>`;
                        } else if (act.id_entrega) {
                            statusBadge = `<span class="badge bg-primary position-absolute top-0 end-0 m-3">Entregado</span>`;
                            actionHtml = `<button class="btn btn-sm btn-light text-primary mt-3 w-100 fw-bold" disabled>Enviado - Esperando revisión</button>`;
                        } else {
                            statusBadge = `<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-3">Pendiente</span>`;
                            actionHtml = `<button class="btn btn-sm btn-primary mt-3 w-100 fw-bold btn-entregar-actividad" data-id="${act.id_evaluacion}">Entregar Tarea</button>`;
                        }
                    }

                    const html = `
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100 border border-light-subtle shadow-sm position-relative">
                            ${statusBadge}
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-2">
                                    <div class="bg-success-subtle text-success rounded p-2 me-2">
                                        <i class="bi bi-journal-text fs-5"></i>
                                    </div>
                                    <h6 class="card-title fw-bold mb-0">${act.nombre_eva}</h6>
                                </div>
                                <div class="text-muted small mb-1"><i class="bi bi-clock me-1"></i> Límite: ${date}</div>
                                <div class="text-muted small"><i class="bi bi-percent me-1"></i> Peso: ${act.porcentaje}%</div>
                                ${actionHtml}
                            </div>
                        </div>
                    </div>`;
                    actividadesContainer.insertAdjacentHTML('beforeend', html);
                });

                asignarEventosActividades();
            }
        } catch (e) { console.error(e); }
    }

    async function cargarCompañeros() {
        try {
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/asistencia/${idClase}/alumnos`);
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
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/asistencia/${idClase}/alumno/${currentUser.id_usuario}`);
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
            ? `https://virtualclass-sm1i.onrender.com/api/clase/sesiones/${idTema}` 
            : `https://virtualclass-sm1i.onrender.com/api/clase/${idClase}/sesiones`;

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
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/recursos/${idClase}`, {
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
                    const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/clase/sesiones/${e.target.dataset.id}`, { method: 'DELETE' });
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
                    const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/asistencia/${idClase}/sesion/${idSesion}`);
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
                                await fetch('https://virtualclass-sm1i.onrender.com/api/asistencia/marcar', {
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
                e.preventDefault(); 
                const btnElem = e.target.closest('button');
                if (!confirm("¿Seguro que deseas eliminar este recurso?")) return;
                try {
                    const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/recursos/${btnElem.dataset.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        await cargarRecursos();
                    }
                } catch (err) { console.error(err); }
            });
        });
    }

    // --- Lógica de Actividades (Docente y Alumno) ---
    document.getElementById('btnGuardarActividad').addEventListener('click', async () => {
        const nombre = document.getElementById('actividadNombre').value;
        const peso = document.getElementById('actividadPeso').value;
        const fecha = document.getElementById('actividadFecha').value;

        if (!nombre || !peso || !fecha) return alert('Todos los campos son obligatorios');

        try {
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/evaluaciones/${idClase}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_eva: nombre, porcentaje: peso, fecha_evaluacion: fecha })
            });

            if (res.ok) {
                modalCrearActividad.hide();
                await cargarActividades();
            }
        } catch (e) { console.error(e); }
    });

    document.getElementById('btnGuardarEntrega').addEventListener('click', async () => {
        const url = document.getElementById('entregaUrl').value;
        const idEv = document.getElementById('entregaActividadId').value;

        if (!url) return alert('Debes proporcionar un enlace');

        try {
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/evaluaciones/entrega`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idEvaluacion: idEv, idUsuario: currentUser.id_usuario, archivoUrl: url })
            });

            if (res.ok) {
                modalEntregarActividad.hide();
                await cargarActividades();
            }
        } catch (e) { console.error(e); }
    });

    function asignarEventosActividades() {
        // Alumnos: Abrir modal de entrega
        document.querySelectorAll('.btn-entregar-actividad').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('entregaActividadId').value = e.target.dataset.id;
                document.getElementById('entregaUrl').value = '';
                modalEntregarActividad.show();
            });
        });

        // Docentes: Abrir offcanvas de revisión
        document.querySelectorAll('.btn-revisar-entregas').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idEv = e.target.dataset.id;
                const nombre = e.target.dataset.nombre;
                
                document.getElementById('revisionActividadNombre').innerText = nombre;
                document.getElementById('revisionCurso').innerText = document.getElementById('cursoTitulo').innerText;
                const container = document.getElementById('revisionContainer');
                container.innerHTML = '<div class="text-center text-muted">Cargando entregas...</div>';
                
                offcanvasRevision.show();

                try {
                    const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/evaluaciones/entregas/${idEv}/${idClase}`);
                    const alumnos = await res.json();
                    
                    container.innerHTML = '';
                    if (alumnos.length === 0) {
                        container.innerHTML = '<div class="text-center text-muted">No hay alumnos.</div>';
                        return;
                    }

                    alumnos.forEach(al => {
                        let entregaHtml = `<span class="badge bg-danger">Sin entrega</span>`;
                        if (al.id_entrega) {
                            entregaHtml = `<a href="${al.archivo_url}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-link-45deg"></i> Ver Trabajo</a>`;
                        }

                        const notaVal = al.calificacion !== null ? al.calificacion : '';
                        const comVal = al.comentario || '';

                        const html = `
                        <div class="card mb-3 border-0 shadow-sm">
                            <div class="card-body p-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="fw-bold">${al.apellidos}, ${al.nombres}</span>
                                    ${entregaHtml}
                                </div>
                                <div class="row g-2">
                                    <div class="col-4">
                                        <label class="form-label small text-muted mb-0">Nota</label>
                                        <input type="number" class="form-control form-control-sm nota-calificacion" value="${notaVal}" data-idusuario="${al.id_usuario}" data-ideval="${idEv}" min="0" max="20" ${!al.id_entrega ? 'disabled' : ''}>
                                    </div>
                                    <div class="col-8">
                                        <label class="form-label small text-muted mb-0">Comentario</label>
                                        <input type="text" class="form-control form-control-sm nota-comentario" value="${comVal}" data-idusuario="${al.id_usuario}" data-ideval="${idEv}" placeholder="..." ${!al.id_entrega ? 'disabled' : ''}>
                                    </div>
                                </div>
                                <div class="text-end mt-2">
                                    <button class="btn btn-sm btn-success btn-guardar-nota-ev" data-idusuario="${al.id_usuario}" data-ideval="${idEv}" ${!al.id_entrega ? 'disabled' : ''}>Guardar</button>
                                </div>
                            </div>
                        </div>`;
                        container.insertAdjacentHTML('beforeend', html);
                    });

                    // Evento para guardar la nota
                    document.querySelectorAll('.btn-guardar-nota-ev').forEach(btn => {
                        btn.addEventListener('click', async (ev) => {
                            const btnElem = ev.target;
                            const idUsu = btnElem.dataset.idusuario;
                            const idEval = btnElem.dataset.ideval;
                            const card = btnElem.closest('.card-body');
                            const notaInput = card.querySelector('.nota-calificacion').value;
                            const comInput = card.querySelector('.nota-comentario').value;

                            if (notaInput === '') return alert('Debe ingresar una nota');

                            btnElem.innerText = '...';
                            try {
                                await fetch('https://virtualclass-sm1i.onrender.com/api/calificaciones/calificar', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        idEvaluacion: idEval,
                                        idUsuario: idUsu,
                                        calificacion: notaInput,
                                        comentario: comInput || 'Revisado'
                                    })
                                });
                                btnElem.innerText = 'OK';
                                setTimeout(() => btnElem.innerText = 'Guardar', 2000);
                            } catch (error) { console.error(error); }
                        });
                    });

                } catch (err) { console.error(err); }
            });
        });
    }

    // ==========================================
    // LOGICA DE GRUPOS DE TRABAJO
    // ==========================================

    async function cargarGrupos() {
        if (!gruposContainer) return;
        try {
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/grupos/clase/${idClase}`);
            const grupos = await res.json();
            
            gruposContainer.innerHTML = '';
            if (grupos.length === 0) {
                gruposContainer.innerHTML = '<div class="text-center text-muted p-3">No hay grupos creados.</div>';
                return;
            }

            grupos.forEach(g => {
                let btnGestion = '';
                if (esDocente) {
                    btnGestion = `
                    <div class="mt-2 text-end">
                        <button class="btn btn-sm btn-outline-info me-2 btn-gestionar-grupo" data-id="${g.id_grupo}" data-nombre="${g.nombre_grupo}">Gestionar</button>
                        <button class="btn btn-sm btn-outline-danger btn-eliminar-grupo" data-id="${g.id_grupo}">Eliminar</button>
                    </div>`;
                }

                // Generar lista de estudiantes
                let estHtml = '<ul class="list-unstyled mb-0 ms-2 small text-muted border-start border-2 ps-2 mt-2 border-info">';
                if (!g.estudiantes || g.estudiantes.length === 0) {
                    estHtml += '<li><i>Sin integrantes</i></li>';
                } else {
                    g.estudiantes.forEach(est => {
                        estHtml += `<li><i class="bi bi-person me-1"></i>${est.nombres} ${est.apellidos}</li>`;
                    });
                }
                estHtml += '</ul>';

                const html = `
                <div class="card border-0 bg-white shadow-sm rounded-3">
                    <div class="card-body p-3">
                        <h6 class="fw-bold mb-1"><i class="bi bi-people text-info me-2"></i>${g.nombre_grupo}</h6>
                        <span class="text-muted extra-small">Creado: ${new Date(g.fecha_creacion).toLocaleDateString()}</span>
                        ${estHtml}
                        ${btnGestion}
                    </div>
                </div>`;
                gruposContainer.insertAdjacentHTML('beforeend', html);
            });

            asignarEventosGrupos();
        } catch (e) { console.error('Error cargando grupos', e); }
    }

    // Eventos para botones de grupos
    function asignarEventosGrupos() {
        // Eliminar grupo
        document.querySelectorAll('.btn-eliminar-grupo').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!confirm("¿Seguro que deseas eliminar este grupo? Se perderán las asignaciones.")) return;
                try {
                    const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/grupos/${e.target.dataset.id}`, { method: 'DELETE' });
                    if (res.ok) await cargarGrupos();
                } catch (err) { console.error(err); }
            });
        });

        // Abrir modal de gestionar integrantes
        document.querySelectorAll('.btn-gestionar-grupo').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idGrupo = e.target.dataset.id;
                document.getElementById('tituloModalIntegrantes').innerText = `Gestionar: ${e.target.dataset.nombre}`;
                document.getElementById('grupoSeleccionadoId').value = idGrupo;
                
                await cargarOpcionesSinGrupo();
                await cargarIntegrantesActuales(idGrupo);
                
                modalGestionarIntegrantes.show();
            });
        });
    }

    // Crear nuevo grupo
    const btnGuardarGrupo = document.getElementById('btnGuardarGrupo');
    if(btnGuardarGrupo) {
        btnGuardarGrupo.addEventListener('click', async () => {
            const nombre = document.getElementById('grupoNombre').value;
            if (!nombre) return alert('El nombre es obligatorio');
            try {
                const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/grupos/clase/${idClase}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre_grupo: nombre })
                });
                if (res.ok) {
                    modalCrearGrupo.hide();
                    document.getElementById('grupoNombre').value = '';
                    await cargarGrupos();
                }
            } catch (err) { console.error(err); }
        });
    }

    // Cargar alumnos que no tienen grupo en el select
    async function cargarOpcionesSinGrupo() {
        const select = document.getElementById('selectAlumnoSinGrupo');
        select.innerHTML = '<option value="">Cargando...</option>';
        try {
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/grupos/clase/${idClase}/sin-grupo`);
            const alumnos = await res.json();
            
            select.innerHTML = '<option value="">Seleccione un alumno...</option>';
            alumnos.forEach(al => {
                select.innerHTML += `<option value="${al.id_usuario}">${al.apellidos}, ${al.nombres}</option>`;
            });
        } catch (e) { console.error(e); }
    }

    // Cargar la lista visual de integrantes dentro del modal
    async function cargarIntegrantesActuales(idGrupo) {
        const lista = document.getElementById('listaIntegrantesGrupo');
        lista.innerHTML = '<li class="list-group-item text-muted">Cargando...</li>';
        
        try {
            // Obtenemos los grupos actualizados para extraer los estudiantes del grupo actual
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/grupos/clase/${idClase}`);
            const grupos = await res.json();
            const grupoActual = grupos.find(g => g.id_grupo == idGrupo);
            
            lista.innerHTML = '';
            if (!grupoActual || !grupoActual.estudiantes || grupoActual.estudiantes.length === 0) {
                lista.innerHTML = '<li class="list-group-item text-muted">Aún no hay integrantes.</li>';
                return;
            }

            grupoActual.estudiantes.forEach(est => {
                lista.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <span class="d-block fw-semibold text-dark">${est.apellidos}, ${est.nombres}</span>
                        <small class="text-muted">${est.correo}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger btn-remover-estudiante" data-idusu="${est.id_usuario}">Remover</button>
                </li>`;
            });

            // Asignar eventos de remover
            document.querySelectorAll('.btn-remover-estudiante').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const idUsu = e.target.dataset.idusu;
                    try {
                        const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/grupos/${idGrupo}/estudiantes/${idUsu}`, { method: 'DELETE' });
                        if (res.ok) {
                            await cargarOpcionesSinGrupo();
                            await cargarIntegrantesActuales(idGrupo);
                            await cargarGrupos();
                        }
                    } catch (err) { console.error(err); }
                });
            });

        } catch (e) { console.error(e); }
    }

    // Asignar alumno desde el select
    const btnAsignarAlumno = document.getElementById('btnAsignarAlumno');
    if(btnAsignarAlumno) {
        btnAsignarAlumno.addEventListener('click', async () => {
            const idGrupo = document.getElementById('grupoSeleccionadoId').value;
            const idUsuario = document.getElementById('selectAlumnoSinGrupo').value;
            
            if (!idUsuario) return alert('Seleccione un alumno');

            try {
                const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/grupos/${idGrupo}/estudiantes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_usuario: idUsuario })
                });

                if (res.ok) {
                    await cargarOpcionesSinGrupo();
                    await cargarIntegrantesActuales(idGrupo);
                    await cargarGrupos(); // Actualizar lista principal
                } else {
                    const err = await res.json();
                    alert(err.mensaje || 'Error al asignar');
                }
            } catch (e) { console.error(e); }
        });
    }

});
