const express = require('express');
const router = express.Router();

const {
  crearMensaje,
  obtenerMensajes,
  cambiarEstadoMensaje
} = require('../controllers/contactoController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

// Enviar mensaje público (portal de contacto)
router.post('/', crearMensaje);

// Consultar y gestionar mensajes (solo personal autorizado)
router.get(
  '/',
  verificarToken,
  permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'),
  obtenerMensajes
);

router.patch(
  '/:id/estado',
  verificarToken,
  permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'),
  cambiarEstadoMensaje
);

module.exports = router;

