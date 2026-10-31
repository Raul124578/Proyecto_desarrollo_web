const mongoose = require('mongoose');
const Caja = require('../models/Caja');
const Pago = require('../models/Pago');

const manejarError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({
      mensaje: 'Este usuario ya tiene una caja abierta'
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Datos de caja inválidos',
      errores: Object.values(error.errors).map(e => e.message)
    });
  }

  if (error.name === 'VersionError') {
    return res.status(409).json({
      mensaje: 'La caja cambió mientras se procesaba. Vuelva a consultar.'
    });
  }

  console.error('Error en caja:', error.message);

  return res.status(500).json({
    mensaje: 'Error interno al gestionar la caja'
  });
};

const abrirCaja = async (req, res) => {
  try {
    const { montoInicialCentavos } = req.body || {};

    if (!Number.isSafeInteger(montoInicialCentavos) || montoInicialCentavos < 0) {
      return res.status(400).json({
        mensaje: 'El monto inicial debe ser un número entero de centavos igual o mayor a cero'
      });
    }

    const [caja] = await Caja.create([{
      usuario: req.usuario._id,
      montoInicialCentavos,
      estado: 'ABIERTA'
    }]);

    return res.status(201).json({
      mensaje: 'Caja abierta correctamente',
      caja
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

const obtenerCajas = async (req, res) => {
  try {
    const filtro = {};

    if (req.usuario.rol !== 'ADMINISTRADOR') {
      filtro.usuario = req.usuario._id;
    }

    const cajas = await Caja.find(filtro)
      .populate('usuario', 'nombre correo rol')
      .populate('cerradaPor', 'nombre correo')
      .sort({ fechaApertura: -1 });

    res.set('Cache-Control', 'no-store');
    return res.status(200).json(cajas);
  } catch (error) {
    return manejarError(res, error);
  }
};

const cerrarCaja = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      mensaje: 'Identificador de caja inválido'
    });
  }

  const { montoContadoCentavos } = req.body || {};

  if (!Number.isSafeInteger(montoContadoCentavos) || montoContadoCentavos < 0) {
    return res.status(400).json({
      mensaje: 'El monto contado debe ser un número entero de centavos igual o mayor a cero'
    });
  }

  const sesion = await mongoose.startSession();

  try {
    let cajaCerrada;

    await sesion.withTransaction(async () => {
      const filtro = { _id: id, estado: 'ABIERTA' };

      if (req.usuario.rol !== 'ADMINISTRADOR') {
        filtro.usuario = req.usuario._id;
      }

      const caja = await Caja.findOne(filtro).session(sesion);

      if (!caja) {
        const existe = await Caja.exists({ _id: id }).session(sesion);

        if (!existe) {
          const error = new Error('Caja no encontrada');
          error.status = 404;
          throw error;
        }

        const error = new Error('La caja ya está cerrada o no pertenece a este usuario');
        error.status = 409;
        throw error;
      }

      const resultado = await Pago.aggregate([
        {
          $match: {
            caja: caja._id,
            estado: 'REGISTRADO',
            metodo: 'EFECTIVO'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$montoCentavos' }
          }
        }
      ]).session(sesion);

      const totalEfectivo = resultado[0]?.total || 0;
      const esperado = caja.montoInicialCentavos + totalEfectivo;

      caja.estado = 'CERRADA';
      caja.fechaCierre = new Date();
      caja.montoContadoCentavos = montoContadoCentavos;
      caja.diferenciaCentavos = montoContadoCentavos - esperado;
      caja.cerradaPor = req.usuario._id;

      await caja.save({ session: sesion });
      cajaCerrada = caja;
    });

    return res.status(200).json({
      mensaje: 'Caja cerrada correctamente',
      caja: cajaCerrada
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ mensaje: error.message });
    }

    return manejarError(res, error);
  } finally {
    await sesion.endSession();
  }
};

module.exports = {
  abrirCaja,
  obtenerCajas,
  cerrarCaja
};