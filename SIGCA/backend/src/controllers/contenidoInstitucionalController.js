const mongoose = require('mongoose');
const ContenidoInstitucional = require('../models/ContenidoInstitucional');

// Obtener contenido institucional (público)
const obtenerContenido = async (req, res) => {
  try {
    let contenido = await ContenidoInstitucional.findOne()
      .populate('actualizadoPor', 'nombre correo');

    // Compatibilidad: si seed cargó en colección raw 'contenido_institucional'
    if (!contenido) {
      const db = mongoose.connection.db;
      if (db) {
        const raw = await db.collection('contenido_institucional').findOne({});
        if (raw) {
          contenido = await ContenidoInstitucional.create({
            institucion: raw.institucion || "Centro Psicológico y de Desarrollo Humano K'aslemal",
            lema: raw.lema || 'Acompañando procesos, transformando vidas',
            mision: raw.mision || 'Brindar atención psicológica...',
            vision: raw.vision || 'Ser el centro de referencia...',
            valores: raw.valores || ['Empatía', 'Ética profesional'],
            contacto: raw.contacto || {}
          });
        }
      }
    }

    // Si aún no existe, crear documento base por defecto
    if (!contenido) {
      contenido = await ContenidoInstitucional.create({
        institucion: "Centro Psicológico y de Desarrollo Humano K'aslemal",
        lema: "Acompañando procesos, transformando vidas",
        mision: "Brindar servicios de atención psicológica y estimulación auditiva-verbal a personas que requieren apoyo para su bienestar y desarrollo.",
        vision: "Ser un centro de referencia a nivel nacional, con presencia en toda la República de Guatemala.",
        valores: ["Empatía", "Ética profesional", "Compromiso familiar", "Excelencia terapéutica"],
        logoUrl: "/logo.jpg",
        contacto: {
          telefono: "2200-0000",
          correo: "info@kaslemal.edu.gt",
          direccion: "Ciudad de Guatemala, Guatemala",
          horarioAtencion: "Lunes a Viernes de 8:00 a 18:00"
        }
      });
    }

    return res.status(200).json(contenido);
  } catch (error) {
    console.error('Error al obtener contenido institucional:', error);
    return res.status(500).json({ mensaje: 'Error interno al consultar información institucional' });
  }
};

// Actualizar contenido institucional (admin)
const actualizarContenido = async (req, res) => {
  try {
    const permitidos = ['institucion', 'lema', 'mision', 'vision', 'valores', 'logoUrl', 'contacto'];
    const actualizacion = {};

    for (const campo of permitidos) {
      if (req.body[campo] !== undefined) {
        actualizacion[campo] = req.body[campo];
      }
    }

    if (req.usuario) {
      actualizacion.actualizadoPor = req.usuario._id;
    }

    const contenido = await ContenidoInstitucional.findOneAndUpdate(
      {},
      { $set: actualizacion },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      mensaje: 'Contenido institucional actualizado correctamente',
      contenido
    });
  } catch (error) {
    console.error('Error al actualizar contenido institucional:', error);
    return res.status(500).json({ mensaje: 'Error interno al actualizar información institucional' });
  }
};

module.exports = {
  obtenerContenido,
  actualizarContenido
};

