const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema({
  cita: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita',
    required: [true, 'La cita es obligatoria']
  },

  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: [true, 'El paciente es obligatorio']
  },

  caja: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caja',
    required: [true, 'La caja es obligatoria']
  },

  registradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario que registra el pago es obligatorio']
  },

  montoCentavos: {
    type: Number,
    required: [true, 'El monto del pago es obligatorio'],
    min: [1, 'El pago debe ser mayor que cero'],
    validate: {
      validator: Number.isSafeInteger,
      message: 'El monto debe expresarse en centavos enteros'
    }
  },

  metodo: {
    type: String,
    enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'],
    required: [true, 'El método de pago es obligatorio']
  },

  numeroRecibo: {
    type: String,
    required: [true, 'El número de recibo es obligatorio'],
    unique: true,
    trim: true
  },

  estado: {
    type: String,
    enum: ['REGISTRADO', 'ANULADO'],
    default: 'REGISTRADO',
    required: true
  },

  anuladoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },

  fechaAnulacion: {
    type: Date,
    default: null
  },

  motivoAnulacion: {
    type: String,
    trim: true,
    maxlength: [500, 'El motivo no puede superar 500 caracteres'],
    default: ''
  }
}, {
  timestamps: true,
  collection: 'pagos'
});

pagoSchema.index({ cita: 1, estado: 1 });
pagoSchema.index({ caja: 1, estado: 1, metodo: 1 });

module.exports = mongoose.model('Pago', pagoSchema);