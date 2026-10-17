
const mongoose = require('mongoose');
const Paciente = require('../models/Paciente');

const validarPacienteCita = async (req, res, next) => {
  try {
    const { pacienteId } = req.body;

    if (!mongoose.isValidObjectId(pacienteId)) {
      return res.status(400).json({
        mensaje: 'Debe proporcionar un ID de paciente válido'
      });
    }

    const paciente = await Paciente.findById(pacienteId);

    if (!paciente) {
      return res.status(404).json({
        mensaje: 'Paciente no encontrado'
      });
    }

    if (paciente.estado !== 'ACTIVO') {
      return res.status(400).json({
        mensaje: 'No se pueden reservar citas para pacientes inactivos'
      });
    }

    // La edad se calcula automáticamente en el modelo
    if (paciente.edad < 18 && paciente.responsables.length === 0) {
      return res.status(400).json({
        mensaje: 'El paciente es menor de edad y debe tener al menos un responsable asociado'
      });
    }

    next();

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al validar el paciente para la cita'
    });
  }
};

module.exports = validarPacienteCita;