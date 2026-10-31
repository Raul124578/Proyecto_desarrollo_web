const express = require('express');
const router = express.Router();

const {
  obtenerHorarios,
  guardarHorario
} = require('../controllers/horarioController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

// Consulta pública para el portal.
router.get('/', obtenerHorarios);

// Solo el administrador puede configurar los horarios.
router.put(
  '/:diaSemana',
  verificarToken,
  permitirRoles('ADMINISTRADOR'),
  guardarHorario
);

module.exports = router;