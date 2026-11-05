const express = require('express');
const router = express.Router();

const {
  obtenerContenido,
  actualizarContenido
} = require('../controllers/contenidoInstitucionalController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

// Lectura pública para frontend y portal
router.get('/', obtenerContenido);

// Actualización protegida para administradores
router.put(
  '/',
  verificarToken,
  permitirRoles('ADMINISTRADOR'),
  actualizarContenido
);

module.exports = router;

