const express = require('express');
const router = express.Router();

const {
  abrirCaja,
  obtenerCajas,
  cerrarCaja
} = require('../controllers/cajaController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

router.use(verificarToken);
router.use(permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/', obtenerCajas);
router.post('/', abrirCaja);
router.patch('/:id/cerrar', cerrarCaja);

module.exports = router;