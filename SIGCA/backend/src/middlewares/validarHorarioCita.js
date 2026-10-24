const Horario = require('../models/Horario');

const formatoGuatemala = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Guatemala',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

const obtenerFechaLocal = fecha => {
  const partes = Object.fromEntries(
    formatoGuatemala.formatToParts(fecha)
      .filter(parte => parte.type !== 'literal')
      .map(parte => [parte.type, parte.value])
  );

  return {
    clave: `${partes.year}-${partes.month}-${partes.day}`,
    diaSemana: new Date(
      Date.UTC(
        Number(partes.year),
        Number(partes.month) - 1,
        Number(partes.day)
      )
    ).getUTCDay(),
    minuto: Number(partes.hour) * 60 + Number(partes.minute)
  };
};

const validarHorarioCita = async (req, res, next) => {
  try {
    const { fechaInicio } = req.body || {};

    // Recibir UTC: por ejemplo, 2026-10-26T14:00:00.000Z.
    const patronUTC =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00(?:\.000)?Z$/;

    if (
      typeof fechaInicio !== 'string' ||
      !patronUTC.test(fechaInicio)
    ) {
      return res.status(400).json({
        mensaje: 'Envíe fechaInicio en UTC, con segundos en cero y terminación Z'
      });
    }

    const inicio = new Date(fechaInicio);
    const normalizada = fechaInicio.includes('.')
      ? fechaInicio
      : fechaInicio.replace('Z', '.000Z');

    if (
      !Number.isFinite(inicio.getTime()) ||
      inicio.toISOString() !== normalizada
    ) {
      return res.status(400).json({
        mensaje: 'La fecha de inicio no es válida'
      });
    }

    if (inicio.getTime() <= Date.now()) {
      return res.status(400).json({
        mensaje: 'La cita debe programarse para una fecha futura'
      });
    }

    const duracion = req.servicioValidado?.duracionMinutos;

    if (!Number.isSafeInteger(duracion) || duracion <= 0) {
      return res.status(500).json({
        mensaje: 'Debe validar el servicio antes de validar el horario'
      });
    }

    const fin = new Date(inicio.getTime() + duracion * 60000);

    if (!Number.isFinite(fin.getTime())) {
      return res.status(400).json({
        mensaje: 'La duración produce una fecha de finalización inválida'
      });
    }

    const inicioLocal = obtenerFechaLocal(inicio);
    const ultimoInstanteLocal = obtenerFechaLocal(
      new Date(fin.getTime() - 1)
    );

    const horario = await Horario.findOne({
      diaSemana: inicioLocal.diaSemana,
      activo: true
    });

    const dentroDelHorario =
      inicioLocal.clave === ultimoInstanteLocal.clave &&
      horario &&
      horario.tramos.some(tramo =>
        inicioLocal.minuto >= tramo.inicioMinuto &&
        inicioLocal.minuto + duracion <= tramo.finMinuto
      );

    if (!dentroDelHorario) {
      return res.status(400).json({
        mensaje: 'La cita completa debe estar dentro del horario de atención'
      });
    }

    req.fechasCita = {
      fechaInicio: inicio,
      fechaFin: fin
    };
  } catch (error) {
    console.error('Error al validar horario:', error.message);

    return res.status(500).json({
      mensaje: 'Error al validar el horario de la cita'
    });
  }

  return next();
};

module.exports = validarHorarioCita;