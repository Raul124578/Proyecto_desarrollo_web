const mongoose = require('mongoose');

const contenidoInstitucionalSchema = new mongoose.Schema({
  institucion: {
    type: String,
    required: [true, 'El nombre de la institución es obligatorio'],
    trim: true,
    default: "Centro Psicológico y de Desarrollo Humano K'aslemal"
  },

  lema: {
    type: String,
    trim: true,
    default: 'Acompañando procesos, transformando vidas'
  },

  mision: {
    type: String,
    required: [true, 'La misión es obligatoria'],
    trim: true
  },

  vision: {
    type: String,
    required: [true, 'La visión es obligatoria'],
    trim: true
  },

  valores: {
    type: [String],
    default: ['Empatía', 'Ética profesional', 'Compromiso familiar', 'Excelencia terapéutica']
  },

  logoUrl: {
    type: String,
    trim: true,
    default: '/logo.jpg'
  },

  contacto: {
    telefono: {
      type: String,
      trim: true,
      default: '22334455'
    },
    correo: {
      type: String,
      trim: true,
      default: 'contacto@kaslemal.edu.gt'
    },
    direccion: {
      type: String,
      trim: true,
      default: 'Avenida Las Américas, Zona 13, Ciudad de Guatemala'
    },
    horarioAtencion: {
      type: String,
      trim: true,
      default: 'Lunes a Viernes de 8:00 a 17:00, Sábados de 8:00 a 12:00'
    }
  },

  actualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  }
}, {
  timestamps: true,
  collection: 'contenidoInstitucional'
});

module.exports = mongoose.model('ContenidoInstitucional', contenidoInstitucionalSchema);

