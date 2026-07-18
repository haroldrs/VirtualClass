// assets/js/perfil.js

const API_USUARIOS = 'https://virtualclass-sm1i.onrender.com/api/usuarios';

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) return;

    // Manejar apertura de tab si viene con hash en la URL
    const switchTabByHash = () => {
        if (window.location.hash === '#configuracion') {
            const configTab = document.getElementById('configuracion-tab');
            if (configTab) {
                const tab = new bootstrap.Tab(configTab);
                tab.show();
            }
        } else if (window.location.hash === '' || window.location.hash === '#resumen') {
            const resumenTab = document.getElementById('resumen-tab');
            if (resumenTab) {
                const tab = new bootstrap.Tab(resumenTab);
                tab.show();
            }
        }
    };

    switchTabByHash();
    window.addEventListener('hashchange', switchTabByHash);

    await cargarDatosPerfil();

    const formPerfil = document.getElementById('formPerfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarPerfil();
        });
    }

    const formPassword = document.getElementById('formPassword');
    if (formPassword) {
        formPassword.addEventListener('submit', async (e) => {
            e.preventDefault();
            await cambiarPassword();
        });
    }
});

async function cargarDatosPerfil() {
    try {
        const res = await fetch(`${API_USUARIOS}/${currentUser.id_usuario}`);
        const data = await res.json();

        if (res.ok) {
            // Llenar inputs
            document.getElementById('inputNombres').value = data.nombres || '';
            document.getElementById('inputApellidos').value = data.apellidos || '';
            document.getElementById('inputCorreo').value = data.correo || '';
            document.getElementById('inputTelefono').value = data.telefono || '';

            // Actualizar UI del header
            document.getElementById('profileFullName').innerText = `${data.nombres} ${data.apellidos}`;
            const rolCapitalizado = (data.rol || 'Estudiante').charAt(0).toUpperCase() + (data.rol || 'Estudiante').slice(1);
            document.getElementById('profileRoleBadge').innerText = rolCapitalizado;
            document.getElementById('profileEmailBadge').innerText = data.correo;
            
            const iniciales = (data.nombres.charAt(0) + data.apellidos.charAt(0)).toUpperCase();
            document.getElementById('profileInitialsBig').innerText = iniciales;

            // Actualizar currentUser en localStorage
            currentUser.nombres = data.nombres;
            currentUser.apellidos = data.apellidos;
            currentUser.correo = data.correo;
            localStorage.setItem('usuario', JSON.stringify(currentUser));
            
            // Re-renderizar barra superior por si cambió el nombre
            if(typeof renderizarPerfilUsuario === 'function') {
                renderizarPerfilUsuario();
            }

            // Generar Reporte de Rendimiento
            await renderizarReporteRendimiento(data.rol);
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
    }
}

async function renderizarReporteRendimiento(rol) {
    const container = document.getElementById('resumenContainer');
    if (!container) return;
    const esDocente = (rol || '').toLowerCase().includes('docente');

    try {
        if (esDocente) {
            const resp = await fetch(`https://virtualclass-sm1i.onrender.com/api/calificaciones/global/docente/${currentUser.id_usuario}`);
            const datos = await resp.json();
            renderReporteDocente(container, datos);
        } else {
            const resp = await fetch(`https://virtualclass-sm1i.onrender.com/api/calificaciones/global/alumno/${currentUser.id_usuario}`);
            const datos = await resp.json();
            renderReporteAlumno(container, datos);
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="alert alert-danger">Error al cargar el reporte de rendimiento.</div>';
    }
}

function renderReporteAlumno(container, evaluaciones) {
    if (!evaluaciones || evaluaciones.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-bar-chart text-muted" style="font-size:3rem;"></i>
                <p class="text-muted mt-3">Aún no hay calificaciones registradas para mostrar tu rendimiento.</p>
            </div>
        `;
        return;
    }

    // Procesar datos para obtener promedio por curso
    const cursosMap = {};
    evaluaciones.forEach(ev => {
        if (!cursosMap[ev.curso]) {
            cursosMap[ev.curso] = { sumaNotas: 0, sumaPorcentajes: 0, notasList: [] };
        }
        if (ev.calificacion !== null) {
            const calif = parseFloat(ev.calificacion);
            const porc = parseFloat(ev.porcentaje) / 100;
            cursosMap[ev.curso].sumaNotas += (calif * porc);
            cursosMap[ev.curso].sumaPorcentajes += porc;
            cursosMap[ev.curso].notasList.push(calif);
        }
    });

    const labels = [];
    const dataAverages = [];
    let sumGlobal = 0;
    let countCursos = 0;

    Object.keys(cursosMap).forEach(curso => {
        labels.push(curso);
        const data = cursosMap[curso];
        // Calcular nota base 20 considerando solo lo evaluado
        const prom = data.sumaPorcentajes > 0 ? (data.sumaNotas / data.sumaPorcentajes) : 0;
        dataAverages.push(prom.toFixed(2));
        if (prom > 0) {
            sumGlobal += prom;
            countCursos++;
        }
    });

    const promGlobal = countCursos > 0 ? (sumGlobal / countCursos).toFixed(2) : '0.00';
    const ultimasNotas = evaluaciones.filter(e => e.calificacion !== null).slice(-3).reverse();

    container.innerHTML = `
        <div class="row g-4 mb-4">
            <div class="col-lg-4">
                <div class="card card-custom h-100 bg-white">
                    <div class="card-body p-4 text-center">
                        <i class="bi bi-trophy text-warning mb-3 d-block" style="font-size: 2.5rem;"></i>
                        <h6 class="text-muted fw-bold mb-1">Promedio General Acumulado</h6>
                        <h2 class="fw-bold ${promGlobal >= 13 ? 'text-success' : 'text-danger'} mb-0">${promGlobal}</h2>
                        <small class="text-muted">Sobre base vigesimal (20)</small>
                    </div>
                </div>
            </div>
            <div class="col-lg-8">
                <div class="card card-custom h-100 bg-white">
                    <div class="card-body p-4">
                        <h6 class="fw-bold text-dark mb-3"><i class="bi bi-clock-history text-primary me-2"></i>Últimas Calificaciones</h6>
                        <ul class="list-group list-group-flush">
                            ${ultimasNotas.length > 0 ? ultimasNotas.map(n => `
                                <li class="list-group-item px-0 d-flex justify-content-between align-items-center border-0 mb-1">
                                    <div>
                                        <div class="fw-semibold small">${n.curso}</div>
                                    </div>
                                    <span class="badge ${parseFloat(n.calificacion) >= 13 ? 'bg-success' : 'bg-danger'} rounded-pill px-3 py-2">${n.calificacion}</span>
                                </li>
                            `).join('') : '<li class="list-group-item border-0 text-muted small">No hay evaluaciones recientes.</li>'}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div class="card card-custom bg-white">
            <div class="card-body p-4">
                <h5 class="fw-bold text-dark mb-4"><i class="bi bi-bar-chart-fill text-primary me-2"></i>Rendimiento Promedio por Curso</h5>
                <canvas id="chartAlumno" height="100"></canvas>
            </div>
        </div>
    `;

    const ctx = document.getElementById('chartAlumno').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Promedio Obtenido',
                data: dataAverages,
                backgroundColor: 'rgba(74, 108, 247, 0.7)',
                borderColor: 'rgba(74, 108, 247, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20
                }
            }
        }
    });
}

function renderReporteDocente(container, cursos) {
    if (!cursos || cursos.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-briefcase text-muted" style="font-size:3rem;"></i>
                <p class="text-muted mt-3">Aún no tienes cursos a tu cargo para generar un reporte.</p>
            </div>
        `;
        return;
    }

    let totalAlumnosGlobal = 0;
    let totalEntregasPendientes = 0;
    const labels = [];
    const dataAverages = [];

    cursos.forEach(c => {
        totalAlumnosGlobal += parseInt(c.total_alumnos || 0);
        totalEntregasPendientes += parseInt(c.entregas_pendientes || 0);
        labels.push(`${c.curso} (Sec. ${c.seccion})`);
        dataAverages.push(parseFloat(c.promedio_aula || 0).toFixed(2));
    });

    container.innerHTML = `
        <div class="row g-4 mb-4">
            <div class="col-lg-6">
                <div class="card card-custom h-100 bg-white">
                    <div class="card-body p-4 d-flex align-items-center">
                        <div class="bg-primary-subtle text-primary rounded-circle d-flex justify-content-center align-items-center me-3" style="width: 60px; height: 60px;">
                            <i class="bi bi-people-fill fs-3"></i>
                        </div>
                        <div>
                            <h6 class="text-muted fw-bold mb-1">Total de Alumnos a Cargo</h6>
                            <h3 class="fw-bold text-dark mb-0">${totalAlumnosGlobal} <span class="fs-6 fw-normal text-muted">estudiantes</span></h3>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card card-custom h-100 bg-white">
                    <div class="card-body p-4 d-flex align-items-center">
                        <div class="bg-warning-subtle text-warning rounded-circle d-flex justify-content-center align-items-center me-3" style="width: 60px; height: 60px;">
                            <i class="bi bi-journal-text fs-3"></i>
                        </div>
                        <div>
                            <h6 class="text-muted fw-bold mb-1">Entregas Pendientes de Calificar</h6>
                            <h3 class="fw-bold ${totalEntregasPendientes > 0 ? 'text-warning' : 'text-success'} mb-0">${totalEntregasPendientes} <span class="fs-6 fw-normal text-muted">evaluaciones</span></h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card card-custom bg-white">
            <div class="card-body p-4">
                <h5 class="fw-bold text-dark mb-4"><i class="bi bi-graph-up text-primary me-2"></i>Rendimiento Global del Aula por Curso</h5>
                <canvas id="chartDocente" height="100"></canvas>
            </div>
        </div>
    `;

    const ctx = document.getElementById('chartDocente').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Promedio del Aula',
                data: dataAverages,
                backgroundColor: 'rgba(46, 204, 113, 0.7)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20
                }
            }
        }
    });
}

async function guardarPerfil() {
    const btn = document.getElementById('btnGuardarPerfil');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

    const datos = {
        nombres: document.getElementById('inputNombres').value.trim(),
        apellidos: document.getElementById('inputApellidos').value.trim(),
        correo: document.getElementById('inputCorreo').value.trim(),
        telefono: document.getElementById('inputTelefono').value.trim()
    };

    try {
        const res = await fetch(`${API_USUARIOS}/${currentUser.id_usuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            await cargarDatosPerfil();
            mostrarToast('Perfil actualizado correctamente', 'success');
        } else {
            const err = await res.json();
            mostrarToast(err.mensaje || 'Error al actualizar', 'danger');
        }
    } catch (error) {
        console.error(error);
        mostrarToast('Error de conexión', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Guardar Cambios';
    }
}

async function cambiarPassword() {
    const passActual = document.getElementById('inputPassActual').value;
    const passNueva = document.getElementById('inputPassNueva').value;
    const passConfirm = document.getElementById('inputPassConfirm').value;

    if (passNueva !== passConfirm) {
        mostrarToast('Las contraseñas nuevas no coinciden', 'danger');
        return;
    }

    const btn = document.getElementById('btnCambiarPassword');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Actualizando...';

    try {
        const res = await fetch(`${API_USUARIOS}/${currentUser.id_usuario}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contrasenaActual: passActual, nuevaContrasena: passNueva })
        });

        const result = await res.json();

        if (res.ok) {
            document.getElementById('formPassword').reset();
            mostrarToast('Contraseña actualizada con éxito', 'success');
        } else {
            mostrarToast(result.mensaje || 'Error al cambiar contraseña', 'danger');
        }
    } catch (error) {
        console.error(error);
        mostrarToast('Error de conexión', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Actualizar Contraseña';
    }
}

function mostrarToast(mensaje, tipo = 'success') {
    const toastEl = document.getElementById('toastNotificacion');
    const toastMsg = document.getElementById('toastMsg');
    
    toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;
    toastMsg.innerText = mensaje;
    
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
}
