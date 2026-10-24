const mongoose = require('mongoose');

const cajaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario responsable es obligatorio']
  },

  fechaApertura: {
    type: Date,
    required: true,
    default: Date.now
  },

  montoInicialCentavos: {
    type: Number,
    required: [true, 'El monto inicial es obligatorio'],
    min: [0, 'El monto inicial no puede ser negativo'],
    validate: {
      validator: Number.isSafeInteger,
      message: 'El monto inicial debe expresarse en centavos enteros'
    }
  },

  estado: {
    type: String,
    enum: ['ABIERTA', 'CERRADA'],
    default: 'ABIERTA',
    required: true
  },

  fechaCierre: {
    type: Date,
    default: null
  },

  montoContadoCentavos: {
    type: Number,
    default: null,
    min: [0, 'El monto contado no puede ser negativo'],
    validate: {
      validator: valor => valor === null || Number.isSafeInteger(valor),
      message: 'El monto contado debe expresarse en centavos enteros'
    }
  },

  diferenciaCentavos: {
    type: Number,
    default: null,
    validate: {
      validator: valor => valor === null || Number.isSafeInteger(valor),
      message: 'La diferencia debe expresarse en centavos enteros'
    }
  },

  cerradaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  }
}, {
  timestamps: true,
  collection: 'cajas',
  optimisticConcurrency: true
});

// Un usuario solo puede tener una caja abierta a la vez.
cajaSchema.index(
  { usuario: 1 },
  {
    unique: true,
    name: 'una_caja_abierta_por_usuario',
    partialFilterExpression: { estado: 'ABIERTA' }
  }
);

cajaSchema.index({ fechaApertura: -1 });

module.exports = mongoose.model('Caja', cajaSchema);