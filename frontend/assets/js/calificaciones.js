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
        const responseCursos = await fetch(`http://localhost:3000/api/cursos/mis-cursos/${currentUser.id_usuario}/${currentUser.rol}`);
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
        tableContainer.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
        
        try {
            if (idClase === 'global') {
                if (isDocente) {
                    await cargarGlobalDocente();
                } else {
                    await cargarGlobalAlumno();
                }
            } else {
                if (isDocente) {
                    const res = await fetch(`http://localhost:3000/api/calificaciones/docente/${idClase}`);
                    const alumnos = await res.json();
                    renderizarTablaDocente(alumnos);
                } else {
                    const res = await fetch(`http://localhost:3000/api/evaluaciones/${idClase}/${currentUser.id_usuario}`);
                    const notas = await res.json();
                    renderizarTablaAlumno(notas);
                }
            }
        } catch (error) {
            console.error("Error fetching calificaciones", error);
            tableContainer.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los datos</td></tr>';
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
                        await fetch('http://localhost:3000/api/calificaciones/calificar', {
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
        
        // Mostrar tabla, ocultar grilla
        tableWrapper.classList.remove('d-none');
        gridContainer.classList.add('d-none');
        
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
            const res = await fetch(`http://localhost:3000/api/calificaciones/global/alumno/${currentUser.id_usuario}`);
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
        
        // Mostrar tabla, ocultar grilla
        tableWrapper.classList.remove('d-none');
        gridContainer.classList.add('d-none');
        
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
            const res = await fetch(`http://localhost:3000/api/calificaciones/global/docente/${currentUser.id_usuario}`);
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
