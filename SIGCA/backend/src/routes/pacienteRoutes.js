
const express = require('express');
const router = express.Router();

const {
  crearPaciente,
  obtenerPacientes,
  obtenerPacientePorId,
  actualizarPaciente,
  cambiarEstadoPaciente
} = require('../controllers/pacienteController');

// Consultar pacientes
router.get('/', obtenerPacientes);

// Consultar paciente por ID
router.get('/:id', obtenerPacientePorId);

// Registrar paciente
router.post('/', crearPaciente);

// Actualizar paciente
router.put('/:id', actualizarPaciente);

// Activar o desactivar paciente
router.patch('/:id/estado', cambiarEstadoPaciente);

module.exports = router;
