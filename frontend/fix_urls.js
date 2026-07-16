const fs = require('fs');

const files = [
  'frontend/assets/js/asesorias.js',
  'frontend/assets/js/agenda.js',
  'frontend/assets/js/calificaciones.js',
  'frontend/assets/js/foro.js',
  'frontend/assets/js/clase-detalle.js',
  'frontend/assets/js/dashboard.js',
  'frontend/inicio.js'
];

for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\/\$\{currentUser\.rol\}/g, '/${encodeURIComponent(currentUser.rol)}');
  content = content.replace(/\?rol=\$\{currentUser\.rol\}/g, '?rol=${encodeURIComponent(currentUser.rol)}');
  fs.writeFileSync(file, content);
}
console.log('Replaced all');
