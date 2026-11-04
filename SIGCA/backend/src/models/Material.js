const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del material es obligatorio'],
    trim: true,
    maxlength: [150, 'El nombre no puede exceder los 150 caracteres']
  },

  descripcion: {
    type: String,
    required: [true, 'La descripción del material es obligatoria'],
    trim: true,
    maxlength: [2000, 'La descripción no puede superar 2000 caracteres']
  },

  cantidad: {
    type: Number,
    required: [true, 'La cantidad es obligatoria'],
    min: [0, 'La cantidad no puede ser negativa'],
    validate: {
      validator: Number.isInteger,
      message: 'La cantidad debe ser un número entero'
    }
  },

  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    enum: {
      values: [
        'Fonoaudiología',
        'Terapia Ocupacional',
        'Diagnóstico Clínico',
        'Orientación Familiar',
        'Audiología',
        'General'
      ],
      message: 'Categoría no válida'
    }
  },

  estado: {
    type: String,
    enum: {
      values: ['DISPONIBLE', 'EN_USO', 'AGOTADO', 'MANTENIMIENTO'],
      message: 'Estado no válido'
    },
    default: 'DISPONIBLE'
  }
}, {
  timestamps: true,
  collection: 'materiales'
});

materialSchema.index({ categoria: 1, estado: 1 });
materialSchema.index({ nombre: 'text', descripcion: 'text' });

module.exports = mongoose.model('Material', materialSchema);

