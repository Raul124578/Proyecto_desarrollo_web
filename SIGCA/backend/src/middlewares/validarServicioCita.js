const mongoose = require('mongoose');
const Servicio = require('../models/Servicio');

const validarServicioCita = async (req, res, next) => {
  try {
    const { servicioId } = req.body || {};

    if (
      typeof servicioId !== 'string' ||
      !mongoose.isValidObjectId(servicioId)
    ) {
      return res.status(400).json({
        mensaje: 'Debe proporcionar un ID de servicio válido'
      });
    }

    const servicio = await Servicio.findById(servicioId);

    if (!servicio) {
      return res.status(404).json({
        mensaje: 'Servicio no encontrado'
      });
    }

    if (servicio.estado !== 'ACTIVO') {
      return res.status(400).json({
        mensaje: 'No se pueden reservar citas con servicios inactivos'
      });
    }

    if (
      !Number.isSafeInteger(servicio.duracionMinutos) ||
      servicio.duracionMinutos <= 0
    ) {
      return res.status(400).json({
        mensaje: 'El servicio debe tener una duración válida en minutos enteros'
      });
    }

    if (
      !Number.isSafeInteger(servicio.precioCentavos) ||
      servicio.precioCentavos < 0
    ) {
      return res.status(400).json({
        mensaje: 'El servicio debe tener un precio válido en centavos enteros'
      });
    }

    req.servicioValidado = servicio;
  } catch (error) {
    console.error('Error al validar servicio:', error.message);

    return res.status(500).json({
      mensaje: 'Error al validar el servicio para la cita'
    });
  }

  return next();
};

module.exports = validarServicioCita;