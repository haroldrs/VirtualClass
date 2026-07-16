// assets/js/calificaciones.js

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) return;

    const esDocente = currentUser.rol.toLowerCase().includes('docente');
    const titleElement = document.querySelector('.top-navbar h5');
    const subtitleElement = document.querySelector('.top-navbar p.small');
    const tableContainer = document.querySelector('tbody');
    const cursoSelect = document.getElementById('cursoSelect');
    const promedioArea = document.querySelector('.card-footer .text-end');

    if (esDocente) {
        titleElement.innerText = "Gestión de Calificaciones";
        subtitleElement.innerText = "Ingresa o modifica las notas de tus alumnos";
        if (promedioArea) promedioArea.style.display = 'none'; // No mostrar promedio general para docentes
    }

    // Cargar cursos en el select
    try {
        const responseCursos = await fetch(`https://virtualclass-sm1i.onrender.com/api/cursos/mis-cursos/${currentUser.id_usuario}/${currentUser.rol}`);
        const cursos = await responseCursos.json();

        if (responseCursos.ok) {
            if (cursos.length === 0) {
                cursoSelect.innerHTML = '<option value="global" selected>Resumen General</option>';
            } else {
                cursoSelect.innerHTML = '<option value="global" selected>Resumen General</option>';
                cursos.forEach(curso => {
                    cursoSelect.innerHTML += `<option value="${curso.id_clase}">${curso.codigo} - ${curso.nombre} (Sec: ${curso.seccion})</option>`;
                });
            }

            // Cargar datos globales por defecto
            cargarDatosCalificaciones('global', esDocente);
        }

        // Al cambiar de curso
        cursoSelect.addEventListener('change', (e) => {
            cargarDatosCalificaciones(e.target.value, esDocente);
        });

    } catch (error) {
        console.error("Error fetching cursos", error);
    }

    async function cargarDatosCalificaciones(idClase, isDocente) {
        try {
            if (idClase === 'global') {
                if (isDocente) {
                    await cargarGlobalDocente();
                } else {
                    await cargarGlobalAlumno();
                }
            } else {
                if (isDocente) {
                    await cargarDocentePorUnidad(idClase);
                } else {
                    await cargarAlumnoPorUnidad(idClase);
                }
            }
        } catch (error) {
            console.error("Error fetching calificaciones", error);
        }
    }

    // ===================== HELPER: ocultar todos los contenedores =====================
    function ocultarTodosContenedores() {
        document.getElementById('tableWrapper').classList.add('d-none');
        document.getElementById('studentCardsContainer').classList.add('d-none');
        document.getElementById('unidadesContainer').classList.add('d-none');
        document.getElementById('docenteUnidadesContainer').classList.add('d-none');
    }

    // ===================== VISTA ALUMNO POR UNIDAD =====================
    async function cargarAlumnoPorUnidad(idClase) {
        const mainContainer = document.getElementById('mainContainer');
        const resumenCards = document.getElementById('resumenCards');
        const contenedor = document.getElementById('unidadesContainer');

        ocultarTodosContenedores();
        contenedor.classList.remove('d-none');
        contenedor.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div></div>';

        mainContainer.style.backgroundColor = 'transparent';
        mainContainer.style.boxShadow = 'none';

        if (resumenCards) resumenCards.style.display = 'flex';
        document.getElementById('lblResumen1').innerText = 'Nota Final del Curso';
        document.getElementById('iconResumen1').innerHTML = '<i class="bi bi-mortarboard-fill fs-4"></i>';
        document.getElementById('lblResumen2').innerText = 'Evaluaciones Calificadas';
        document.getElementById('iconResumen2').innerHTML = '<i class="bi bi-check-circle-fill fs-4"></i>';
        document.getElementById('lblResumen3').innerText = 'Evaluaciones Pendientes';
        document.getElementById('iconResumen3').innerHTML = '<i class="bi bi-clock-history fs-4"></i>';

        try {
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/calificaciones/alumno/${currentUser.id_usuario}/${idClase}/por-unidad`);
            const data = await res.json();
            contenedor.innerHTML = '';

            if (!data.unidades || data.unidades.length === 0) {
                contenedor.innerHTML = '<div class="alert alert-info text-center border-0 shadow-sm m-3" style="border-radius:12px">No hay unidades configuradas para este curso.</div>';
                if (resumenCards) resumenCards.style.display = 'none';
                return;
            }

            let totalCalificadas = 0, totalPendientes = 0;

            data.unidades.forEach((unidad, uIdx) => {
                const promColor = unidad.promedio !== null ? (unidad.promedio >= 13 ? 'text-success' : 'text-danger') : 'text-muted';
                const promText = unidad.promedio !== null ? unidad.promedio.toFixed(2) : '- -';
                const progreso = unidad.pesoTotal > 0 ? Math.round((unidad.pesoCalificado / unidad.pesoTotal) * 100) : 0;
                const riesgo = unidad.promedio !== null && unidad.promedio < 13 ? '<span class="badge bg-danger-subtle text-danger ms-2"><i class="bi bi-exclamation-triangle-fill me-1"></i>En riesgo</span>' : '';

                let evasHtml = '';
                // Ordenar cronológicamente (primero por orden de semana, luego por fecha)
                unidad.evaluaciones.sort((a, b) => {
                    const ordenA = parseInt(a.semana_orden) || 0;
                    const ordenB = parseInt(b.semana_orden) || 0;
                    if (ordenA !== ordenB) return ordenA - ordenB;
                    
                    const dateA = new Date(a.fecha_evaluacion);
                    const dateB = new Date(b.fecha_evaluacion);
                    if (isNaN(dateA) || isNaN(dateB)) return a.id_evaluacion - b.id_evaluacion;
                    return dateA - dateB;
                });
                
                unidad.evaluaciones.forEach(ev => {
                    if (ev.calificacion !== null) totalCalificadas++;
                    else totalPendientes++;

                    const dateObj = new Date(ev.fecha_evaluacion);
                    dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
                    const fecha = dateObj.toLocaleDateString('es-ES');

                    let notaBadge = '<span class="badge bg-light text-muted">- -</span>';
                    let estadoHtml = '';
                    if (ev.calificacion !== null) {
                        const v = parseFloat(ev.calificacion);
                        const cls = v >= 13 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger';
                        notaBadge = `<span class="badge ${cls} fs-6 fw-bold">${v.toFixed(2)}</span>`;
                        estadoHtml = ev.comentario ? `<div class="mt-2 p-2 bg-light rounded-3 small"><i class="bi bi-chat-quote text-primary me-1"></i>${ev.comentario}</div>` : '';
                    } else if (ev.id_entrega) {
                        notaBadge = '<span class="badge bg-primary-subtle text-primary">Entregado</span>';
                        estadoHtml = '<div class="mt-2 small text-primary"><i class="bi bi-clock-history me-1"></i>Esperando revisión</div>';
                    } else {
                        notaBadge = '<span class="badge bg-warning-subtle text-warning">Pendiente</span>';
                        estadoHtml = '<div class="mt-2 small text-warning"><i class="bi bi-exclamation-triangle me-1"></i>Falta entregar</div>';
                    }

                    evasHtml += `
                        <div class="col-md-6 col-lg-4">
                            <div class="card border-0 shadow-sm h-100" style="border-radius:12px">
                                <div class="card-body p-3">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <h6 class="fw-bold text-dark mb-0 small">${ev.nombre_eva}</h6>
                                        ${notaBadge}
                                    </div>
                                    <div class="d-flex gap-3 text-muted" style="font-size:.75rem">
                                        <span><i class="bi bi-percent me-1"></i>Peso: ${ev.porcentaje}%</span>
                                        <span><i class="bi bi-calendar-event me-1"></i>${fecha}</span>
                                    </div>
                                    ${estadoHtml}
                                </div>
                            </div>
                        </div>`;
                });

                if (unidad.evaluaciones.length === 0) {
                    evasHtml = '<div class="col-12"><div class="text-muted small text-center p-3">Sin evaluaciones en esta unidad</div></div>';
                }

                contenedor.innerHTML += `
                    <div class="card border-0 shadow-sm mb-3" style="border-radius:16px;overflow:hidden">
                        <div class="card-header bg-white border-0 py-3 px-4 cursor-pointer d-flex justify-content-between align-items-center" data-bs-toggle="collapse" data-bs-target="#unidadAlumno_${unidad.id_unidad}" role="button">
                            <div class="d-flex align-items-center">
                                <div class="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center me-3" style="width:40px;height:40px">
                                    <i class="bi bi-journal-bookmark-fill"></i>
                                </div>
                                <div>
                                    <h6 class="fw-bold mb-0">${unidad.titulo}</h6>
                                    <span class="text-muted small">${unidad.calificadas}/${unidad.total} evaluaciones calificadas</span>
                                </div>
                                ${riesgo}
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <div style="width:100px">
                                    <div class="progress" style="height:6px;border-radius:3px">
                                        <div class="progress-bar bg-primary" style="width:${progreso}%"></div>
                                    </div>
                                    <span class="text-muted" style="font-size:.65rem">${progreso}% evaluado</span>
                                </div>
                                <span class="fw-bold fs-5 ${promColor}">${promText}</span>
                                <i class="bi bi-chevron-down text-muted"></i>
                            </div>
                        </div>
                        <div class="collapse ${uIdx === 0 ? 'show' : ''}" id="unidadAlumno_${unidad.id_unidad}">
                            <div class="card-body pt-0 px-4 pb-4">
                                <div class="row g-3">${evasHtml}</div>
                            </div>
                        </div>
                    </div>`;
            });

            // Nota final
            if (data.notaFinal !== null) {
                const nfColor = data.notaFinal >= 13 ? 'bg-success' : 'bg-danger';
                contenedor.innerHTML += `
                    <div class="card border-0 ${nfColor} text-white shadow mb-3" style="border-radius:16px">
                        <div class="card-body p-4 d-flex justify-content-between align-items-center">
                            <div><i class="bi bi-mortarboard-fill fs-4 me-2"></i><span class="fw-bold fs-5">Nota Final del Curso</span></div>
                            <span class="fw-bold fs-2">${data.notaFinal.toFixed(2)}</span>
                        </div>
                    </div>`;
            }

            document.getElementById('resumenPromedio').innerText = data.notaFinal !== null ? data.notaFinal.toFixed(2) : '- -';
            document.getElementById('resumenRevisadas').innerText = totalCalificadas;
            document.getElementById('resumenPendientes').innerText = totalPendientes;

        } catch (e) {
            console.error(e);
            contenedor.innerHTML = '<div class="alert alert-danger m-3">Error al cargar calificaciones por unidad</div>';
        }
    }

    // ===================== VISTA DOCENTE POR UNIDAD =====================
    async function cargarDocentePorUnidad(idClase) {
        const mainContainer = document.getElementById('mainContainer');
        const resumenCards = document.getElementById('resumenCards');
        const contenedor = document.getElementById('docenteUnidadesContainer');

        ocultarTodosContenedores();
        contenedor.classList.remove('d-none');
        contenedor.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div></div>';

        mainContainer.style.backgroundColor = 'transparent';
        mainContainer.style.boxShadow = 'none';
        if (resumenCards) resumenCards.style.display = 'none';

        try {
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/calificaciones/docente/${idClase}/por-unidad`);
            const data = await res.json();
            contenedor.innerHTML = '';

            if (!data.unidades || data.unidades.length === 0) {
                contenedor.innerHTML = '<div class="alert alert-info text-center border-0 shadow-sm m-3" style="border-radius:12px">No hay unidades configuradas para este curso.</div>';
                return;
            }

            // Tabs de unidades
            let tabsNav = '<ul class="nav nav-tabs border-0 mb-3" role="tablist">';
            let tabsContent = '<div class="tab-content">';

            data.unidades.forEach((unidad, uIdx) => {
                const active = uIdx === 0 ? 'active' : '';
                const show = uIdx === 0 ? 'show active' : '';
                tabsNav += `<li class="nav-item"><a class="nav-link ${active} fw-semibold" data-bs-toggle="tab" href="#tabUnidad_${unidad.id_unidad}" role="tab">${unidad.titulo}</a></li>`;

                // Ordenar cronológicamente (primero por orden de semana, luego por fecha)
                unidad.evaluaciones.sort((a, b) => {
                    const ordenA = parseInt(a.semana_orden) || 0;
                    const ordenB = parseInt(b.semana_orden) || 0;
                    if (ordenA !== ordenB) return ordenA - ordenB;
                    
                    const dateA = new Date(a.fecha_evaluacion);
                    const dateB = new Date(b.fecha_evaluacion);
                    if (isNaN(dateA) || isNaN(dateB)) return a.id_evaluacion - b.id_evaluacion;
                    return dateA - dateB;
                });

                // Construir tabla de alumnos x evaluaciones
                let thEvals = '';
                unidad.evaluaciones.forEach(ev => {
                    thEvals += `<th class="text-center small">${ev.nombre_eva}<br><span class="text-muted fw-normal">(${ev.porcentaje}%)</span></th>`;
                });

                let tbodyHtml = '';
                if (!unidad.alumnos || unidad.alumnos.length === 0) {
                    const colSpan = unidad.evaluaciones.length + 3;
                    tbodyHtml = `<tr><td colspan="${colSpan}" class="text-center text-muted">No hay alumnos matriculados</td></tr>`;
                } else {
                    unidad.alumnos.forEach(al => {
                        let cells = '';
                        unidad.evaluaciones.forEach(ev => {
                            const nota = al.notas[ev.id_evaluacion];
                            const val = nota && nota.calificacion !== null ? nota.calificacion : '';
                            let entregaIcon = '';
                            if (nota && nota.id_entrega && (nota.calificacion === null || nota.calificacion === undefined)) {
                                entregaIcon = `<a href="${nota.archivo_url}" target="_blank" class="text-danger ms-1" title="Revisar entrega"><i class="bi bi-bell-fill"></i></a>`;
                            }
                            cells += `<td class="text-center">
                                <input type="number" class="form-control form-control-sm nota-input-unidad border-primary-subtle text-center shadow-none" style="width:75px;border-radius:8px;margin:0 auto" data-idev="${ev.id_evaluacion}" data-idus="${al.id_usuario}" value="${val}" min="0" max="20" step="0.1">
                                ${entregaIcon}
                            </td>`;
                        });

                        const promColor = al.promedio !== null ? (al.promedio >= 13 ? 'text-success' : 'text-danger') : 'text-muted';
                        const promText = al.promedio !== null ? al.promedio.toFixed(2) : '- -';

                        tbodyHtml += `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold me-2" style="width:36px;height:36px;font-size:.8rem">${al.nombres.charAt(0)}${al.apellidos.charAt(0)}</div>
                                        <div>
                                            <span class="d-block fw-semibold text-dark small">${al.apellidos}, ${al.nombres}</span>
                                        </div>
                                    </div>
                                </td>
                                ${cells}
                                <td class="text-center fw-bold ${promColor}">${promText}</td>
                            </tr>`;
                    });
                }

                tabsContent += `
                    <div class="tab-pane fade ${show}" id="tabUnidad_${unidad.id_unidad}" role="tabpanel">
                        <div class="card border-0 shadow-sm" style="border-radius:16px;overflow:hidden">
                            <div class="table-responsive">
                                <table class="table mb-0 align-middle">
                                    <thead>
                                        <tr>
                                            <th>Alumno</th>
                                            ${thEvals}
                                            <th class="text-center">Prom. Unidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>${tbodyHtml}</tbody>
                                </table>
                            </div>
                            <div class="card-footer bg-light border-0 text-end p-3">
                                <button class="btn btn-primary rounded-pill px-4 shadow-sm btn-guardar-unidad" data-idunidad="${unidad.id_unidad}" data-idclase="${idClase}">
                                    <i class="bi bi-save2 me-1"></i> Guardar Notas
                                </button>
                            </div>
                        </div>
                    </div>`;
            });

            tabsNav += '</ul>';
            tabsContent += '</div>';
            contenedor.innerHTML = tabsNav + tabsContent;

            // Eventos de guardar por unidad
            contenedor.querySelectorAll('.btn-guardar-unidad').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const tabPane = btn.closest('.tab-pane');
                    const inputs = tabPane.querySelectorAll('.nota-input-unidad');
                    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Guardando...';
                    btn.disabled = true;

                    for (let input of inputs) {
                        if (input.value !== '') {
                            await fetch('https://virtualclass-sm1i.onrender.com/api/calificaciones/calificar', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    idEvaluacion: input.dataset.idev,
                                    idUsuario: input.dataset.idus,
                                    calificacion: input.value,
                                    comentario: 'Calificado por docente'
                                })
                            });
                        }
                    }

                    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Guardado';
                    btn.classList.replace('btn-primary', 'btn-success');
                    setTimeout(async () => {
                        btn.innerHTML = '<i class="bi bi-save2 me-1"></i> Guardar Notas';
                        btn.classList.replace('btn-success', 'btn-primary');
                        btn.disabled = false;
                        await cargarDocentePorUnidad(idClase);
                    }, 1500);
                });
            });

        } catch (e) {
            console.error(e);
            contenedor.innerHTML = '<div class="alert alert-danger m-3">Error al cargar calificaciones docente por unidad</div>';
        }
    }

    function renderizarTablaAlumno(notas) {
        const tableWrapper = document.getElementById('tableWrapper');
        const gridContainer = document.getElementById('studentCardsContainer');
        const mainContainer = document.getElementById('mainContainer');
        
        // Ocultar tabla y mostrar grilla
        tableWrapper.classList.add('d-none');
        gridContainer.classList.remove('d-none');
        gridContainer.innerHTML = '';
        
        // Quitar fondo blanco del card parent para que las tarjetas resalten
        mainContainer.style.backgroundColor = 'transparent';
        mainContainer.style.boxShadow = 'none';

        const resumenCards = document.getElementById('resumenCards');
        
        if (notas.length === 0) {
            gridContainer.innerHTML = '<div class="col-12"><div class="alert alert-info text-center border-0 shadow-sm" style="border-radius: 12px;">No hay evaluaciones programadas.</div></div>';
            if (resumenCards) resumenCards.style.display = 'none';
            return;
        }

        if (resumenCards) resumenCards.style.display = 'flex';

        let sumaPonderada = 0;
        let porcentajeTotal = 0;
        let tareasRevisadas = 0;
        let tareasPendientes = 0;

        notas.forEach(nota => {
            const dateObj = new Date(nota.fecha_evaluacion);
            dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
            const date = dateObj.toLocaleDateString('es-ES');
            
            let badgeClass = 'bg-light text-muted';
            let notaText = '- -';
            let comentarioText = '<span class="text-muted small italic">Aún no calificado por el docente.</span>';
            let percentageValue = 0;

            if (nota.calificacion !== null) {
                tareasRevisadas++;
                const val = parseFloat(nota.calificacion);
                sumaPonderada += val * (nota.porcentaje / 100);
                porcentajeTotal += parseFloat(nota.porcentaje);
                percentageValue = (val / 20) * 100; // Asumiendo base 20

                if (val >= 13) badgeClass = 'bg-success-subtle text-success';
                else badgeClass = 'bg-danger-subtle text-danger';
                
                notaText = val.toFixed(2);
                comentarioText = `<div class="mt-3 p-3 bg-light rounded-3 small"><i class="bi bi-chat-quote text-primary me-2"></i><span class="text-muted">${nota.comentario || 'Sin comentarios'}</span></div>`;
            } else {
                tareasPendientes++;
                if (nota.id_entrega) {
                    comentarioText = '<div class="mt-3 p-2 bg-primary-subtle text-primary rounded-3 small italic text-center"><i class="bi bi-clock-history me-1"></i> Entregado. Esperando revisión.</div>';
                } else {
                    comentarioText = '<div class="mt-3 p-2 bg-warning-subtle text-warning rounded-3 small italic text-center"><i class="bi bi-exclamation-triangle me-1"></i> Falta entregar.</div>';
                }
            }

            gridContainer.innerHTML += `
                <div class="col-md-6 col-lg-4">
                    <div class="student-card h-100 d-flex flex-column">
                        <div class="student-card-header">
                            <div>
                                <h6 class="fw-bold text-dark mb-1">${nota.nombre_eva}</h6>
                                <span class="badge bg-secondary bg-opacity-10 text-secondary border">Peso: ${nota.porcentaje}%</span>
                            </div>
                            <div class="text-end">
                                <span class="d-block small text-muted"><i class="bi bi-calendar-event me-1"></i>${date}</span>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center flex-grow-1 mt-2">
                            <span class="text-secondary small fw-semibold text-uppercase">Calificación</span>
                            <div class="progress-circle shadow-sm" style="--percentage: ${percentageValue};">
                                <span class="${nota.calificacion !== null ? (parseFloat(nota.calificacion) >= 13 ? 'text-success' : 'text-danger') : 'text-muted'}">${notaText}</span>
                            </div>
                        </div>
                        ${comentarioText}
                    </div>
                </div>
            `;
        });

        // Actualizar promedio y tarjetas de resumen
        let promFinal = '- -';
        if (porcentajeTotal > 0) {
            promFinal = (sumaPonderada / (porcentajeTotal/100)).toFixed(2);
        }

        document.getElementById('resumenPromedio').innerText = promFinal;
        document.getElementById('resumenRevisadas').innerText = tareasRevisadas;
        document.getElementById('resumenPendientes').innerText = tareasPendientes;

        // Si existe el área de footer, ocultarla ya que tenemos las cards
        const footer = document.querySelector('.card-footer');
        if (footer) footer.classList.add('d-none');
    }

    function renderizarTablaDocente(alumnos) {
        const resumenCards = document.getElementById('resumenCards');
        const tableWrapper = document.getElementById('tableWrapper');
        const gridContainer = document.getElementById('studentCardsContainer');
        const mainContainer = document.getElementById('mainContainer');

        if (resumenCards) resumenCards.style.display = 'none';
        
        // Mostrar tabla, ocultar grilla
        tableWrapper.classList.remove('d-none');
        gridContainer.classList.add('d-none');
        
        // Restaurar estilos del main container
        mainContainer.style.backgroundColor = '#ffffff';
        mainContainer.style.boxShadow = '0 10px 30px rgba(0,0,0,0.04)';

        tableContainer.innerHTML = '';
        document.querySelector('thead').innerHTML = `
            <tr>
                <th>Alumno</th>
                <th>Evaluaciones</th>
                <th class="text-center">Acción</th>
            </tr>
        `;

        if (alumnos.length === 0) {
            tableContainer.innerHTML = '<tr><td colspan="3" class="text-center">No hay alumnos matriculados en esta clase.</td></tr>';
            return;
        }

        alumnos.forEach(alumno => {
            let evalsHTML = '';
            alumno.evaluaciones.forEach(ev => {
                const val = ev.calificacion !== null ? ev.calificacion : '';
                let entregaInfo = '<span class="text-warning small italic"><i class="bi bi-exclamation-circle me-1"></i>Sin entrega</span>';
                if (ev.id_entrega) {
                    const fechaObj = new Date(ev.fecha_entrega);
                    const fechaStr = fechaObj.toLocaleDateString('es-ES') + ' ' + fechaObj.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
                    if (ev.calificacion !== null) {
                        entregaInfo = `<span class="text-success small italic"><i class="bi bi-check2-circle me-1"></i>Entregado el ${fechaStr} <a href="${ev.archivo_url}" target="_blank" class="ms-1 text-decoration-none">(Ver archivo)</a></span>`;
                    } else {
                        entregaInfo = `<span class="badge bg-danger px-2 py-1"><i class="bi bi-bell-fill me-1"></i>Revisión pendiente</span> <a href="${ev.archivo_url}" target="_blank" class="ms-2 small text-decoration-none fw-semibold"><i class="bi bi-box-arrow-up-right me-1"></i>Abrir</a>`;
                    }
                }

                evalsHTML += `
                    <div class="mb-3 p-3 border-0 shadow-sm rounded-3 bg-white" style="border-left: 4px solid var(--primary-color) !important;">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <strong>${ev.nombre_eva} <span class="text-muted fw-normal ms-1">(${ev.porcentaje}%)</span></strong>
                            ${entregaInfo}
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="text-secondary small fw-bold me-2 text-uppercase">Nota:</span>
                            <input type="number" class="form-control form-control-sm nota-input border-primary shadow-none" style="width: 90px; border-radius: 8px;" data-idev="${ev.id_evaluacion}" data-idus="${alumno.id_usuario}" value="${val}" min="0" max="20" step="0.1">
                        </div>
                    </div>
                `;
            });

            if (alumno.evaluaciones.length === 0) {
                evalsHTML = '<div class="alert alert-light text-muted small text-center mb-0 border-0">No hay evaluaciones programadas</div>';
            }

            tableContainer.innerHTML += `
                <tr class="align-middle">
                    <td>
                        <div class="d-flex align-items-center py-2">
                            <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold me-3 shadow-sm" style="width: 48px; height: 48px; font-size: 1.1rem;">
                                ${alumno.nombres.charAt(0)}${alumno.apellidos.charAt(0)}
                            </div>
                            <div>
                                <span class="d-block fw-bold text-dark fs-6">${alumno.apellidos}, ${alumno.nombres}</span>
                                <small class="text-muted"><i class="bi bi-person-badge me-1"></i>ID: ${alumno.id_usuario}</small>
                            </div>
                        </div>
                    </td>
                    <td class="bg-light rounded-4 p-3 my-2 d-block mx-2 shadow-sm border border-white">${evalsHTML}</td>
                    <td class="text-center">
                        <button class="btn btn-primary px-4 py-2 rounded-pill shadow-sm btn-guardar-notas" data-idus="${alumno.id_usuario}">
                            <i class="bi bi-save2 me-1"></i> Guardar
                        </button>
                    </td>
                </tr>
            `;
        });

        // Eventos para guardar
        document.querySelectorAll('.btn-guardar-notas').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idUs = e.target.getAttribute('data-idus');
                const inputs = document.querySelectorAll(`input.nota-input[data-idus="${idUs}"]`);
                
                btn.innerText = 'Guardando...';
                btn.disabled = true;

                for (let input of inputs) {
                    if (input.value !== '') {
                        const idEv = input.getAttribute('data-idev');
                        const notaVal = input.value;
                        await fetch('https://virtualclass-sm1i.onrender.com/api/calificaciones/calificar', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ idEvaluacion: idEv, idUsuario: idUs, calificacion: notaVal, comentario: 'Calificado por docente' })
                        });
                    }
                }

                btn.innerText = 'Guardado';
                btn.classList.replace('btn-success', 'btn-secondary');
                setTimeout(() => {
                    btn.innerText = 'Guardar';
                    btn.classList.replace('btn-secondary', 'btn-success');
                    btn.disabled = false;
                }, 2000);
            });
        });
    }

    // --- Funciones Globales ---

    async function cargarGlobalAlumno() {
        const resumenCards = document.getElementById('resumenCards');
        const tableWrapper = document.getElementById('tableWrapper');
        const gridContainer = document.getElementById('studentCardsContainer');
        const mainContainer = document.getElementById('mainContainer');

        if (resumenCards) resumenCards.style.display = 'flex';
        
        // Ocultar todos y mostrar tabla
        ocultarTodosContenedores();
        tableWrapper.classList.remove('d-none');
        
        // Restaurar estilos del main container
        mainContainer.style.backgroundColor = '#ffffff';
        mainContainer.style.boxShadow = '0 10px 30px rgba(0,0,0,0.04)';

        // Restaurar labels del alumno
        document.getElementById('lblResumen1').innerText = "Promedio Ponderado Acumulado";
        document.getElementById('iconResumen1').innerHTML = '<i class="bi bi-award-fill fs-4"></i>';
        
        document.getElementById('lblResumen2').innerText = "Cursos Aprobados";
        document.getElementById('iconResumen2').innerHTML = '<i class="bi bi-check-circle-fill fs-4"></i>';
        
        document.getElementById('lblResumen3').innerText = "Cursos en Riesgo";
        document.getElementById('iconResumen3').innerHTML = '<i class="bi bi-exclamation-triangle-fill fs-4"></i>';

        document.querySelector('thead').innerHTML = `
            <tr>
                <th>Materia</th>
                <th>Sección</th>
                <th class="text-center">Promedio Actual</th>
                <th class="text-center">Acción</th>
            </tr>
        `;
        
        try {
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/calificaciones/global/alumno/${currentUser.id_usuario}`);
            const datos = await res.json();
            
            tableContainer.innerHTML = '';
            if (datos.length === 0) {
                tableContainer.innerHTML = '<tr><td colspan="4" class="text-center">No estás matriculado en ningún curso.</td></tr>';
                return;
            }

            let sumaPromedios = 0;
            let cursosValidos = 0;
            let aprobados = 0;
            let enRiesgo = 0;

            datos.forEach(curso => {
                let promHtml = '<span class="badge bg-light text-muted">- -</span>';
                if (curso.promedio !== null) {
                    const promVal = parseFloat(curso.promedio);
                    sumaPromedios += promVal;
                    cursosValidos++;

                    if (promVal >= 13) {
                        aprobados++;
                        promHtml = `<span class="badge bg-success-subtle text-success fs-6">${promVal.toFixed(2)}</span>`;
                    } else {
                        enRiesgo++;
                        promHtml = `<span class="badge bg-danger-subtle text-danger fs-6">${promVal.toFixed(2)}</span>`;
                    }
                }

                tableContainer.innerHTML += `
                    <tr>
                        <td>
                            <span class="d-block fw-bold text-dark">${curso.curso}</span>
                        </td>
                        <td><span class="text-muted">Sección ${curso.seccion}</span></td>
                        <td class="text-center">${promHtml}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary btn-ver-detalles" data-id="${curso.id_clase}">Ver Detalles</button>
                        </td>
                    </tr>
                `;
            });

            // Actualizar tarjetas del alumno
            let promedioGeneral = cursosValidos > 0 ? (sumaPromedios / cursosValidos).toFixed(2) : '- -';
            document.getElementById('resumenPromedio').innerText = promedioGeneral;
            document.getElementById('resumenRevisadas').innerText = aprobados;
            document.getElementById('resumenPendientes').innerText = enRiesgo;

            document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    cursoSelect.value = e.target.dataset.id;
                    cargarDatosCalificaciones(e.target.dataset.id, false);
                });
            });

        } catch (e) {
            console.error(e);
            tableContainer.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar resumen global</td></tr>';
        }
    }

    async function cargarGlobalDocente() {
        const resumenCards = document.getElementById('resumenCards');
        const tableWrapper = document.getElementById('tableWrapper');
        const gridContainer = document.getElementById('studentCardsContainer');
        const mainContainer = document.getElementById('mainContainer');

        if (resumenCards) resumenCards.style.display = 'flex';
        
        // Ocultar todos y mostrar tabla
        ocultarTodosContenedores();
        tableWrapper.classList.remove('d-none');
        
        // Restaurar estilos del main container
        mainContainer.style.backgroundColor = '#ffffff';
        mainContainer.style.boxShadow = '0 10px 30px rgba(0,0,0,0.04)';

        // Actualizar labels para el docente
        document.getElementById('lblResumen1').innerText = "Total Alumnos a Cargo";
        document.getElementById('iconResumen1').innerHTML = '<i class="bi bi-people-fill fs-4"></i>';
        
        document.getElementById('lblResumen2').innerText = "Aulas Activas";
        document.getElementById('iconResumen2').innerHTML = '<i class="bi bi-door-open-fill fs-4"></i>';
        
        document.getElementById('lblResumen3').innerText = "Total Entregas por Revisar";
        document.getElementById('iconResumen3').innerHTML = '<i class="bi bi-inbox-fill fs-4"></i>';

        document.querySelector('thead').innerHTML = `
            <tr>
                <th>Curso Dictado</th>
                <th class="text-center">Total Alumnos</th>
                <th class="text-center">Entregas sin revisar</th>
                <th class="text-center">Promedio Aula</th>
                <th class="text-center">Acción</th>
            </tr>
        `;
        
        try {
            const res = await fetch(`https://virtualclass-sm1i.onrender.com/api/calificaciones/global/docente/${currentUser.id_usuario}`);
            const datos = await res.json();
            
            tableContainer.innerHTML = '';
            if (datos.length === 0) {
                tableContainer.innerHTML = '<tr><td colspan="5" class="text-center">No dictas ningún curso actualmente.</td></tr>';
                return;
            }

            let totalAlumnosG = 0;
            let totalAulasG = datos.length;
            let totalPendientesG = 0;

            datos.forEach(curso => {
                totalAlumnosG += parseInt(curso.total_alumnos || 0);
                totalPendientesG += parseInt(curso.entregas_pendientes || 0);

                const prom = curso.promedio_aula ? parseFloat(curso.promedio_aula).toFixed(2) : '- -';
                let alertClass = curso.entregas_pendientes > 0 ? 'bg-danger-subtle text-danger fw-bold' : 'bg-success-subtle text-success';
                
                tableContainer.innerHTML += `
                    <tr>
                        <td>
                            <span class="d-block fw-bold text-dark">${curso.curso}</span>
                            <small class="text-muted">Sección ${curso.seccion}</small>
                        </td>
                        <td class="text-center"><span class="text-muted">${curso.total_alumnos}</span></td>
                        <td class="text-center">
                            <span class="badge ${alertClass}">${curso.entregas_pendientes} pendientes</span>
                        </td>
                        <td class="text-center"><span class="fw-semibold text-primary">${prom}</span></td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-primary btn-ver-detalles" data-id="${curso.id_clase}">Calificar Aula</button>
                        </td>
                    </tr>
                `;
            });

            // Actualizar tarjetas del docente
            document.getElementById('resumenPromedio').innerText = totalAlumnosG;
            document.getElementById('resumenRevisadas').innerText = totalAulasG;
            document.getElementById('resumenPendientes').innerText = totalPendientesG;

            document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    cursoSelect.value = e.target.dataset.id;
                    cargarDatosCalificaciones(e.target.dataset.id, true);
                });
            });

        } catch (e) {
            console.error(e);
            tableContainer.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar resumen global</td></tr>';
        }
    }

});
