const Horario = require('../models/Horario');

const manejarError = (res, error) => {
  if (error.code === 11000 || error.name === 'VersionError') {
    return res.status(409).json({
      mensaje: 'El horario cambió durante la operación; vuelva a intentarlo'
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Horario inválido',
      errores: Object.values(error.errors).map(e => e.message)
    });
  }

  console.error('Error en horarios:', error.message);

  return res.status(500).json({
    mensaje: 'Error interno al gestionar horarios'
  });
};

// Consultar los días configurados.
const obtenerHorarios = async (req, res) => {
  try {
    const horarios = await Horario.find()
      .select('diaSemana activo tramos')
      .sort({ diaSemana: 1 });

    return res.status(200).json(horarios);
  } catch (error) {
    return manejarError(res, error);
  }
};

// Configurar un día de atención.
const guardarHorario = async (req, res) => {
  try {
    const { diaSemana } = req.params;

    if (!/^[0-6]$/.test(diaSemana)) {
      return res.status(400).json({
        mensaje: 'El día debe ser un número de 0 (domingo) a 6 (sábado)'
      });
    }

    const datos = req.body || {};
    const campos = Object.keys(datos);

    if (
      campos.length !== 2 ||
      campos.some(campo => !['activo', 'tramos'].includes(campo)) ||
      typeof datos.activo !== 'boolean' ||
      !Array.isArray(datos.tramos)
    ) {
      return res.status(400).json({
        mensaje: 'Debe enviar activo como booleano y tramos como arreglo'
      });
    }

    if (datos.tramos.length > 24) {
      return res.status(400).json({
        mensaje: 'No se permiten más de 24 tramos por día'
      });
    }

    const tramosValidos = datos.tramos.every(tramo =>
      tramo !== null &&
      typeof tramo === 'object' &&
      !Array.isArray(tramo) &&
      Object.keys(tramo).length === 2 &&
      Object.keys(tramo).every(campo =>
        ['inicioMinuto', 'finMinuto'].includes(campo)
      ) &&
      Number.isInteger(tramo.inicioMinuto) &&
      Number.isInteger(tramo.finMinuto)
    );

    if (!tramosValidos) {
      return res.status(400).json({
        mensaje: 'Cada tramo debe contener inicioMinuto y finMinuto como enteros'
      });
    }

    const dia = Number(diaSemana);
    let horario = await Horario.findOne({ diaSemana: dia });

    if (!horario) {
      horario = new Horario({ diaSemana: dia });
    }

    horario.activo = datos.activo;
    horario.tramos = datos.tramos;

    await horario.save();

    return res.status(200).json({
      mensaje: 'Horario guardado correctamente',
      horario
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

module.exports = {
  obtenerHorarios,
  guardarHorario
};