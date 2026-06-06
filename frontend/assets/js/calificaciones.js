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
            cursoSelect.innerHTML = '';
            if (cursos.length === 0) {
                cursoSelect.innerHTML = '<option>No hay cursos asignados</option>';
                return;
            }

            cursos.forEach(curso => {
                cursoSelect.innerHTML += `<option value="${curso.id_clase}">${curso.codigo} - ${curso.nombre} (Sec: ${curso.seccion})</option>`;
            });

            // Cargar datos del primer curso
            if (cursos.length > 0) {
                cargarDatosCalificaciones(cursos[0].id_clase, esDocente);
            }
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
            if (isDocente) {
                const res = await fetch(`http://localhost:3000/api/calificaciones/docente/${idClase}`);
                const alumnos = await res.json();
                renderizarTablaDocente(alumnos);
            } else {
                const res = await fetch(`http://localhost:3000/api/calificaciones/alumno/${currentUser.id_usuario}/${idClase}`);
                const notas = await res.json();
                renderizarTablaAlumno(notas);
            }
        } catch (error) {
            console.error("Error fetching calificaciones", error);
            tableContainer.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los datos</td></tr>';
        }
    }

    function renderizarTablaAlumno(notas) {
        tableContainer.innerHTML = '';
        if (notas.length === 0) {
            tableContainer.innerHTML = '<tr><td colspan="5" class="text-center">No hay evaluaciones programadas.</td></tr>';
            return;
        }

        let sumaPonderada = 0;
        let porcentajeTotal = 0;

        notas.forEach(nota => {
            const date = new Date(nota.fecha_evaluacion).toLocaleDateString('es-ES');
            let badgeClass = 'bg-light text-muted';
            let notaText = '- -';
            let comentarioText = '<span class="text-muted small italic">Aún no calificado por el docente.</span>';

            if (nota.calificacion !== null) {
                const val = parseFloat(nota.calificacion);
                sumaPonderada += val * (nota.porcentaje / 100);
                porcentajeTotal += parseFloat(nota.porcentaje);

                if (val >= 13) badgeClass = 'bg-success-subtle text-success';
                else badgeClass = 'bg-danger-subtle text-danger';
                
                notaText = val.toFixed(2);
                comentarioText = `<span class="text-muted small">${nota.comentario || ''}</span>`;
            }

            tableContainer.innerHTML += `
                <tr>
                    <td>
                        <span class="d-block fw-bold text-dark">${nota.nombre_eva}</span>
                    </td>
                    <td><span class="text-muted fw-semibold">${nota.porcentaje}%</span></td>
                    <td><span class="text-muted">${date}</span></td>
                    <td class="text-center">
                        <span class="badge ${badgeClass} badge-nota">${notaText}</span>
                    </td>
                    <td>${comentarioText}</td>
                </tr>
            `;
        });

        // Actualizar promedio
        if (promedioArea && porcentajeTotal > 0) {
            const prom = (sumaPonderada / (porcentajeTotal/100)).toFixed(2);
            promedioArea.querySelector('.fs-5').innerText = prom;
        } else if (promedioArea) {
            promedioArea.querySelector('.fs-5').innerText = '- -';
        }
    }

    function renderizarTablaDocente(alumnos) {
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
                evalsHTML += `
                    <div class="mb-2 p-2 border rounded bg-light">
                        <strong>${ev.nombre_eva} (${ev.porcentaje}%)</strong>
                        <div class="input-group input-group-sm mt-1">
                            <span class="input-group-text">Nota</span>
                            <input type="number" class="form-control nota-input" data-idev="${ev.id_evaluacion}" data-idus="${alumno.id_usuario}" value="${val}" min="0" max="20" step="0.1">
                        </div>
                    </div>
                `;
            });

            if (alumno.evaluaciones.length === 0) {
                evalsHTML = '<span class="text-muted small">No hay evaluaciones programadas</span>';
            }

            tableContainer.innerHTML += `
                <tr>
                    <td>
                        <span class="d-block fw-bold text-dark">${alumno.apellidos}, ${alumno.nombres}</span>
                        <small class="text-muted">ID: ${alumno.id_usuario}</small>
                    </td>
                    <td>${evalsHTML}</td>
                    <td class="text-center align-middle">
                        <button class="btn btn-sm btn-success btn-guardar-notas" data-idus="${alumno.id_usuario}">Guardar</button>
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
});
