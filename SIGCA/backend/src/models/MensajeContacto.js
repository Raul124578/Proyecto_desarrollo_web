const mongoose = require('mongoose');

const mensajeContactoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [120, 'El nombre no puede superar 120 caracteres']
  },

  correo: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    trim: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'El correo electrónico no tiene un formato válido'
    ]
  },

  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true,
    match: [/^[0-9]{8}$/, 'El teléfono debe contener exactamente 8 dígitos numéricos']
  },

  asunto: {
    type: String,
    required: [true, 'El asunto es obligatorio'],
    trim: true,
    maxlength: [150, 'El asunto no puede superar 150 caracteres']
  },

  mensaje: {
    type: String,
    required: [true, 'El mensaje es obligatorio'],
    trim: true,
    maxlength: [3000, 'El mensaje no puede superar 3000 caracteres']
  },

  estado: {
    type: String,
    enum: ['NUEVO', 'LEIDO', 'RESPONDIDO'],
    default: 'NUEVO'
  },

  atendidoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },

  respuesta: {
    type: String,
    trim: true,
    default: ''
  },

  fechaRespuesta: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'mensajesContacto'
});

mensajeContactoSchema.index({ estado: 1, createdAt: -1 });

module.exports = mongoose.model('MensajeContacto', mensajeContactoSchema);

