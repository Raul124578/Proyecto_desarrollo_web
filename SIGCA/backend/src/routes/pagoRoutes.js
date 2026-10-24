const express = require('express');
const router = express.Router();

const {
  registrarPago,
  obtenerPagos,
  anularPago
} = require('../controllers/pagoController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

router.use(verificarToken);
router.use(permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/', obtenerPagos);
router.post('/', registrarPago);
router.patch('/:id/anular', anularPago);

module.exports = router;