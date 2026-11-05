const express = require('express');
const router = express.Router();

const {
  crearPaciente,
  obtenerPacientes,
  obtenerPacientePorId,
  obtenerHistorialPaciente,
  actualizarPaciente,
  cambiarEstadoPaciente
} = require('../controllers/pacienteController');

// Consultar pacientes
router.get('/', obtenerPacientes);

// Consultar historial de citas y pagos de un paciente (RF-03)
router.get('/:id/historial', obtenerHistorialPaciente);

// Consultar paciente por ID
router.get('/:id', obtenerPacientePorId);

// Registrar paciente
router.post('/', crearPaciente);

// Actualizar paciente (RF-03)
router.put('/:id', actualizarPaciente);

// Activar o desactivar paciente (RF-03)
router.patch('/:id/estado', cambiarEstadoPaciente);

module.exports = router;
