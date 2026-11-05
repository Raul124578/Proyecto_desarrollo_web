const express = require('express');
const router = express.Router();

const {
  crearServicio,
  obtenerServicios,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio
} = require('../controllers/servicioController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

// Consultar servicios (público para portal y solicitudes)
router.get('/', obtenerServicios);

// Consultar servicio por ID (público)
router.get('/:id', obtenerServicioPorId);

// Operaciones administrativas protegidas (RF-05)
router.post(
  '/',
  verificarToken,
  permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'),
  crearServicio
);

router.put(
  '/:id',
  verificarToken,
  permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'),
  actualizarServicio
);

router.patch(
  '/:id/estado',
  verificarToken,
  permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'),
  cambiarEstadoServicio
);

module.exports = router;
