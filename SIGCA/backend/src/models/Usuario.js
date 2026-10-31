const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },

  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Ingrese un correo válido'
    ]
  },

  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    validate: {
      validator: function (valor) {
        return typeof valor === 'string' &&
          Buffer.byteLength(valor, 'utf8') <= 72;
      },
      message: 'La contraseña no puede superar 72 bytes'
    },
    select: false
  },

  rol: {
    type: String,
    required: true,
    enum: [
      'ADMINISTRADOR',
      'RECEPCIONISTA',
      'PROFESIONAL'
    ],
    default: 'RECEPCIONISTA'
  },

  estado: {
    type: String,
    enum: ['ACTIVO', 'INACTIVO'],
    default: 'ACTIVO'
  },

  versionToken: {
    type: Number,
    default: 0,
    min: 0,
    select: false
  }
}, {
  timestamps: true,
  collection: 'usuarios',
  toJSON: {
    transform: function (documento, resultado) {
      delete resultado.password;
      delete resultado.versionToken;
      delete resultado.__v;
      return resultado;
    }
  }
});

// Generar el hash antes de guardar una contraseña nueva.
usuarioSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  // Un cambio de contraseña invalida las sesiones anteriores.
  if (!this.isNew) {
    this.versionToken = (this.versionToken ?? 0) + 1;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

// Comparar la contraseña recibida con el hash guardado.
usuarioSchema.methods.compararPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);