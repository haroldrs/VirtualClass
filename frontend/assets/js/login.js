document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    const getApiUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api/usuarios/login';
        }
        return '/api/usuarios/login'; // En Render, el backend sirve los archivos o están bajo el mismo dominio
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evitar que el formulario recargue la página

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // Si tienes un dominio hardcodeado en producción y el front está separado, usa ese dominio aquí.
                // Por defecto, probaremos ruta relativa o localhost.
                const url = (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') 
                            ? 'https://virtualclass-sm1i.onrender.com/api/usuarios/login' 
                            : 'http://localhost:3000/api/usuarios/login';
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ correo: email, contrasena: password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Guardar los datos del usuario
                    localStorage.setItem('usuario', JSON.stringify(data.usuario));
                    
                    alert('¡Inicio de sesión exitoso! Bienvenido ' + data.usuario.nombres);

                    // Redireccionar según el ROL
                    if (data.usuario.rol && data.usuario.rol.toLowerCase().includes('admin')) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
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
