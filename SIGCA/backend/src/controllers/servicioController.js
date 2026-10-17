
const mongoose = require('mongoose');
const Servicio = require('../models/Servicio');

// Convertir quetzales a centavos
const convertirPrecio = (precio) => {
  if (
    typeof precio !== 'number' ||
    !Number.isFinite(precio) ||
    precio < 0
  ) {
    throw new Error('El precio debe ser un número válido mayor o igual a cero');
  }

  const centavos = Math.round(precio * 100);

  if (
    !Number.isSafeInteger(centavos) ||
    Math.abs(precio * 100 - centavos) > 0.000001
  ) {
    throw new Error('El precio debe tener como máximo dos decimales');
  }

  return centavos;
};

// Manejar errores
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

// Registrar servicio
const crearServicio = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      duracionMinutos,
      precio,
      imagen,
      estado
    } = req.body;

    let precioCentavos;

    try {
      precioCentavos = convertirPrecio(precio);
    } catch (error) {
      return res.status(400).json({
        mensaje: error.message
      });
    }

    const servicio = await Servicio.create({
      nombre,
      descripcion,
      duracionMinutos,
      precioCentavos,
      imagen,
      estado
    });

    return res.status(201).json({
      mensaje: 'Servicio registrado correctamente',
      servicio
    });

  } catch (error) {
    return manejarError(res, error);
  }
};

// Consultar servicios
const obtenerServicios = async (req, res) => {
  try {
    const { estado, buscar } = req.query;
    const filtro = {};

    if (estado) {
      if (!['ACTIVO', 'INACTIVO'].includes(estado)) {
        return res.status(400).json({
          mensaje: 'Estado inválido'
        });
      }

      filtro.estado = estado;
    }

    if (buscar) {
      const textoSeguro = String(buscar)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filtro.nombre = {
        $regex: textoSeguro,
        $options: 'i'
      };
    }

    const servicios = await Servicio.find(filtro)
      .sort({ createdAt: -1 });

    return res.status(200).json(servicios);

  } catch (error) {
    return manejarError(res, error);
  }
};

// Consultar servicio por ID
const obtenerServicioPorId = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'ID de servicio inválido'
      });
    }

    const servicio = await Servicio.findById(req.params.id);

    if (!servicio) {
      return res.status(404).json({
        mensaje: 'Servicio no encontrado'
      });
    }

    return res.status(200).json(servicio);

  } catch (error) {
    return manejarError(res, error);
  }
};

// Actualizar servicio
const actualizarServicio = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'ID de servicio inválido'
      });
    }

    const camposPermitidos = [
      'nombre',
      'descripcion',
      'duracionMinutos',
      'imagen'
    ];

    const datos = {};

    for (const campo of camposPermitidos) {
      if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
        datos[campo] = req.body[campo];
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'precio')) {
      try {
        datos.precioCentavos = convertirPrecio(req.body.precio);
      } catch (error) {
        return res.status(400).json({
          mensaje: error.message
        });
      }
    }

    const servicio = await Servicio.findByIdAndUpdate(
      req.params.id,
      { $set: datos },
      {
        new: true,
        runValidators: true
      }
    );

    if (!servicio) {
      return res.status(404).json({
        mensaje: 'Servicio no encontrado'
      });
    }

    return res.status(200).json({
      mensaje: 'Servicio actualizado correctamente',
      servicio
    });

  } catch (error) {
    return manejarError(res, error);
  }
};

// Activar o desactivar servicio
const cambiarEstadoServicio = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'ID de servicio inválido'
      });
    }

    const { estado } = req.body;

    if (!['ACTIVO', 'INACTIVO'].includes(estado)) {
      return res.status(400).json({
        mensaje: 'El estado debe ser ACTIVO o INACTIVO'
      });
    }

    const servicio = await Servicio.findByIdAndUpdate(
      req.params.id,
      { estado },
      {
        new: true,
        runValidators: true
      }
    );

    if (!servicio) {
      return res.status(404).json({
        mensaje: 'Servicio no encontrado'
      });
    }

    return res.status(200).json({
      mensaje: 'Estado del servicio actualizado correctamente',
      servicio
    });

  } catch (error) {
    return manejarError(res, error);
  }
};

module.exports = {
  crearServicio,
  obtenerServicios,
  obtenerServicioPorId,
  actualizarServicio,
  cambiarEstadoServicio
};