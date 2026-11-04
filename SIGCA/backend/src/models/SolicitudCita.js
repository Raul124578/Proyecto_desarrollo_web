const mongoose = require('mongoose');

const solicitudCitaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del solicitante es obligatorio'],
    trim: true,
    maxlength: [150, 'El nombre no puede exceder los 150 caracteres']
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
    required: [true, 'El teléfono de contacto es obligatorio'],
    trim: true,
    match: [/^[0-9]{8}$/, 'El teléfono debe contener exactamente 8 dígitos']
  },

  servicioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: [true, 'El servicio solicitado es obligatorio']
  },

  fechaPreferida: {
    type: Date,
    required: [true, 'La fecha preferida es obligatoria']
  },

  horarioPreferido: {
    type: String,
    enum: ['Mañana', 'Tarde', 'Cualquiera', ''],
    default: 'Cualquiera'
  },

  motivo: {
    type: String,
    trim: true,
    maxlength: [2000, 'El motivo o mensaje no puede superar 2000 caracteres'],
    default: ''
  },

  estado: {
    type: String,
    enum: ['PENDIENTE', 'CONTACTADO', 'CONVERTIDA', 'RECHAZADA'],
    default: 'PENDIENTE'
  },

  citaCreada: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita',
    default: null
  },

  observacionesAdmin: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'solicitudes_citas'
});

solicitudCitaSchema.index({ estado: 1, createdAt: -1 });

module.exports = mongoose.model('SolicitudCita', solicitudCitaSchema);

