const mongoose = require('mongoose');
const MensajeContacto = require('../models/MensajeContacto');

const manejarError = (res, error) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Error de validación en el mensaje de contacto',
      errores: Object.values(error.errors).map(e => e.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      mensaje: 'Identificador inválido'
    });
  }

  console.error('Error en contacto:', error);

  return res.status(500).json({
    mensaje: 'Error interno del servidor al procesar el mensaje de contacto'
  });
};

// 1. Enviar mensaje de contacto (público)
const crearMensaje = async (req, res) => {
  try {
    const { nombre, correo, telefono, asunto, mensaje } = req.body;

    if (!nombre || !correo || !telefono || !asunto || !mensaje) {
      return res.status(400).json({
        mensaje: 'Todos los campos son obligatorios'
      });
    }

    const nuevoMensaje = await MensajeContacto.create({
      nombre: String(nombre).trim(),
      correo: String(correo).trim().toLowerCase(),
      telefono: String(telefono).trim(),
      asunto: String(asunto).trim(),
      mensaje: String(mensaje).trim(),
      estado: 'NUEVO'
    });

    return res.status(201).json({
      mensaje: 'Mensaje de contacto enviado correctamente',
      mensajeContacto: nuevoMensaje
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

// 2. Obtener lista de mensajes (admin)
const obtenerMensajes = async (req, res) => {
  try {
    const { estado } = req.query;
    const filtro = {};

    if (estado && ['NUEVO', 'LEIDO', 'RESPONDIDO'].includes(estado)) {
      filtro.estado = estado;
    }

    const mensajes = await MensajeContacto.find(filtro)
      .populate('atendidoPor', 'nombre correo')
      .sort({ createdAt: -1 });

    return res.status(200).json(mensajes);
  } catch (error) {
    return manejarError(res, error);
  }
};

// 3. Cambiar estado / responder mensaje (admin)
const cambiarEstadoMensaje = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de mensaje inválido' });
    }

    const { estado, respuesta } = req.body;
    const datos = {};

    if (estado) {
      if (!['NUEVO', 'LEIDO', 'RESPONDIDO'].includes(estado)) {
        return res.status(400).json({ mensaje: 'Estado inválido' });
      }
      datos.estado = estado;
    }

    if (respuesta !== undefined) {
      datos.respuesta = String(respuesta).trim();
      datos.fechaRespuesta = new Date();
      datos.atendidoPor = req.usuario?._id;
      if (!estado) datos.estado = 'RESPONDIDO';
    }

    const actualizado = await MensajeContacto.findByIdAndUpdate(
      req.params.id,
      { $set: datos },
      { new: true, runValidators: true }
    );

    if (!actualizado) {
      return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
    }

    return res.status(200).json({
      mensaje: 'Mensaje de contacto actualizado correctamente',
      mensajeContacto: actualizado
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

module.exports = {
  crearMensaje,
  obtenerMensajes,
  cambiarEstadoMensaje
};

