const mongoose = require('mongoose');
const AsignacionMaterial = require('../models/AsignacionMaterial');
const Material = require('../models/Material');
const Paciente = require('../models/Paciente');

const manejarError = (res, error) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Error de validación en la asignación',
      errores: Object.values(error.errors).map(e => e.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ mensaje: 'Identificador inválido' });
  }

  console.error('Error en asignaciones de materiales:', error);
  return res.status(500).json({ mensaje: 'Error interno al procesar la asignación' });
};

// 1. Asignar material a paciente activo (RN-09)
const crearAsignacion = async (req, res) => {
  try {
    const { materialId, pacienteId, cantidad, observaciones } = req.body;

    if (!mongoose.isValidObjectId(materialId) || !mongoose.isValidObjectId(pacienteId)) {
      return res.status(400).json({ mensaje: 'Debe proporcionar ID válidos de material y paciente' });
    }

    const cantidadAsignar = Number(cantidad) || 1;
    if (!Number.isInteger(cantidadAsignar) || cantidadAsignar <= 0) {
      return res.status(400).json({ mensaje: 'La cantidad debe ser un número entero mayor a cero' });
    }

    const [material, paciente] = await Promise.all([
      Material.findById(materialId),
      Paciente.findById(pacienteId)
    ]);

    if (!material) {
      return res.status(404).json({ mensaje: 'Material no encontrado' });
    }

    if (!paciente) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado' });
    }

    // Regla de Negocio RN-09: Solo pacientes activos
    if (paciente.estado !== 'ACTIVO') {
      return res.status(400).json({
        mensaje: 'No se puede asignar material: el paciente seleccionado se encuentra INACTIVO (RN-09)'
      });
    }

    if (material.cantidad < cantidadAsignar) {
      return res.status(400).json({
        mensaje: `Stock insuficiente. Disponible: ${material.cantidad}, solicitado: ${cantidadAsignar}`
      });
    }

    // Descontar inventario
    material.cantidad -= cantidadAsignar;
    if (material.cantidad === 0) {
      material.estado = 'AGOTADO';
    } else {
      material.estado = 'EN_USO';
    }
    await material.save();

    // Guardar en colección asignacionesMateriales
    const asignacion = await AsignacionMaterial.create({
      material: material._id,
      paciente: paciente._id,
      cantidad: cantidadAsignar,
      asignadoPor: req.usuario._id,
      observaciones: observaciones || '',
      estado: 'ASIGNADO'
    });

    const respuesta = await AsignacionMaterial.findById(asignacion._id)
      .populate('material', 'nombre categoria estado')
      .populate('paciente', 'nombres apellidos estado')
      .populate('asignadoPor', 'nombre correo');

    return res.status(201).json({
      mensaje: 'Material asignado exitosamente al paciente activo (RN-09)',
      asignacion: respuesta
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

// 2. Obtener todas las asignaciones
const obtenerAsignaciones = async (req, res) => {
  try {
    const { pacienteId, materialId, estado } = req.query;
    const filtro = {};

    if (pacienteId && mongoose.isValidObjectId(pacienteId)) filtro.paciente = pacienteId;
    if (materialId && mongoose.isValidObjectId(materialId)) filtro.material = materialId;
    if (estado) filtro.estado = estado;

    const asignaciones = await AsignacionMaterial.find(filtro)
      .populate('material', 'nombre categoria cantidad estado')
      .populate('paciente', 'nombres apellidos estado')
      .populate('asignadoPor', 'nombre correo')
      .sort({ fechaAsignacion: -1 });

    return res.status(200).json(asignaciones);
  } catch (error) {
    return manejarError(res, error);
  }
};

// 3. Devolver material (reingresar stock)
const devolverAsignacion = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de asignación inválido' });
    }

    const asignacion = await AsignacionMaterial.findById(req.params.id);
    if (!asignacion) {
      return res.status(404).json({ mensaje: 'Asignación no encontrada' });
    }

    if (asignacion.estado === 'DEVUELTO') {
      return res.status(400).json({ mensaje: 'Esta asignación ya fue devuelta previamente' });
    }

    // Devolver unidades al inventario
    const material = await Material.findById(asignacion.material);
    if (material) {
      material.cantidad += asignacion.cantidad;
      if (material.estado === 'AGOTADO' && material.cantidad > 0) {
        material.estado = 'DISPONIBLE';
      }
      await material.save();
    }

    asignacion.estado = 'DEVUELTO';
    asignacion.fechaDevolucion = new Date();
    await asignacion.save();

    return res.status(200).json({
      mensaje: 'Material devuelto y reincorporado al inventario con éxito',
      asignacion
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

module.exports = {
  crearAsignacion,
  obtenerAsignaciones,
  devolverAsignacion
};

