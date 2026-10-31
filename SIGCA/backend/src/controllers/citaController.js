const Cita = require('../models/Cita');

const manejarError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({
      mensaje: 'El profesional ya tiene una cita en ese horario'
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Datos de cita inválidos',
      errores: Object.values(error.errors).map(e => e.message)
    });
  }

  console.error('Error en citas:', error.message);

  return res.status(500).json({
    mensaje: 'Error interno al procesar la cita'
  });
};

// Registrar una cita con los datos previamente validados.
const crearCita = async (req, res) => {
  try {
    if (
      !req.usuario ||
      !['ADMINISTRADOR', 'RECEPCIONISTA'].includes(req.usuario.rol)
    ) {
      return res.status(403).json({
        mensaje: 'No tiene permiso para registrar citas'
      });
    }

    const datos = req.body || {};
    const permitidos = [
      'pacienteId',
      'servicioId',
      'profesionalId',
      'fechaInicio',
      'observaciones'
    ];

    if (Object.keys(datos).some(campo => !permitidos.includes(campo))) {
      return res.status(400).json({
        mensaje: 'La solicitud contiene campos no permitidos'
      });
    }

    if (
      datos.observaciones !== undefined &&
      typeof datos.observaciones !== 'string'
    ) {
      return res.status(400).json({
        mensaje: 'Las observaciones deben enviarse como texto'
      });
    }

    if (
      !req.pacienteCita ||
      !req.servicioValidado ||
      !req.profesionalCita ||
      !req.fechasCita
    ) {
      throw new Error('Faltan las validaciones previas de la cita');
    }

    // Esperar la inicialización de los índices del modelo.
    await Cita.init();

    const cita = await Cita.create({
      paciente: req.pacienteCita._id,
      servicio: req.servicioValidado._id,
      profesional: req.profesionalCita._id,
      fechaInicio: req.fechasCita.fechaInicio,
      fechaFin: req.fechasCita.fechaFin,
      duracionMinutos: req.servicioValidado.duracionMinutos,
      precioCentavos: req.servicioValidado.precioCentavos,
      estado: 'PENDIENTE',
      observaciones: datos.observaciones ?? '',
      creadoPor: req.usuario._id,
      actualizadoPor: req.usuario._id
    });

    return res.status(201).json({
      mensaje: 'Cita registrada correctamente',
      cita
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

// Consultar citas. El profesional solo puede ver las propias.
const obtenerCitas = async (req, res) => {
  try {
    if (
      !req.usuario ||
      ![
        'ADMINISTRADOR',
        'RECEPCIONISTA',
        'PROFESIONAL'
      ].includes(req.usuario.rol)
    ) {
      return res.status(403).json({
        mensaje: 'No tiene permiso para consultar citas'
      });
    }

    const paginaTexto = req.query.pagina ?? '1';
    const limiteTexto = req.query.limite ?? '20';

    if (
      typeof paginaTexto !== 'string' ||
      typeof limiteTexto !== 'string' ||
      !/^[1-9]\d*$/.test(paginaTexto) ||
      !/^[1-9]\d*$/.test(limiteTexto)
    ) {
      return res.status(400).json({
        mensaje: 'La página y el límite deben ser enteros positivos'
      });
    }

    const pagina = Number(paginaTexto);
    const limite = Number(limiteTexto);
    const salto = (pagina - 1) * limite;

    if (
      !Number.isSafeInteger(pagina) ||
      !Number.isSafeInteger(limite) ||
      !Number.isSafeInteger(salto) ||
      limite > 100
    ) {
      return res.status(400).json({
        mensaje: 'Paginación inválida; el límite máximo es 100'
      });
    }

    const filtro = {};

    if (req.usuario.rol === 'PROFESIONAL') {
      filtro.profesional = req.usuario._id;
    }

    const [citas, total] = await Promise.all([
      Cita.find(filtro)
        .populate('paciente', 'nombres apellidos')
        .populate('servicio', 'nombre')
        .populate('profesional', 'nombre')
        .sort({ fechaInicio: 1, _id: 1 })
        .skip(salto)
        .limit(limite),

      Cita.countDocuments(filtro)
    ]);

    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      citas,
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite)
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

module.exports = {
  crearCita,
  obtenerCitas
};