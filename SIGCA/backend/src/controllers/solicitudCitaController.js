const mongoose = require('mongoose');
const SolicitudCita = require('../models/SolicitudCita');
const Servicio = require('../models/Servicio');
const Cita = require('../models/Cita');
const Paciente = require('../models/Paciente');

const manejarError = (res, error) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Error de validación en la solicitud',
      errores: Object.values(error.errors).map(e => e.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      mensaje: 'Identificador o formato de dato inválido'
    });
  }

  console.error('Error en solicitudes de citas:', error);

  return res.status(500).json({
    mensaje: 'Error interno del servidor al procesar la solicitud'
  });
};

// 1. Crear solicitud pública (para visitantes)
const crearSolicitud = async (req, res) => {
  try {
    const {
      nombre,
      correo,
      telefono,
      servicioId,
      fechaPreferida,
      horarioPreferido,
      motivo
    } = req.body;

    if (!nombre || !correo || !telefono || !servicioId || !fechaPreferida) {
      return res.status(400).json({
        mensaje: 'Todos los campos marcados con asterisco son obligatorios'
      });
    }

    if (!mongoose.isValidObjectId(servicioId)) {
      return res.status(400).json({
        mensaje: 'El servicio seleccionado es inválido'
      });
    }

    const servicio = await Servicio.findById(servicioId);
    if (!servicio || servicio.estado !== 'ACTIVO') {
      return res.status(404).json({
        mensaje: 'El servicio solicitado no está disponible'
      });
    }

    // Validar fecha preferida: no permitir fechas pasadas (RN-11)
    const fechaObj = new Date(fechaPreferida);
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({
        mensaje: 'La fecha preferida no tiene un formato válido'
      });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaObj < hoy) {
      return res.status(400).json({
        mensaje: 'La fecha preferida no puede ser anterior al día de hoy'
      });
    }

    const solicitud = await SolicitudCita.create({
      nombre,
      correo,
      telefono,
      servicioId,
      fechaPreferida: fechaObj,
      horarioPreferido: horarioPreferido || 'Cualquiera',
      motivo: motivo || '',
      estado: 'PENDIENTE'
    });

    return res.status(201).json({
      mensaje: 'Solicitud de cita recibida exitosamente',
      solicitud
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

// 2. Obtener solicitudes (Administradores / Recepcionistas)
const obtenerSolicitudes = async (req, res) => {
  try {
    const { estado, buscar } = req.query;
    const filtro = {};

    if (estado && ['PENDIENTE', 'CONTACTADO', 'CONVERTIDA', 'RECHAZADA'].includes(estado)) {
      filtro.estado = estado;
    }

    if (buscar) {
      const regex = new RegExp(String(buscar).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filtro.$or = [
        { nombre: regex },
        { correo: regex },
        { telefono: regex }
      ];
    }

    const solicitudes = await SolicitudCita.find(filtro)
      .populate('servicioId', 'nombre duracionMinutos precioCentavos')
      .populate('citaCreada')
      .sort({ createdAt: -1 });

    return res.status(200).json(solicitudes);
  } catch (error) {
    return manejarError(res, error);
  }
};

// 3. Obtener solicitud por ID
const obtenerSolicitudPorId = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de solicitud inválido' });
    }

    const solicitud = await SolicitudCita.findById(req.params.id)
      .populate('servicioId', 'nombre duracionMinutos precioCentavos')
      .populate('citaCreada');

    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    return res.status(200).json(solicitud);
  } catch (error) {
    return manejarError(res, error);
  }
};

// 4. Cambiar estado de solicitud (PENDIENTE -> CONTACTADO -> RECHAZADA)
const cambiarEstadoSolicitud = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de solicitud inválido' });
    }

    const { estado, observacionesAdmin } = req.body;
    const estadosValidos = ['PENDIENTE', 'CONTACTADO', 'CONVERTIDA', 'RECHAZADA'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        mensaje: `Estado inválido. Opciones permitidas: ${estadosValidos.join(', ')}`
      });
    }

    const actualizacion = { estado };
    if (observacionesAdmin !== undefined) {
      actualizacion.observacionesAdmin = observacionesAdmin;
    }

    const solicitud = await SolicitudCita.findByIdAndUpdate(
      req.params.id,
      { $set: actualizacion },
      { new: true, runValidators: true }
    ).populate('servicioId', 'nombre duracionMinutos precioCentavos');

    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    return res.status(200).json({
      mensaje: 'Estado de la solicitud actualizado correctamente',
      solicitud
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

// 5. Flujo Solicitud -> Cita: Convertir una solicitud aprobada en una cita formal
const convertirSolicitudACita = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ mensaje: 'ID de solicitud inválido' });
    }

    const solicitud = await SolicitudCita.findById(id).populate('servicioId');
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    if (solicitud.estado === 'CONVERTIDA') {
      return res.status(400).json({
        mensaje: 'Esta solicitud ya fue convertida previamente en una cita'
      });
    }

    const {
      pacienteId,
      crearPacienteNuevo,
      nuevoPaciente,
      profesionalId,
      fechaInicio,
      observaciones
    } = req.body;

    if (!profesionalId || !fechaInicio) {
      return res.status(400).json({
        mensaje: 'Debe proporcionar profesionalId y fechaInicio para agendar la cita'
      });
    }

    let paciente = null;

    // Opción A: Crear paciente automáticamente a partir del solicitante
    if (crearPacienteNuevo) {
      const { nombres, apellidos, fechaNacimiento, sexo, telefono, direccion } = nuevoPaciente || {};

      if (!nombres || !apellidos || !fechaNacimiento || !sexo || !telefono || !direccion) {
        return res.status(400).json({
          mensaje: 'Para registrar el expediente del nuevo paciente se requiere nombres, apellidos, fecha de nacimiento, sexo, teléfono y dirección'
        });
      }

      paciente = await Paciente.create({
        nombres: String(nombres).trim(),
        apellidos: String(apellidos).trim(),
        fechaNacimiento: new Date(fechaNacimiento),
        sexo,
        telefono: String(telefono).trim(),
        direccion: String(direccion).trim(),
        observaciones: `Expediente generado desde solicitud web. Contacto: ${solicitud.correo} / ${solicitud.telefono}`
      });
    } else {
      // Opción B: Vincular a un paciente existente
      if (!pacienteId) {
        return res.status(400).json({
          mensaje: 'Debe seleccionar un paciente registrado o activar la opción de crear paciente nuevo'
        });
      }

      paciente = await Paciente.findById(pacienteId);
      if (!paciente || paciente.estado !== 'ACTIVO') {
        return res.status(404).json({ mensaje: 'Paciente no encontrado o inactivo' });
      }
    }

    const servicio = solicitud.servicioId;
    if (!servicio || servicio.estado !== 'ACTIVO') {
      return res.status(400).json({ mensaje: 'El servicio asociado no está disponible' });
    }

    const inicio = new Date(fechaInicio);
    if (isNaN(inicio.getTime())) {
      return res.status(400).json({ mensaje: 'Fecha de inicio inválida' });
    }

    // Normalizar a minutos sin segundos/ms
    inicio.setSeconds(0, 0);

    const duracionMs = servicio.duracionMinutos * 60 * 1000;
    const fin = new Date(inicio.getTime() + duracionMs);

    // Inicializar índices de Cita para verificar colisiones
    await Cita.init();

    const nuevaCita = await Cita.create({
      paciente: paciente._id,
      servicio: servicio._id,
      profesional: profesionalId,
      fechaInicio: inicio,
      fechaFin: fin,
      duracionMinutos: servicio.duracionMinutos,
      precioCentavos: servicio.precioCentavos,
      estado: 'PENDIENTE',
      observaciones: observaciones || `Generada a partir de solicitud web de ${solicitud.nombre}. Motivo original: ${solicitud.motivo || 'N/A'}`,
      creadoPor: req.usuario._id,
      actualizadoPor: req.usuario._id
    });

    // Actualizar solicitud
    solicitud.estado = 'CONVERTIDA';
    solicitud.citaCreada = nuevaCita._id;
    solicitud.observacionesAdmin = (solicitud.observacionesAdmin ? solicitud.observacionesAdmin + ' | ' : '') + `Convertida a cita con paciente ${paciente.nombres} ${paciente.apellidos} el ${new Date().toLocaleDateString()}`;
    await solicitud.save();

    return res.status(201).json({
      mensaje: 'Solicitud convertida a cita exitosamente',
      cita: nuevaCita,
      paciente,
      solicitud
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        mensaje: 'El profesional ya tiene una cita programada en ese horario'
      });
    }
    return manejarError(res, error);
  }
};

module.exports = {
  crearSolicitud,
  obtenerSolicitudes,
  obtenerSolicitudPorId,
  cambiarEstadoSolicitud,
  convertirSolicitudACita
};
