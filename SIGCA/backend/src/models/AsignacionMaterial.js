const mongoose = require('mongoose');

const asignacionMaterialSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: [true, 'El material es obligatorio']
  },

  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: [true, 'El paciente es obligatorio']
  },

  cantidad: {
    type: Number,
    required: [true, 'La cantidad es obligatoria'],
    min: [1, 'La cantidad asignada debe ser al menos 1'],
    validate: {
      validator: Number.isInteger,
      message: 'La cantidad debe ser un número entero'
    }
  },

  fechaAsignacion: {
    type: Date,
    default: Date.now,
    required: true
  },

  asignadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  observaciones: {
    type: String,
    trim: true,
    maxlength: [1000, 'Las observaciones no pueden superar 1000 caracteres'],
    default: ''
  },

  estado: {
    type: String,
    enum: ['ASIGNADO', 'DEVUELTO', 'EXTRAVIADO'],
    default: 'ASIGNADO'
  },

  fechaDevolucion: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'asignacionesMateriales'
});

asignacionMaterialSchema.index({ material: 1, paciente: 1 });
asignacionMaterialSchema.index({ estado: 1 });

module.exports = mongoose.model('AsignacionMaterial', asignacionMaterialSchema);

