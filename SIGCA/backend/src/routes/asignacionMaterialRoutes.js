const express = require('express');
const router = express.Router();

const {
  crearAsignacion,
  obtenerAsignaciones,
  devolverAsignacion
} = require('../controllers/asignacionMaterialController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

router.use(verificarToken);
router.use(permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'));

router.post('/', crearAsignacion);
router.get('/', obtenerAsignaciones);
router.patch('/:id/devolver', devolverAsignacion);

module.exports = router;

