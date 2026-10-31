const mongoose = require('mongoose');
const Cita = require('../models/Cita');
const Pago = require('../models/Pago');

const cambiarEstadoCita = async (req, res) => {
  let sesion;

  try {
    if (!req.usuario) {
      return res.status(401).json({
        mensaje: 'Debe iniciar sesión'
      });
    }

    const { id } = req.params;
    const datos = req.body || {};
    const { estado } = datos;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        mensaje: 'Identificador de cita inválido'
      });
    }

    if (
      Object.keys(datos).length !== 1 ||
      typeof estado !== 'string' ||
      !['CONFIRMADA', 'COMPLETADA', 'CANCELADA'].includes(estado)
    ) {
      return res.status(400).json({
        mensaje: 'Envíe únicamente estado: CONFIRMADA, COMPLETADA o CANCELADA'
      });
    }

    const permisos = {
      ADMINISTRADOR: ['CONFIRMADA', 'COMPLETADA', 'CANCELADA'],
      RECEPCIONISTA: ['CONFIRMADA', 'CANCELADA'],
      PROFESIONAL: ['COMPLETADA']
    };

    if (!permisos[req.usuario.rol]?.includes(estado)) {
      return res.status(403).json({
        mensaje: 'No tiene permiso para realizar este cambio'
      });
    }

    sesion = await mongoose.startSession();

    let citaActualizada;

    await sesion.withTransaction(async () => {
      const filtro = { _id: id };

      // El profesional solo puede completar sus propias citas.
      if (req.usuario.rol === 'PROFESIONAL') {
        filtro.profesional = req.usuario._id;
      }

      const cita = await Cita.findOne(filtro).session(sesion);

      if (!cita) {
        const error = new Error('Cita no encontrada');
        error.status = 404;
        throw error;
      }

      const transiciones = {
        PENDIENTE: ['CONFIRMADA', 'CANCELADA'],
        CONFIRMADA: ['COMPLETADA', 'CANCELADA'],
        COMPLETADA: [],
        CANCELADA: []
      };

      if (!transiciones[cita.estado]?.includes(estado)) {
        const error = new Error(
          `No se puede cambiar una cita de ${cita.estado} a ${estado}`
        );
        error.status = 409;
        throw error;
      }

      if (estado === 'CANCELADA') {
        const pagoRegistrado = await Pago.exists({
          cita: cita._id,
          estado: 'REGISTRADO'
        }).session(sesion);

        if (pagoRegistrado) {
          const error = new Error(
            'Primero debe anular los pagos registrados antes de cancelar la cita'
          );
          error.status = 409;
          throw error;
        }
      }

      cita.estado = estado;
      cita.actualizadoPor = req.usuario._id;

      // Actualiza el estado y libera o reserva el horario dentro de la transacción.
      await cita.save({ session: sesion });
      citaActualizada = cita;
    });

    return res.status(200).json({
      mensaje: 'Estado de la cita actualizado correctamente',
      cita: citaActualizada
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        mensaje: error.message
      });
    }

    if (error.name === 'VersionError' || error.code === 112) {
      return res.status(409).json({
        mensaje: 'La cita cambió durante la operación; vuelva a consultarla'
      });
    }

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

    console.error('Error al cambiar estado de cita:', error.message);

    return res.status(500).json({
      mensaje: 'Error interno al actualizar la cita'
    });
  } finally {
    if (sesion) {
      await sesion.endSession();
    }
  }
};

module.exports = {
  cambiarEstadoCita
};