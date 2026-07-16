const express = require('express');
const router = express.Router();
const mc = require('./modular.controller');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Estructura completa (Unidades > Semanas > Recursos + Evaluaciones)
router.get('/:idClase/estructura', mc.getEstructuraCompleta);

// Promedios por unidad y nota final
router.get('/:idClase/promedios/:idUsuario', mc.getPromedios);

// CRUD Unidades
router.get('/:idClase/unidades', mc.getUnidades);
router.post('/:idClase/unidades', mc.createUnidad);
router.delete('/unidades/:idUnidad', mc.deleteUnidad);

// CRUD Semanas
router.get('/unidades/:idUnidad/semanas', mc.getSemanas);
router.post('/:idClase/semanas', mc.createSemana);
router.put('/:idClase/semanas/:idModulo', mc.updateSemana);
router.delete('/semanas/:idModulo', mc.deleteSemana);

// Recursos dentro de una semana
router.get('/semanas/:idModulo/recursos', mc.getRecursosSemana);
router.post('/:idClase/semanas/:idModulo/recursos', upload.single('archivo'), mc.createRecursoSemana);

// Evaluaciones dentro de una semana
router.get('/semanas/:idModulo/evaluaciones', mc.getEvaluacionesSemana);
router.post('/:idClase/semanas/:idModulo/evaluaciones', upload.single('archivo'), mc.createEvaluacionSemana);

module.exports = router;
