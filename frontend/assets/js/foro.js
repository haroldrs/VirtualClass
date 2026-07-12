// assets/js/foro.js

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:3000/api/foros' : 'https://virtualclass-sm1i.onrender.com/api/foros';

// Variables globales
let forosDelUsuario = [];
let foroSeleccionado = null;
let temasActuales = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) return;

    // Cargar los foros del usuario
    await cargarForos();

    // Configurar evento de búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = e.target.value.trim();
                if (query.length >= 2 && foroSeleccionado) {
                    buscarTemas(query);
                } else if (query.length === 0 && foroSeleccionado) {
                    cargarTemas(foroSeleccionado.id_foro);
                }
            }, 400);
        });
    }

    // Configurar formulario de nuevo tema
    const formNuevoTema = document.getElementById('formNuevoTema');
    if (formNuevoTema) {
        formNuevoTema.addEventListener('submit', async (e) => {
            e.preventDefault();
            await publicarNuevoTema();
        });
    }

    // Configurar formulario de respuesta
    const formRespuesta = document.getElementById('formRespuesta');
    if (formRespuesta) {
        formRespuesta.addEventListener('submit', async (e) => {
            e.preventDefault();
            await publicarRespuesta();
        });
    }
});

// =============================================
// 1. CARGAR FOROS DEL USUARIO
// =============================================
async function cargarForos() {
    const foroSelector = document.getElementById('foroSelector');
    const subtitulo = document.getElementById('foroSubtitulo');

    try {
        const response = await fetch(`${API_BASE}/mis-foros/${currentUser.id_usuario}/${currentUser.rol}`);
        forosDelUsuario = await response.json();

        if (forosDelUsuario.length === 0) {
            subtitulo.textContent = 'No tienes foros disponibles';
            document.getElementById('temasContainer').innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-chat-square-text text-muted" style="font-size: 3rem;"></i>
                    <p class="text-muted mt-3">No estás inscrito en ningún curso con foro activo.</p>
                </div>`;
            return;
        }

        // Llenar el selector de foros
        foroSelector.innerHTML = forosDelUsuario.map(f =>
            `<option value="${f.id_foro}" data-codigo="${f.codigo}" data-curso="${f.nombre_curso}">
                ${f.codigo} - ${f.titulo_foro} (${f.total_temas} temas)
            </option>`
        ).join('');

        // Llenar el selector dentro del modal de nuevo tema
        const selectForoModal = document.getElementById('selectForoModal');
        if (selectForoModal) {
            selectForoModal.innerHTML = forosDelUsuario.map(f =>
                `<option value="${f.id_foro}">${f.codigo} - ${f.nombre_curso}</option>`
            ).join('');
        }

        // Evento al cambiar de foro
        foroSelector.addEventListener('change', () => {
            const idForo = foroSelector.value;
            const foro = forosDelUsuario.find(f => f.id_foro == idForo);
            seleccionarForo(foro);
        });

        // Seleccionar el primer foro automáticamente
        seleccionarForo(forosDelUsuario[0]);

    } catch (error) {
        console.error('Error al cargar foros:', error);
    }
}

function seleccionarForo(foro) {
    foroSeleccionado = foro;
    const subtitulo = document.getElementById('foroSubtitulo');
    subtitulo.textContent = `${foro.codigo} - ${foro.nombre_curso}`;
    cargarTemas(foro.id_foro);

    // Limpiar búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
}

// =============================================
// 2. CARGAR TEMAS DE UN FORO
// =============================================
async function cargarTemas(idForo) {
    const container = document.getElementById('temasContainer');
    container.innerHTML = `
        <div class="col-12 text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted mt-2 small">Cargando temas...</p>
        </div>`;

    try {
        const response = await fetch(`${API_BASE}/${idForo}/temas`);
        temasActuales = await response.json();

        renderizarTemas(temasActuales);
    } catch (error) {
        console.error('Error al cargar temas:', error);
        container.innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                <p class="text-muted mt-2">Error al cargar los temas. Verifica tu conexión.</p>
            </div>`;
    }
}

// =============================================
// 3. RENDERIZAR LISTA DE TEMAS
// =============================================
function renderizarTemas(temas) {
    const container = document.getElementById('temasContainer');

    if (temas.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-chat-square text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-3">Aún no hay temas publicados en este foro.</p>
                <p class="text-muted small">¡Sé el primero en publicar una duda!</p>
            </div>`;
        return;
    }

    container.innerHTML = temas.map(tema => {
        const iniciales = (tema.nombres.charAt(0) + tema.apellidos.charAt(0)).toUpperCase();
        const tiempoRelativo = calcularTiempoRelativo(tema.fecha_creacion);
        const esDocente = forosDelUsuario.length > 0; // Simplificado
        const respText = tema.total_respuestas == 1 ? '1 respuesta' : `${tema.total_respuestas} respuestas`;

        // Colores aleatorios para avatares basados en el id
        const colores = [
            { bg: '#edf2f9', text: '#4a6cf7' },
            { bg: '#e8f5e9', text: '#2e7d32' },
            { bg: '#fff3e0', text: '#e65100' },
            { bg: '#fce4ec', text: '#c62828' },
            { bg: '#e8eaf6', text: '#283593' },
            { bg: '#e0f7fa', text: '#00695c' }
        ];
        const color = colores[tema.id_usuario % colores.length];

        return `
        <div class="col-12">
            <div class="card forum-card p-3 bg-white" style="cursor: pointer;" onclick="verDiscusion(${tema.id_tema})">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="d-flex align-items-center gap-2">
                            <div class="user-avatar-sm" style="background-color: ${color.bg}; color: ${color.text};">${iniciales}</div>
                            <div>
                                <span class="d-block fw-bold text-dark small">${tema.nombres} ${tema.apellidos}</span>
                                <span class="text-muted" style="font-size: 0.75rem;">${tiempoRelativo}</span>
                            </div>
                        </div>
                        <span class="badge bg-primary-subtle text-primary fw-bold rounded-pill">
                            <i class="bi bi-chat-left-text me-1"></i>${respText}
                        </span>
                    </div>
                    <h6 class="fw-bold text-dark mt-3 mb-2">${tema.titulo_tema}</h6>
                    <p class="text-muted small mb-0">${truncarTexto(tema.mensaje_inicial, 180)}</p>
                    <div class="d-flex justify-content-end mt-3 pt-2 border-top">
                        <span class="btn btn-sm btn-light rounded-pill fw-semibold text-primary px-3">
                            <i class="bi bi-arrow-right me-1"></i>Ver Discusión
                        </span>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

// =============================================
// 4. VER DISCUSIÓN (TEMA + RESPUESTAS)
// =============================================
async function verDiscusion(idTema) {
    // Ocultar lista de temas, mostrar panel de discusión
    document.getElementById('vistaListaTemas').style.display = 'none';
    document.getElementById('vistaDiscusion').style.display = 'block';

    const discusionContainer = document.getElementById('discusionContainer');
    discusionContainer.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted mt-2 small">Cargando discusión...</p>
        </div>`;

    try {
        const response = await fetch(`${API_BASE}/temas/${idTema}/discusion`);
        const data = await response.json();

        if (!response.ok) {
            discusionContainer.innerHTML = '<p class="text-danger">Error al cargar la discusión.</p>';
            return;
        }

        renderizarDiscusion(data);

        // Guardar el id del tema para cuando se responda
        document.getElementById('formRespuesta').dataset.idTema = idTema;

    } catch (error) {
        console.error('Error al cargar discusión:', error);
        discusionContainer.innerHTML = '<p class="text-danger">Error de conexión.</p>';
    }
}

function renderizarDiscusion(data) {
    const { tema, respuestas } = data;
    const container = document.getElementById('discusionContainer');
    const inicialesTema = (tema.nombres.charAt(0) + tema.apellidos.charAt(0)).toUpperCase();

    // Título de la discusión
    document.getElementById('tituloDiscusion').textContent = tema.titulo_tema;

    let html = `
    <!-- Mensaje original del tema -->
    <div class="card border-0 bg-white rounded-4 shadow-sm mb-3">
        <div class="card-body p-4">
            <div class="d-flex align-items-center gap-3 mb-3">
                <div class="user-avatar-sm" style="background-color: #edf2f9; color: #4a6cf7; width: 42px; height: 42px; font-size: 0.9rem;">${inicialesTema}</div>
                <div>
                    <span class="d-block fw-bold text-dark">${tema.nombres} ${tema.apellidos}</span>
                    <span class="text-muted" style="font-size: 0.75rem;">
                        <i class="bi bi-clock me-1"></i>${calcularTiempoRelativo(tema.fecha_creacion)} · Autor del tema
                    </span>
                </div>
            </div>
            <p class="text-dark mb-0" style="line-height: 1.7;">${tema.mensaje_inicial}</p>
        </div>
    </div>

    <!-- Separador de respuestas -->
    <div class="d-flex align-items-center gap-2 mb-3 mt-4">
        <i class="bi bi-chat-dots text-primary"></i>
        <span class="fw-bold text-dark small">${respuestas.length} ${respuestas.length === 1 ? 'respuesta' : 'respuestas'}</span>
        <hr class="flex-grow-1 m-0">
    </div>`;

    // Respuestas
    if (respuestas.length === 0) {
        html += `
        <div class="text-center py-4">
            <i class="bi bi-chat-square text-muted" style="font-size: 2rem;"></i>
            <p class="text-muted mt-2 small">Aún no hay respuestas. ¡Sé el primero en responder!</p>
        </div>`;
    } else {
        respuestas.forEach((resp, index) => {
            const inicialesResp = (resp.nombres.charAt(0) + resp.apellidos.charAt(0)).toUpperCase();
            const colores = ['#e8f5e9', '#fff3e0', '#fce4ec', '#e8eaf6', '#e0f7fa', '#f3e5f5'];
            const textColores = ['#2e7d32', '#e65100', '#c62828', '#283593', '#00695c', '#6a1b9a'];
            const ci = index % colores.length;

            html += `
            <div class="card border-0 bg-white rounded-3 shadow-sm mb-2">
                <div class="card-body p-3">
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <div class="user-avatar-sm" style="background-color: ${colores[ci]}; color: ${textColores[ci]};">${inicialesResp}</div>
                        <div>
                            <span class="fw-bold text-dark small">${resp.nombres} ${resp.apellidos}</span>
                            <span class="text-muted d-block" style="font-size: 0.7rem;">${calcularTiempoRelativo(resp.fecha_respuesta)}</span>
                        </div>
                    </div>
                    <p class="text-dark small mb-0 ps-5" style="line-height: 1.6;">${resp.contenido}</p>
                </div>
            </div>`;
        });
    }

    container.innerHTML = html;
}

// =============================================
// 5. VOLVER A LA LISTA DE TEMAS
// =============================================
function volverALista() {
    document.getElementById('vistaDiscusion').style.display = 'none';
    document.getElementById('vistaListaTemas').style.display = 'block';
}

// =============================================
// 6. PUBLICAR UN NUEVO TEMA
// =============================================
async function publicarNuevoTema() {
    const selectForo = document.getElementById('selectForoModal');
    const inputTitulo = document.getElementById('inputTituloTema');
    const textMensaje = document.getElementById('textMensajeTema');
    const btnPublicar = document.getElementById('btnPublicarTema');

    const idForo = selectForo.value;
    const titulo = inputTitulo.value.trim();
    const mensaje = textMensaje.value.trim();

    if (!titulo || !mensaje) {
        alert('Por favor completa todos los campos.');
        return;
    }

    btnPublicar.disabled = true;
    btnPublicar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Publicando...';

    try {
        const response = await fetch(`${API_BASE}/${idForo}/temas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: currentUser.id_usuario,
                titulo_tema: titulo,
                mensaje_inicial: mensaje
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Cerrar modal y limpiar formulario
            const modal = bootstrap.Modal.getInstance(document.getElementById('newTopicModal'));
            modal.hide();
            inputTitulo.value = '';
            textMensaje.value = '';

            // Si el foro publicado es el actual, recargar
            if (foroSeleccionado && foroSeleccionado.id_foro == idForo) {
                await cargarTemas(idForo);
            }

            // Actualizar el selector para reflejar el nuevo conteo
            await cargarForos();
        } else {
            alert('Error: ' + data.mensaje);
        }
    } catch (error) {
        console.error('Error al publicar tema:', error);
        alert('Error al conectar con el servidor.');
    } finally {
        btnPublicar.disabled = false;
        btnPublicar.innerHTML = '<i class="bi bi-send me-2"></i>Publicar Tema';
    }
}

// =============================================
// 7. RESPONDER A UN TEMA
// =============================================
async function publicarRespuesta() {
    const textRespuesta = document.getElementById('textRespuesta');
    const btnResponder = document.getElementById('btnResponder');
    const idTema = document.getElementById('formRespuesta').dataset.idTema;

    const contenido = textRespuesta.value.trim();
    if (!contenido) {
        alert('Escribe tu respuesta antes de enviar.');
        return;
    }

    btnResponder.disabled = true;
    btnResponder.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';

    try {
        const response = await fetch(`${API_BASE}/temas/${idTema}/respuestas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: currentUser.id_usuario,
                contenido: contenido
            })
        });

        const data = await response.json();

        if (response.ok) {
            textRespuesta.value = '';
            // Recargar la discusión para ver la nueva respuesta
            await verDiscusion(idTema);
        } else {
            alert('Error: ' + data.mensaje);
        }
    } catch (error) {
        console.error('Error al responder:', error);
        alert('Error al conectar con el servidor.');
    } finally {
        btnResponder.disabled = false;
        btnResponder.innerHTML = '<i class="bi bi-reply me-2"></i>Responder';
    }
}

// =============================================
// 8. BUSCAR TEMAS
// =============================================
async function buscarTemas(query) {
    const container = document.getElementById('temasContainer');

    try {
        const response = await fetch(`${API_BASE}/${foroSeleccionado.id_foro}/buscar?q=${encodeURIComponent(query)}`);
        const resultados = await response.json();
        renderizarTemas(resultados);
    } catch (error) {
        console.error('Error al buscar:', error);
    }
}

// =============================================
// UTILIDADES
// =============================================
function calcularTiempoRelativo(fechaStr) {
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`;
    if (diffDias < 7) return `Hace ${diffDias} ${diffDias === 1 ? 'día' : 'días'}`;
    if (diffDias < 30) return `Hace ${Math.floor(diffDias / 7)} sem`;
    return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function truncarTexto(texto, maxLength) {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
}
