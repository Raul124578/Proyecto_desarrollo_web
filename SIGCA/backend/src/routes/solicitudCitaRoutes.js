const express = require('express');
const router = express.Router();
const {
  crearSolicitud,
  obtenerSolicitudes,
  obtenerSolicitudPorId,
  cambiarEstadoSolicitud,
  convertirSolicitudACita
} = require('../controllers/solicitudCitaController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

// 1. Ruta pública para registrar solicitudes desde el formulario web
router.post('/', crearSolicitud);

// 2. Rutas administrativas protegidas
router.use(verificarToken);
router.use(permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/', obtenerSolicitudes);
router.get('/:id', obtenerSolicitudPorId);
router.patch('/:id/estado', cambiarEstadoSolicitud);
router.post('/:id/convertir-cita', convertirSolicitudACita);

module.exports = router;

