const express = require('express');
const router = express.Router();

const {
  crearUsuario,
  obtenerUsuarios,
  actualizarUsuario,
  restablecerPassword
} = require('../controllers/usuarioController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

// Todas estas operaciones requieren un administrador autenticado.
router.use(verificarToken);
router.use(permitirRoles('ADMINISTRADOR'));

// Consultar usuarios.
router.get('/', obtenerUsuarios);

// Registrar usuario.
router.post('/', crearUsuario);

// Editar información, rol o estado.
router.put('/:id', actualizarUsuario);

// Restablecer contraseña.
router.put('/:id/password', restablecerPassword);

module.exports = router;