
const mongoose = require('mongoose');
const Servicio = require('../models/Servicio');

const validarServicioCita = async (req, res, next) => {
  try {
    const { servicioId } = req.body;

    // Verificar que se envíe un ID válido
    if (!mongoose.isValidObjectId(servicioId)) {
      return res.status(400).json({
        mensaje: 'Debe proporcionar un ID de servicio válido'
      });
    }

    // Buscar el servicio en MongoDB
    const servicio = await Servicio.findById(servicioId);

    // Verificar que exista
    if (!servicio) {
      return res.status(404).json({
        mensaje: 'Servicio no encontrado'
      });
    }

    // Verificar que esté activo
    if (servicio.estado !== 'ACTIVO') {
      return res.status(400).json({
        mensaje: 'No se pueden reservar citas con servicios inactivos'
      });
    }

    // Guardar el servicio validado para el controlador de citas
    req.servicioValidado = servicio;

    // Continuar con la creación de la cita
    next();

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al validar el servicio para la cita'
    });
  }
};

module.exports = validarServicioCita;