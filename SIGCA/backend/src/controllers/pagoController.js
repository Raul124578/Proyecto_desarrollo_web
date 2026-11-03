const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const Caja = require('../models/Caja');
const Cita = require('../models/Cita');
const Pago = require('../models/Pago');

const manejarError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({
      mensaje: 'El recibo ya existe o hubo un cambio simultáneo. Intente de nuevo.'
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Datos de pago inválidos',
      errores: Object.values(error.errors).map(e => e.message)
    });
  }

  if (error.name === 'VersionError' || error.code === 112) {
    return res.status(409).json({
      mensaje: 'Los datos cambiaron durante la operación. Vuelva a intentarlo.'
    });
  }

  console.error('Error en pagos:', error.message);

  return res.status(500).json({
    mensaje: 'Error interno al gestionar el pago'
  });
};

const registrarPago = async (req, res) => {
  const { citaId, montoCentavos, metodo } = req.body || {};

  if (!mongoose.isValidObjectId(citaId)) {
    return res.status(400).json({ mensaje: 'Debe proporcionar un ID de cita válido' });
  }

  if (!Number.isSafeInteger(montoCentavos) || montoCentavos <= 0) {
    return res.status(400).json({
      mensaje: 'El monto debe ser un número entero de centavos mayor a cero'
    });
  }

  if (!['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'].includes(metodo)) {
    return res.status(400).json({ mensaje: 'Método de pago inválido' });
  }

  const ejecutarRegistro = async (s) => {
    const qCaja = Caja.findOne({
      usuario: req.usuario._id,
      estado: 'ABIERTA'
    });
    if (s) qCaja.session(s);
    const caja = await qCaja;

    if (!caja) {
      const error = new Error('Debe abrir una caja antes de registrar pagos');
      error.status = 409;
      throw error;
    }

    const qCita = Cita.findById(citaId);
    if (s) qCita.session(s);
    const cita = await qCita;

    if (!cita) {
      const error = new Error('Cita no encontrada');
      error.status = 404;
      throw error;
    }

    if (cita.estado === 'CANCELADA') {
      const error = new Error('No se pueden registrar pagos para citas canceladas');
      error.status = 409;
      throw error;
    }

    caja.increment();
    if (s) {
      await caja.save({ session: s });
    } else {
      await caja.save();
    }

    const aggQuery = [
      {
        $match: {
          cita: cita._id,
          estado: 'REGISTRADO'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$montoCentavos' }
        }
      }
    ];

    const pagosPrevios = s ? await Pago.aggregate(aggQuery).session(s) : await Pago.aggregate(aggQuery);

    const totalPagado = pagosPrevios[0]?.total || 0;
    const saldo = cita.precioCentavos - totalPagado;

    if (montoCentavos > saldo) {
      const error = new Error(
        `El pago supera el saldo pendiente de ${Math.max(saldo, 0)} centavos`
      );
      error.status = 400;
      throw error;
    }

    const recibo = `SIGCA-${randomUUID()}`;

    const nuevoPagoData = {
      cita: cita._id,
      paciente: cita.paciente,
      caja: caja._id,
      registradoPor: req.usuario._id,
      montoCentavos,
      metodo,
      numeroRecibo: recibo,
      estado: 'REGISTRADO'
    };

    let pago;
    if (s) {
      const [creado] = await Pago.create([nuevoPagoData], { session: s });
      pago = creado;
    } else {
      pago = await Pago.create(nuevoPagoData);
    }

    return pago;
  };

  const sesion = await mongoose.startSession();

  try {
    let pagoRegistrado;

    try {
      await sesion.withTransaction(async () => {
        pagoRegistrado = await ejecutarRegistro(sesion);
      });
    } catch (txError) {
      if (txError.message && (txError.message.includes('replica set') || txError.message.includes('Transaction numbers'))) {
        pagoRegistrado = await ejecutarRegistro(null);
      } else {
        throw txError;
      }
    }

    return res.status(201).json({
      mensaje: 'Pago registrado correctamente',
      pago: pagoRegistrado
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

const obtenerPagos = async (req, res) => {
  try {
    const filtro = {};

    if (req.usuario.rol !== 'ADMINISTRADOR') {
      const cajas = await Caja.find({ usuario: req.usuario._id }).select('_id');
      filtro.caja = { $in: cajas.map(caja => caja._id) };
    }

    const pagos = await Pago.find(filtro)
      .populate('cita', 'fechaInicio fechaFin estado precioCentavos')
      .populate('paciente', 'nombres apellidos')
      .populate('caja', 'estado fechaApertura')
      .populate('registradoPor', 'nombre correo')
      .populate('anuladoPor', 'nombre correo')
      .sort({ createdAt: -1 });

    res.set('Cache-Control', 'no-store');
    return res.status(200).json(pagos);
  } catch (error) {
    return manejarError(res, error);
  }
};

const anularPago = async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body || {};

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ mensaje: 'Identificador de pago inválido' });
  }

  if (typeof motivo !== 'string' || !motivo.trim() || motivo.trim().length > 500) {
    return res.status(400).json({
      mensaje: 'Indique un motivo de anulación de hasta 500 caracteres'
    });
  }

  const ejecutarAnulacion = async (s) => {
    const qPago = Pago.findById(id);
    if (s) qPago.session(s);
    const pago = await qPago;

    if (!pago) {
      const error = new Error('Pago no encontrado');
      error.status = 404;
      throw error;
    }

    if (pago.estado !== 'REGISTRADO') {
      const error = new Error('El pago ya está anulado');
      error.status = 409;
      throw error;
    }

    const qCaja = Caja.findOne({
      _id: pago.caja,
      estado: 'ABIERTA'
    });
    if (s) qCaja.session(s);
    const caja = await qCaja;

    if (!caja) {
      const error = new Error('Solo se pueden anular pagos de una caja abierta');
      error.status = 409;
      throw error;
    }

    if (
      req.usuario.rol !== 'ADMINISTRADOR' &&
      !caja.usuario.equals(req.usuario._id)
    ) {
      const error = new Error('No tiene permiso para anular este pago');
      error.status = 403;
      throw error;
    }

    caja.increment();
    if (s) {
      await caja.save({ session: s });
    } else {
      await caja.save();
    }

    pago.estado = 'ANULADO';
    pago.anuladoPor = req.usuario._id;
    pago.fechaAnulacion = new Date();
    pago.motivoAnulacion = motivo.trim();

    if (s) {
      await pago.save({ session: s });
    } else {
      await pago.save();
    }

    return pago;
  };

  const sesion = await mongoose.startSession();

  try {
    let pagoAnulado;

    try {
      await sesion.withTransaction(async () => {
        pagoAnulado = await ejecutarAnulacion(sesion);
      });
    } catch (txError) {
      if (txError.message && (txError.message.includes('replica set') || txError.message.includes('Transaction numbers'))) {
        pagoAnulado = await ejecutarAnulacion(null);
      } else {
        throw txError;
      }
    }

    return res.status(200).json({
      mensaje: 'Pago anulado correctamente',
      pago: pagoAnulado
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
  registrarPago,
  obtenerPagos,
  anularPago
};
