
const mongoose = require('mongoose');
const Responsable = require('../models/Responsable');
const Paciente = require('../models/Paciente');

// Manejo de errores
const manejarError = (res, error) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Error de validación',
      errores: Object.values(error.errors).map(e => e.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      mensaje: 'Identificador o dato inválido'
    });
  }

  console.error(error);

  return res.status(500).json({
    mensaje: 'Error interno del servidor'
  });
};

// Registrar responsable
const crearResponsable = async (req, res) => {
  try {
    const {
      fotografia,
      nombres,
      apellidos,
      parentesco,
      telefono,
      correo,
      direccion
    } = req.body;

    const responsable = await Responsable.create({
      fotografia,
      nombres,
      apellidos,
      parentesco,
      telefono,
      correo,
      direccion
    });

    return res.status(201).json({
      mensaje: 'Responsable registrado correctamente',
      responsable
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

// Consultar responsables
const obtenerResponsables = async (req, res) => {
  try {
    const responsables = await Responsable.find()
      .populate('pacientes', 'nombres apellidos estado fechaNacimiento')
      .sort({ createdAt: -1 });

    return res.status(200).json(responsables);
  } catch (error) {
    return manejarError(res, error);
  }
};

// Consultar responsable por ID
const obtenerResponsablePorId = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'ID de responsable inválido'
      });
    }

    const responsable = await Responsable.findById(req.params.id)
      .populate('pacientes', 'nombres apellidos estado fechaNacimiento');

    if (!responsable) {
      return res.status(404).json({
        mensaje: 'Responsable no encontrado'
      });
    }

    return res.status(200).json(responsable);
  } catch (error) {
    return manejarError(res, error);
  }
};

// Actualizar responsable
const actualizarResponsable = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'ID de responsable inválido'
      });
    }

    const camposPermitidos = [
      'fotografia',
      'nombres',
      'apellidos',
      'parentesco',
      'telefono',
      'correo',
      'direccion'
    ];

    const datos = {};

    for (const campo of camposPermitidos) {
      if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
        datos[campo] = req.body[campo];
      }
    }

    const responsable = await Responsable.findByIdAndUpdate(
      req.params.id,
      { $set: datos },
      { new: true, runValidators: true }
    );

    if (!responsable) {
      return res.status(404).json({
        mensaje: 'Responsable no encontrado'
      });
    }

    return res.status(200).json({
      mensaje: 'Responsable actualizado correctamente',
      responsable
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

// Asociar uno o varios pacientes a un responsable
const asociarPacientes = async (req, res) => {
  try {
    const { id } = req.params;
    const { pacientes } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        mensaje: 'ID de responsable inválido'
      });
    }

    if (
      !Array.isArray(pacientes) ||
      pacientes.length === 0 ||
      !pacientes.every(p => mongoose.isValidObjectId(p))
    ) {
      return res.status(400).json({
        mensaje: 'Debe proporcionar un arreglo de IDs válidos de pacientes'
      });
    }

    const responsable = await Responsable.findById(id);

    if (!responsable) {
      return res.status(404).json({
        mensaje: 'Responsable no encontrado'
      });
    }

    const idsUnicos = [...new Set(pacientes.map(p => String(p)))];

    const pacientesEncontrados = await Paciente.find({
      _id: { $in: idsUnicos }
    });

    if (pacientesEncontrados.length !== idsUnicos.length) {
      return res.status(404).json({
        mensaje: 'Uno o varios pacientes no existen'
      });
    }

    // Agregar referencias al responsable sin duplicarlas
    await Responsable.findByIdAndUpdate(id, {
      $addToSet: {
        pacientes: { $each: idsUnicos }
      }
    });

    // Agregar el responsable a cada paciente
    await Paciente.updateMany(
      { _id: { $in: idsUnicos } },
      { $addToSet: { responsables: id } }
    );

    const resultado = await Responsable.findById(id)
      .populate('pacientes', 'nombres apellidos estado');

    return res.status(200).json({
      mensaje: 'Pacientes asociados correctamente',
      responsable: resultado
    });

  } catch (error) {
    return manejarError(res, error);
  }
};

// Consultar pacientes asociados
const obtenerPacientesAsociados = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'ID de responsable inválido'
      });
    }

    const responsable = await Responsable.findById(req.params.id)
      .populate('pacientes');

    if (!responsable) {
      return res.status(404).json({
        mensaje: 'Responsable no encontrado'
      });
    }

    return res.status(200).json({
      responsable: `${responsable.nombres} ${responsable.apellidos}`,
      pacientes: responsable.pacientes
    });

  } catch (error) {
    return manejarError(res, error);
  }
};

module.exports = {
  crearResponsable,
  obtenerResponsables,
  obtenerResponsablePorId,
  actualizarResponsable,
  asociarPacientes,
  obtenerPacientesAsociados
};