document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroForm');
    if (!registroForm) return;

    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnRegistro = document.getElementById('btnRegistro');
        const originalText = btnRegistro.innerText;
        btnRegistro.innerText = 'Registrando...';
        btnRegistro.disabled = true;

        const nombres = document.getElementById('nombres').value;
        const apellidos = document.getElementById('apellidos').value;
        const correo = document.getElementById('email').value;
        const contrasena = document.getElementById('password').value;

        // Determinar URL base
        const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3000/api'
            : 'https://virtualclass-sm1i.onrender.com/api'; // O ajustar según el subdominio

        try {
            const response = await fetch(`${API_BASE}/usuarios/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombres, apellidos, correo, contrasena })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Cuenta creada exitosamente. Redirigiendo al login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showToast(data.mensaje || 'Error al registrar la cuenta.', 'danger');
                btnRegistro.innerText = originalText;
                btnRegistro.disabled = false;
            }
        } catch (error) {
            console.error('Error de red:', error);
            showToast('Error de conexión con el servidor.', 'danger');
            btnRegistro.innerText = originalText;
            btnRegistro.disabled = false;
        }
    });
});

function showToast(message, type) {
    const toastEl = document.getElementById('toastMessage');
    const toastBody = document.getElementById('toastBody');
    
    toastBody.textContent = message;
    
    // Reset classes
    toastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
    toastEl.classList.add(`text-bg-${type}`);
    
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
}
