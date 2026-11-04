const express = require('express');
const router = express.Router();
const {
  crearMaterial,
  obtenerMateriales,
  obtenerMaterialPorId,
  actualizarMaterial,
  cambiarEstadoMaterial,
  eliminarMaterial
} = require('../controllers/materialController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

// Todas las rutas de administración de materiales están protegidas
router.use(verificarToken);
router.use(permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'));

router.post('/', crearMaterial);
router.get('/', obtenerMateriales);
router.get('/:id', obtenerMaterialPorId);
router.put('/:id', actualizarMaterial);
router.patch('/:id/estado', cambiarEstadoMaterial);
router.delete('/:id', eliminarMaterial);

module.exports = router;

