const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

const verificarToken = async (req, res, next) => {
  const autorizacion = req.get('Authorization') || '';
  const partes = autorizacion.trim().split(/\s+/);

  if (
    partes.length !== 2 ||
    partes[0].toLowerCase() !== 'bearer' ||
    !partes[1]
  ) {
    return res.status(401).json({
      mensaje: 'Debe enviar un token de autenticación'
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      mensaje: 'Error de configuración del servidor'
    });
  }

  let datos;

  try {
    datos = jwt.verify(partes[1], process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch (error) {
    return res.status(401).json({
      mensaje: 'Token inválido o vencido'
    });
  }

  if (
    !datos ||
    typeof datos !== 'object' ||
    typeof datos.sub !== 'string' ||
    !mongoose.isValidObjectId(datos.sub) ||
    !Number.isSafeInteger(datos.versionToken) ||
    datos.versionToken < 0
  ) {
    return res.status(401).json({
      mensaje: 'Token inválido; vuelva a iniciar sesión'
    });
  }

  try {
    const usuario = await Usuario.findById(datos.sub)
      .select('+versionToken');

    if (!usuario || usuario.estado !== 'ACTIVO') {
      return res.status(401).json({
        mensaje: 'Usuario no disponible o inactivo'
      });
    }

    if (datos.versionToken !== (usuario.versionToken ?? 0)) {
      return res.status(401).json({
        mensaje: 'La sesión ya no es válida; vuelva a iniciar sesión'
      });
    }

    req.usuario = usuario;
  } catch (error) {
    console.error('Error al verificar usuario:', error.message);

    return res.status(500).json({
      mensaje: 'Error interno al verificar la sesión'
    });
  }

  return next();
};

const permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        mensaje: 'Debe iniciar sesión'
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        mensaje: 'No tiene permiso para esta operación'
      });
    }

    return next();
  };
};

module.exports = {
  verificarToken,
  permitirRoles
};