
const mongoose = require('mongoose');

const servicioSchema = new mongoose.Schema({

  nombre: {
    type: String,
    required: [true, 'El nombre del servicio es obligatorio'],
    trim: true
  },

  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true
  },

  duracionMinutos: {
    type: Number,
    required: [true, 'La duración es obligatoria'],
    min: [1, 'La duración debe ser mayor a cero'],
    validate: {
      validator: Number.isInteger,
      message: 'La duración debe ser un número entero'
    }
  },

  precioCentavos: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo'],
    validate: {
      validator: Number.isSafeInteger,
      message: 'El precio debe expresarse en centavos enteros'
    }
  },

  imagen: {
    type: String,
    default: '',
    trim: true
  },

  estado: {
    type: String,
    enum: ['ACTIVO', 'INACTIVO'],
    default: 'ACTIVO'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Mostrar el precio en quetzales
servicioSchema.virtual('precio').get(function() {
  return this.precioCentavos / 100;
});

module.exports = mongoose.model('Servicio', servicioSchema);