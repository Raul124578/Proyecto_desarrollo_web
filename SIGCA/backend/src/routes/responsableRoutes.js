
const express = require('express');
const router = express.Router();

const {
  crearResponsable,
  obtenerResponsables,
  obtenerResponsablePorId,
  actualizarResponsable,
  asociarPacientes,
  obtenerPacientesAsociados
} = require('../controllers/responsableController');

// Registrar responsable
router.post('/', crearResponsable);

// Consultar todos los responsables
router.get('/', obtenerResponsables);

// Consultar responsable por ID
router.get('/:id', obtenerResponsablePorId);

// Actualizar responsable
router.put('/:id', actualizarResponsable);

// Asociar pacientes
router.post('/:id/pacientes', asociarPacientes);

// Consultar pacientes asociados
router.get('/:id/pacientes', obtenerPacientesAsociados);

module.exports = router;