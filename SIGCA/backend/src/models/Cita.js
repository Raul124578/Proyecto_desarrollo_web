const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: [true, 'El paciente es obligatorio']
  },

  servicio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: [true, 'El servicio es obligatorio']
  },

  profesional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El profesional es obligatorio']
  },

  fechaInicio: {
    type: Date,
    required: [true, 'La fecha de inicio es obligatoria']
  },

  fechaFin: {
    type: Date,
    required: [true, 'La fecha de finalización es obligatoria']
  },

  duracionMinutos: {
    type: Number,
    required: true,
    min: [1, 'La duración debe ser mayor a cero'],
    max: [1440, 'La duración no puede superar un día'],
    validate: {
      validator: Number.isSafeInteger,
      message: 'La duración debe ser un número entero seguro'
    }
  },

  precioCentavos: {
    type: Number,
    required: true,
    min: [0, 'El precio no puede ser negativo'],
    validate: {
      validator: Number.isSafeInteger,
      message: 'El precio debe expresarse en centavos enteros'
    }
  },

  estado: {
    type: String,
    required: true,
    enum: [
      'PENDIENTE',
      'CONFIRMADA',
      'COMPLETADA',
      'CANCELADA'
    ],
    default: 'PENDIENTE'
  },

  observaciones: {
    type: String,
    trim: true,
    maxlength: [2000, 'Las observaciones no pueden superar 2000 caracteres'],
    default: ''
  },

  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  // Campos internos: se calculan automáticamente.
  ocupaAgenda: {
    type: Boolean,
    default: false,
    select: false
  },

  bloquesMinuto: {
    type: [Number],
    default: [],
    select: false
  }
}, {
  timestamps: true,
  collection: 'citas',
  optimisticConcurrency: true,

  toJSON: {
    transform: function (documento, resultado) {
      delete resultado.ocupaAgenda;
      delete resultado.bloquesMinuto;
      delete resultado.__v;
      return resultado;
    }
  }
});

// Validar fechas y calcular los minutos reservados.
citaSchema.pre('validate', function () {
  this.ocupaAgenda = [
    'PENDIENTE',
    'CONFIRMADA'
  ].includes(this.estado);

  this.bloquesMinuto = [];

  const inicioValido =
    this.fechaInicio instanceof Date &&
    Number.isFinite(this.fechaInicio.getTime());

  const finValido =
    this.fechaFin instanceof Date &&
    Number.isFinite(this.fechaFin.getTime());

  const duracionValida =
    Number.isSafeInteger(this.duracionMinutos) &&
    this.duracionMinutos >= 1 &&
    this.duracionMinutos <= 1440;

  if (!inicioValido || !finValido || !duracionValida) {
    return;
  }

  const inicio = this.fechaInicio.getTime();
  const fin = this.fechaFin.getTime();

  // Trabajar con minutos completos.
  if (inicio % 60000 !== 0) {
    this.invalidate(
      'fechaInicio',
      'La hora de inicio debe tener segundos y milisegundos en cero'
    );
    return;
  }

  const finEsperado = inicio + this.duracionMinutos * 60000;

  if (fin !== finEsperado) {
    this.invalidate(
      'fechaFin',
      'La fecha de finalización debe coincidir con la duración de la cita'
    );
    return;
  }

  if (this.ocupaAgenda) {
    const primerMinuto = inicio / 60000;

    this.bloquesMinuto = Array.from(
      { length: this.duracionMinutos },
      (_, posicion) => primerMinuto + posicion
    );
  }
});

// Impedir que dos citas activas ocupen un mismo minuto
// para el mismo profesional.
citaSchema.index(
  {
    profesional: 1,
    bloquesMinuto: 1
  },
  {
    name: 'profesional_minuto_unico',
    unique: true,
    partialFilterExpression: {
      ocupaAgenda: true
    }
  }
);

// Facilitar las consultas del calendario.
citaSchema.index({
  profesional: 1,
  estado: 1,
  fechaInicio: 1,
  fechaFin: 1
});

citaSchema.index({
  paciente: 1,
  fechaInicio: -1
});

module.exports = mongoose.model('Cita', citaSchema);