const mongoose = require('mongoose');

const tramoSchema = new mongoose.Schema({
  inicioMinuto: {
    type: Number,
    required: true,
    min: 0,
    max: 1439,
    validate: {
      validator: Number.isInteger,
      message: 'El inicio debe expresarse en minutos enteros'
    }
  },

  finMinuto: {
    type: Number,
    required: true,
    min: 1,
    max: 1440,
    validate: {
      validator: Number.isInteger,
      message: 'El final debe expresarse en minutos enteros'
    }
  }
}, {
  _id: false
});

const horarioSchema = new mongoose.Schema({
  // 0: domingo, 1: lunes, ..., 6: sábado.
  diaSemana: {
    type: Number,
    required: true,
    unique: true,
    min: 0,
    max: 6,
    validate: {
      validator: Number.isInteger,
      message: 'El día de la semana debe ser un número entero'
    }
  },

  activo: {
    type: Boolean,
    default: false
  },

  tramos: {
    type: [tramoSchema],
    default: []
  }
}, {
  timestamps: true,
  collection: 'horarios',
  optimisticConcurrency: true
});

horarioSchema.pre('validate', function () {
  if (this.activo && this.tramos.length === 0) {
    this.invalidate(
      'tramos',
      'Un día activo debe tener al menos un tramo de atención'
    );
  }

  const ordenados = [...this.tramos].sort(
    (a, b) => a.inicioMinuto - b.inicioMinuto
  );

  for (let i = 0; i < ordenados.length; i++) {
    const tramo = ordenados[i];

    if (tramo.finMinuto <= tramo.inicioMinuto) {
      this.invalidate(
        'tramos',
        'Cada tramo debe terminar después de su inicio'
      );
    }

    if (
      i > 0 &&
      tramo.inicioMinuto < ordenados[i - 1].finMinuto
    ) {
      this.invalidate(
        'tramos',
        'Los tramos de atención no pueden superponerse'
      );
    }
  }
});

module.exports = mongoose.model('Horario', horarioSchema);