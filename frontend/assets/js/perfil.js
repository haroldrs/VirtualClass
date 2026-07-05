// assets/js/perfil.js

const API_USUARIOS = 'https://virtualclass-sm1i.onrender.com/api/usuarios';

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentUser) return;

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
            document.getElementById('profileRoleBadge').innerText = data.rol || 'Estudiante';
            document.getElementById('profileEmailBadge').innerText = data.correo;
            
            const iniciales = (data.nombres.charAt(0) + data.apellidos.charAt(0)).toUpperCase();
            document.getElementById('profileInitialsBig').innerText = iniciales;

            // Actualizar currentUser en localStorage (solo si cambiaron datos)
            currentUser.nombres = data.nombres;
            currentUser.apellidos = data.apellidos;
            currentUser.correo = data.correo;
            localStorage.setItem('usuario', JSON.stringify(currentUser));
            
            // Re-renderizar barra superior por si cambió el nombre
            if(typeof renderizarPerfilUsuario === 'function') {
                renderizarPerfilUsuario();
            }
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
    }
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
