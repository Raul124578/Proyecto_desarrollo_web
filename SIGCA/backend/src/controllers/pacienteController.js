
const mongoose = require('mongoose');
const Paciente = require('../models/Paciente');

const Responsable = require('../models/Responsable');
// Registrar paciente
const crearPaciente = async (req, res) => {
  try {
    const paciente = await Paciente.create(req.body);

    res.status(201).json({
      mensaje: 'Paciente registrado correctamente',
      paciente
    });
  } catch (error) {
    manejarError(res, error);
  }
};

// Consultar y buscar pacientes
const obtenerPacientes = async (req, res) => {
  try {
    const { buscar, estado } = req.query;
    const filtro = {};

    if (buscar) {
      const expresion = new RegExp(
        String(buscar).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );

      filtro.$or = [
        { nombres: expresion },
        { apellidos: expresion },
        { telefono: expresion }
      ];
    }

    if (estado) {
      if (!['ACTIVO', 'INACTIVO'].includes(estado)) {
        return res.status(400).json({
          mensaje: 'Estado inválido'
        });
      }
      filtro.estado = estado;
    }

    const pacientes = await Paciente.find(filtro)
      .populate('responsables', 'nombres apellidos parentesco telefono')
      .sort({ createdAt: -1 });

    res.status(200).json(pacientes);
  } catch (error) {
    manejarError(res, error);
  }
};

// Consultar paciente por ID
const obtenerPacientePorId = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'Identificador de paciente inválido'
      });
    }

    const paciente = await Paciente.findById(req.params.id)
      .populate('responsables');

    if (!paciente) {
      return res.status(404).json({
        mensaje: 'Paciente no encontrado'
      });
    }

    res.status(200).json(paciente);
  } catch (error) {
    manejarError(res, error);
  }
};

// Actualizar paciente
const actualizarPaciente = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'Identificador de paciente inválido'
      });
    }

    // Las asociaciones se gestionarán en el módulo
    // de responsables, no mediante este endpoint.
    const {
      _id,
      id,
      responsables,
      estado,
      createdAt,
      updatedAt,
      ...datos
    } = req.body;

    const camposPermitidos = [
      'fotografia',
      'nombres',
      'apellidos',
      'fechaNacimiento',
      'sexo',
      'telefono',
      'direccion',
      'fechaInicioProceso',
      'observaciones'
    ];

    const actualizacion = {};

    for (const campo of camposPermitidos) {
      if (Object.prototype.hasOwnProperty.call(datos, campo)) {
        actualizacion[campo] = datos[campo];
      }
    }

    const paciente = await Paciente.findByIdAndUpdate(
      req.params.id,
      { $set: actualizacion },
      {
        new: true,
        runValidators: true
      }
    );

    if (!paciente) {
      return res.status(404).json({
        mensaje: 'Paciente no encontrado'
      });
    }

    res.status(200).json({
      mensaje: 'Paciente actualizado correctamente',
      paciente
    });
  } catch (error) {
    manejarError(res, error);
  }
};

// Activar o desactivar paciente
const cambiarEstadoPaciente = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'Identificador de paciente inválido'
      });
    }

    const { estado } = req.body;

    if (!['ACTIVO', 'INACTIVO'].includes(estado)) {
      return res.status(400).json({
        mensaje: 'El estado debe ser ACTIVO o INACTIVO'
      });
    }

    const paciente = await Paciente.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true, runValidators: true }
    );

    if (!paciente) {
      return res.status(404).json({
        mensaje: 'Paciente no encontrado'
      });
    }

    res.status(200).json({
      mensaje: 'Estado actualizado correctamente',
      paciente
    });
  } catch (error) {
    manejarError(res, error);
  }
};

// Manejo de errores de validación
const manejarError = (res, error) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Error de validación',
      errores: Object.values(error.errors).map(e => e.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      mensaje: 'Dato o identificador inválido'
    });
  }

  console.error(error);

  return res.status(500).json({
    mensaje: 'Error interno del servidor'
  });
};

module.exports = {
  crearPaciente,
  obtenerPacientes,
  obtenerPacientePorId,
  actualizarPaciente,
  cambiarEstadoPaciente
};