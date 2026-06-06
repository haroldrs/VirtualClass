document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evitar que el formulario recargue la página

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:3000/api/usuarios/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ correo: email, contrasena: password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Guardar los datos del usuario y el token (si hubiera) en localStorage
                    localStorage.setItem('usuario', JSON.stringify(data.usuario));
                    
                    // Mostrar un mensaje de éxito temporal
                    alert('¡Inicio de sesión exitoso! Bienvenido ' + data.usuario.nombres);

                    // Redireccionar al dashboard independientemente del rol,
                    // ya que usaremos el mismo dashboard.html
                    window.location.href = 'dashboard.html';
                } else {
                    // Mostrar error
                    alert('Error: ' + data.mensaje);
                }
            } catch (error) {
                console.error('Error al iniciar sesión:', error);
                alert('Error al conectar con el servidor. Inténtalo más tarde.');
            }
        });
    }
});
