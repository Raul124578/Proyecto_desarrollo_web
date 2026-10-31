const express = require('express');
const router = express.Router();

const {
  iniciarSesion,
  obtenerMiUsuario
} = require('../controllers/authController');

const {
  verificarToken
} = require('../middlewares/authMiddleware');

router.post('/login', iniciarSesion);
router.get('/me', verificarToken, obtenerMiUsuario);

module.exports = router;