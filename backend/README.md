1. ¡Hola equipo! 🚀 Ya está configurado el servidor Backend y la conexión a la base de datos. Para que les funcione en sus computadoras, sigan estos pasos exactos:

1. Descarguen la actualización:
Abran su terminal en la carpeta del proyecto y ejecuten:
->git pull origin main

2. Instalen las nuevas librerías (Express, pg, etc.):
Entren a la carpeta backend (cd backend) y ejecuten:
->npm install

3. Creen la Base de Datos:
Abran PostgreSQL. Creen una nueva base de datos que se llame EXACTAMENTE DB_VirtualClass.

4. Creen las tablas:
Entren a esa nueva base de datos en PostgreSQL, abran un editor SQL y peguen todo el código que les dejé en el archivo database.sql que acaba de descargarse. Denle a ejecutar para que se creen sus tablas.

5. Creen su archivo secreto:
En la carpeta backend, creen un archivo llamado .env (con el punto al inicio) y peguen esto, cambiando la contraseña por la que ustedes le pusieron a su PostgreSQL:

DB_USER=postgres
DB_PASSWORD=pongan_su_contraseña_aqui
DB_HOST=localhost
DB_PORT=5432
DB_NAME=DB_VirtualClass
PORT=3000

6. ¡Enciendan el motor!
En la terminal, dentro de la carpeta backend, corran:
npx nodemon src/index.js
Si lo hicieron bien, les saldrá un mensaje verde diciendo: ✅ Conexión a la base de datos PostgreSQL exitosa.