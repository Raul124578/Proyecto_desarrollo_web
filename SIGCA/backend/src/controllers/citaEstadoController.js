const mongoose = require('mongoose');
const Cita = require('../models/Cita');

const cambiarEstadoCita = async (req, res) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        mensaje: 'Debe iniciar sesión'
      });
    }

    const { id } = req.params;
    const datos = req.body || {};
    const { estado } = datos;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        mensaje: 'Identificador de cita inválido'
      });
    }

    if (
      Object.keys(datos).length !== 1 ||
      typeof estado !== 'string' ||
      !['CONFIRMADA', 'COMPLETADA', 'CANCELADA'].includes(estado)
    ) {
      return res.status(400).json({
        mensaje: 'Envíe únicamente estado: CONFIRMADA, COMPLETADA o CANCELADA'
      });
    }

    const permisos = {
      ADMINISTRADOR: ['CONFIRMADA', 'COMPLETADA', 'CANCELADA'],
      RECEPCIONISTA: ['CONFIRMADA', 'CANCELADA'],
      PROFESIONAL: ['COMPLETADA']
    };

    if (!permisos[req.usuario.rol]?.includes(estado)) {
      return res.status(403).json({
        mensaje: 'No tiene permiso para realizar este cambio'
      });
    }

    const filtro = { _id: id };

    // El profesional solo puede completar sus propias citas.
    if (req.usuario.rol === 'PROFESIONAL') {
      filtro.profesional = req.usuario._id;
    }

    const cita = await Cita.findOne(filtro);

    if (!cita) {
      return res.status(404).json({
        mensaje: 'Cita no encontrada'
      });
    }

    const transiciones = {
      PENDIENTE: ['CONFIRMADA', 'CANCELADA'],
      CONFIRMADA: ['COMPLETADA', 'CANCELADA'],
      COMPLETADA: [],
      CANCELADA: []
    };

    if (!transiciones[cita.estado]?.includes(estado)) {
      return res.status(409).json({
        mensaje: `No se puede cambiar una cita de ${cita.estado} a ${estado}`
      });
    }

    cita.estado = estado;
    cita.actualizadoPor = req.usuario._id;

    // Ejecuta las validaciones y actualiza los minutos reservados.
    await cita.save();

    return res.status(200).json({
      mensaje: 'Estado de la cita actualizado correctamente',
      cita
    });
  } catch (error) {
    if (error.name === 'VersionError') {
      return res.status(409).json({
        mensaje: 'La cita fue modificada; vuelva a consultarla'
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        mensaje: 'El profesional ya tiene una cita en ese horario'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        mensaje: 'Datos de cita inválidos',
        errores: Object.values(error.errors).map(e => e.message)
      });
    }

    console.error('Error al cambiar estado de cita:', error.message);

    return res.status(500).json({
      mensaje: 'Error interno al actualizar la cita'
    });
  }
};

module.exports = {
  cambiarEstadoCita
};