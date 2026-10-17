
const express = require('express');
const router = express.Router();

const {
  crearServicio,
  obtenerServicios,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio
} = require('../controllers/servicioController');

// Registrar servicio
router.post('/', crearServicio);

// Consultar servicios
router.get('/', obtenerServicios);

// Consultar servicio por ID
router.get('/:id', obtenerServicioPorId);

// Actualizar servicio
router.put('/:id', actualizarServicio);

// Activar o desactivar servicio
router.patch('/:id/estado', cambiarEstadoServicio);

module.exports = router;