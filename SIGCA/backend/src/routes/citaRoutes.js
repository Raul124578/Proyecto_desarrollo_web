const express = require('express');
const router = express.Router();

const {
  crearCita,
  obtenerCitas
} = require('../controllers/citaController');

const {
  cambiarEstadoCita
} = require('../controllers/citaEstadoController');

const {
  prepararReprogramacion,
  reprogramarCita
} = require('../controllers/citaReprogramacionController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

const validarPacienteCita = require('../middlewares/validarPacienteCita');
const validarServicioCita = require('../middlewares/validarServicioCita');
const validarProfesionalCita = require('../middlewares/validarProfesionalCita');
const validarHorarioCita = require('../middlewares/validarHorarioCita');

// Todas las rutas requieren iniciar sesión.
router.use(verificarToken);

// Consultar citas; cada profesional solo verá las propias.
router.get(
  '/',
  permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'),
  obtenerCitas
);

// Registrar una cita.
router.post(
  '/',
  permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'),
  validarPacienteCita,
  validarServicioCita,
  validarProfesionalCita,
  validarHorarioCita,
  crearCita
);

// Cambiar estado según los permisos y transiciones permitidas.
router.patch(
  '/:id/estado',
  permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'),
  cambiarEstadoCita
);

// Reprogramar conservando el precio y la duración originales.
router.patch(
  '/:id/reprogramar',
  permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'),
  prepararReprogramacion,
  validarHorarioCita,
  reprogramarCita
);

module.exports = router;