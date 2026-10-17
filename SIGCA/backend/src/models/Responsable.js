
const mongoose = require('mongoose');

const responsableSchema = new mongoose.Schema({

  fotografia: {
    type: String,
    default: ''
  },

  nombres: {
    type: String,
    required: [true, 'Los nombres son obligatorios'],
    trim: true
  },

  apellidos: {
    type: String,
    required: [true, 'Los apellidos son obligatorios'],
    trim: true
  },

  parentesco: {
    type: String,
    required: [true, 'El parentesco es obligatorio'],
    trim: true
  },

  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },

  correo: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Ingrese un correo electrónico válido'
    ]
  },

  direccion: {
    type: String,
    required: [true, 'La dirección es obligatoria'],
    trim: true
  },

  pacientes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente'
  }]

}, {
  timestamps: true
});

module.exports = mongoose.model('Responsable', responsableSchema);
