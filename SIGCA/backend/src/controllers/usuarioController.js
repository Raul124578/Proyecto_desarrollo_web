const Usuario = require('../models/Usuario');
const mongoose = require('mongoose');

const manejarError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({
      mensaje: 'El correo ya está registrado'
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Datos de usuario inválidos',
      errores: Object.values(error.errors).map(e => e.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      mensaje: 'Identificador o dato inválido'
    });
  }

  console.error('Error en usuarios:', error.message);

  return res.status(500).json({
    mensaje: 'Error interno del servidor'
  });
};

// Registrar un usuario.
const crearUsuario = async (req, res) => {
  try {
    const { nombre, correo, password, rol } = req.body || {};

    if (
      typeof nombre !== 'string' ||
      typeof correo !== 'string' ||
      typeof password !== 'string' ||
      typeof rol !== 'string'
    ) {
      return res.status(400).json({
        mensaje: 'Debe enviar nombre, correo, password y rol como texto'
      });
    }

    const usuario = await Usuario.create({
      nombre,
      correo,
      password,
      rol,
      estado: 'ACTIVO'
    });

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

// Consultar usuarios sin devolver contraseñas.
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find()
      .select('_id nombre correo rol estado createdAt updatedAt')
      .sort({ createdAt: -1 });

    return res.status(200).json(usuarios);
  } catch (error) {
    return manejarError(res, error);
  }
};

// Editar información, asignar rol y activar o desactivar.
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        mensaje: 'Identificador de usuario inválido'
      });
    }

    const datos = req.body || {};
    const camposPermitidos = ['nombre', 'correo', 'rol', 'estado'];
    const campos = Object.keys(datos);

    if (
      campos.length === 0 ||
      campos.some(campo => !camposPermitidos.includes(campo)) ||
      campos.some(campo => typeof datos[campo] !== 'string')
    ) {
      return res.status(400).json({
        mensaje: 'Envíe únicamente nombre, correo, rol o estado como texto'
      });
    }

    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    // Evitar que el administrador pierda su propio acceso.
    if (
      usuario._id.equals(req.usuario._id) &&
      (
        (datos.rol !== undefined && datos.rol !== 'ADMINISTRADOR') ||
        (datos.estado !== undefined && datos.estado !== 'ACTIVO')
      )
    ) {
      return res.status(400).json({
        mensaje: 'No puede desactivar su propia cuenta ni cambiar su propio rol'
      });
    }

    for (const campo of campos) {
      usuario[campo] = datos[campo];
    }

    await usuario.save();

    return res.status(200).json({
      mensaje: 'Usuario actualizado correctamente',
      usuario
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

// Restablecer la contraseña y revocar las sesiones anteriores.
// Esta operación debe estar protegida por el rol ADMINISTRADOR.
const restablecerPassword = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        mensaje: 'Identificador de usuario inválido'
      });
    }

    const datos = req.body || {};
    const campos = Object.keys(datos);

    if (
      campos.length !== 1 ||
      campos[0] !== 'password' ||
      typeof datos.password !== 'string'
    ) {
      return res.status(400).json({
        mensaje: 'Debe enviar únicamente password como texto'
      });
    }

    if (
      datos.password.length < 8 ||
      Buffer.byteLength(datos.password, 'utf8') > 72
    ) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes'
      });
    }

    const usuario = await Usuario.findById(id)
      .select('+versionToken');

    if (!usuario) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    usuario.password = datos.password;

    // El modelo genera el hash e incrementa versionToken.
    await usuario.save();

    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      mensaje: 'Contraseña restablecida; el usuario debe volver a iniciar sesión'
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  actualizarUsuario,
  restablecerPassword
};