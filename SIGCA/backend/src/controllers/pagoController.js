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

  const sesion = await mongoose.startSession();

  try {
    let pagoRegistrado;

    await sesion.withTransaction(async () => {
      const caja = await Caja.findOne({
        usuario: req.usuario._id,
        estado: 'ABIERTA'
      }).session(sesion);

      if (!caja) {
        const error = new Error('Debe abrir una caja antes de registrar pagos');
        error.status = 409;
        throw error;
      }

      const cita = await Cita.findById(citaId).session(sesion);

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

      // Serializar movimientos de caja y evitar sobrepagos simultáneos.
      caja.increment();
      await caja.save({ session: sesion });

      const pagosPrevios = await Pago.aggregate([
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
      ]).session(sesion);

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

      const [pago] = await Pago.create([{
        cita: cita._id,
        paciente: cita.paciente,
        caja: caja._id,
        registradoPor: req.usuario._id,
        montoCentavos,
        metodo,
        numeroRecibo: recibo,
        estado: 'REGISTRADO'
      }], { session: sesion });

      pagoRegistrado = pago;
    });

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

  const sesion = await mongoose.startSession();

  try {
    let pagoAnulado;

    await sesion.withTransaction(async () => {
      const pago = await Pago.findById(id).session(sesion);

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

      const caja = await Caja.findOne({
        _id: pago.caja,
        estado: 'ABIERTA'
      }).session(sesion);

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
      await caja.save({ session: sesion });

      pago.estado = 'ANULADO';
      pago.anuladoPor = req.usuario._id;
      pago.fechaAnulacion = new Date();
      pago.motivoAnulacion = motivo.trim();

      await pago.save({ session: sesion });
      pagoAnulado = pago;
    });

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