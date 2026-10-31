const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

const validarProfesionalCita = async (req, res, next) => {
  try {
    const { profesionalId } = req.body || {};

    if (
      typeof profesionalId !== 'string' ||
      !mongoose.isValidObjectId(profesionalId)
    ) {
      return res.status(400).json({
        mensaje: 'Debe proporcionar un ID de profesional válido'
      });
    }

    const profesional = await Usuario.findById(profesionalId)
      .select('_id nombre rol estado');

    if (!profesional) {
      return res.status(404).json({
        mensaje: 'Profesional no encontrado'
      });
    }

    if (profesional.rol !== 'PROFESIONAL') {
      return res.status(400).json({
        mensaje: 'El usuario asignado debe tener el rol PROFESIONAL'
      });
    }

    if (profesional.estado !== 'ACTIVO') {
      return res.status(400).json({
        mensaje: 'No se pueden asignar citas a profesionales inactivos'
      });
    }

    req.profesionalCita = profesional;
  } catch (error) {
    console.error('Error al validar profesional:', error.message);

    return res.status(500).json({
      mensaje: 'Error al validar el profesional para la cita'
    });
  }

  return next();
};

module.exports = validarProfesionalCita;