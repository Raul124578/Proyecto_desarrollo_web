
const mongoose = require('mongoose');

const pacienteSchema = new mongoose.Schema({
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

  fechaNacimiento: {
    type: Date,
    required: [true, 'La fecha de nacimiento es obligatoria'],
    validate: {
      validator: function(fecha) {
        return fecha <= new Date();
      },
      message: 'La fecha de nacimiento no puede ser futura'
    }
  },

  sexo: {
    type: String,
    required: true,
    enum: ['MASCULINO', 'FEMENINO', 'OTRO']
  },

  telefono: {
    type: String,
    required: true,
    trim: true
  },

  direccion: {
    type: String,
    required: true,
    trim: true
  },

  fechaInicioProceso: {
    type: Date,
    required: true,
    default: Date.now
  },

  observaciones: {
    type: String,
    default: ''
  },

  estado: {
    type: String,
    enum: ['ACTIVO', 'INACTIVO'],
    default: 'ACTIVO'
  },

  responsables: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Responsable'
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calcular automáticamente la edad
pacienteSchema.virtual('edad').get(function() {
  if (!this.fechaNacimiento) return null;

  const hoy = new Date();
  const nacimiento = new Date(this.fechaNacimiento);

  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();

  if (
    diferenciaMes < 0 ||
    (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())
  ) {
    edad--;
  }

  return edad;
});

module.exports = mongoose.model('Paciente', pacienteSchema);
