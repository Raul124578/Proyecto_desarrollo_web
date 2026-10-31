const mongoose = require('mongoose');
const Cita = require('../models/Cita');

// Cargar la cita antes de validar el nuevo horario.
const prepararReprogramacion = async (req, res, next) => {
  try {
    if (
      !req.usuario ||
      !['ADMINISTRADOR', 'RECEPCIONISTA'].includes(req.usuario.rol)
    ) {
      return res.status(403).json({
        mensaje: 'No tiene permiso para reprogramar citas'
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'Identificador de cita inválido'
      });
    }

    const datos = req.body || {};

    if (
      Object.keys(datos).length !== 1 ||
      typeof datos.fechaInicio !== 'string'
    ) {
      return res.status(400).json({
        mensaje: 'Envíe únicamente fechaInicio como texto'
      });
    }

    const cita = await Cita.findById(req.params.id);

    if (!cita) {
      return res.status(404).json({
        mensaje: 'Cita no encontrada'
      });
    }

    if (!['PENDIENTE', 'CONFIRMADA'].includes(cita.estado)) {
      return res.status(409).json({
        mensaje: 'Solo se pueden reprogramar citas pendientes o confirmadas'
      });
    }

    req.citaReprogramar = cita;

    // Usar la duración original, aunque cambie el servicio.
    // El siguiente middleware necesita este dato.
    req.servicioValidado = {
      duracionMinutos: cita.duracionMinutos
    };
  } catch (error) {
    console.error('Error al cargar cita:', error.message);

    return res.status(500).json({
      mensaje: 'Error interno al consultar la cita'
    });
  }

  return next();
};

// Guardar después de validar fecha futura y horario de atención.
const reprogramarCita = async (req, res) => {
  try {
    const cita = req.citaReprogramar;

    if (!cita || !req.fechasCita) {
      throw new Error('Faltan las validaciones de reprogramación');
    }

    await Cita.init();

    cita.fechaInicio = req.fechasCita.fechaInicio;
    cita.fechaFin = req.fechasCita.fechaFin;
    cita.actualizadoPor = req.usuario._id;

    // El índice impide cruces; la concurrencia optimista
    // evita sobrescribir otros cambios sobre esta cita.
    await cita.save();

    return res.status(200).json({
      mensaje: 'Cita reprogramada correctamente',
      cita
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        mensaje: 'El profesional ya tiene una cita en ese horario'
      });
    }

    if (error.name === 'VersionError') {
      return res.status(409).json({
        mensaje: 'La cita fue modificada; vuelva a consultarla'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        mensaje: 'Datos de cita inválidos',
        errores: Object.values(error.errors).map(e => e.message)
      });
    }

    console.error('Error al reprogramar cita:', error.message);

    return res.status(500).json({
      mensaje: 'Error interno al reprogramar la cita'
    });
  }
};

module.exports = {
  prepararReprogramacion,
  reprogramarCita
};