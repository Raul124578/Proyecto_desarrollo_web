const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const iniciarSesion = async (req, res) => {
  try {
    const { correo, password } = req.body || {};

    if (
      typeof correo !== 'string' ||
      typeof password !== 'string' ||
      !correo.trim() ||
      !password
    ) {
      return res.status(400).json({
        mensaje: 'Debe proporcionar correo y contraseña'
      });
    }

    if (Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({
        mensaje: 'La contraseña no puede superar 72 bytes'
      });
    }

    const usuario = await Usuario.findOne({
      correo: correo.trim().toLowerCase()
    }).select('+password +versionToken');

    const passwordCorrecto = usuario
      ? await usuario.compararPassword(password)
      : false;

    if (
      !usuario ||
      !passwordCorrecto ||
      usuario.estado !== 'ACTIVO'
    ) {
      return res.status(401).json({
        mensaje: 'Credenciales inválidas o usuario inactivo'
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('Falta configurar JWT_SECRET');
    }

    const token = jwt.sign(
      {
        versionToken: usuario.versionToken ?? 0
      },
      process.env.JWT_SECRET,
      {
        subject: usuario._id.toString(),
        algorithm: 'HS256',
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      }
    );

    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      token,
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        estado: usuario.estado
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);

    return res.status(500).json({
      mensaje: 'Error interno al iniciar sesión'
    });
  }
};

const obtenerMiUsuario = (req, res) => {
  res.set('Cache-Control', 'no-store');

  return res.status(200).json({
    usuario: {
      _id: req.usuario._id,
      nombre: req.usuario.nombre,
      correo: req.usuario.correo,
      rol: req.usuario.rol,
      estado: req.usuario.estado
    }
  });
};

module.exports = {
  iniciarSesion,
  obtenerMiUsuario
};