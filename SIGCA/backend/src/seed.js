require('dotenv').config();
const mongoose = require('mongoose');
const Servicio = require('./models/Servicio');

const serviciosPrueba = [
  {
    nombre: "Atención Psicológica Individual",
    descripcion: "Evaluación y acompañamiento psicoterapéutico personalizado para niños, jóvenes y adultos.",
    duracionMinutos: 45,
    precioCentavos: 25000, // Q250.00
    imagen: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600",
    estado: "ACTIVO"
  },
  {
    nombre: "Estimulación Auditiva Verbal",
    descripcion: "Terapia especializada para el desarrollo de la escucha y habilidades del habla.",
    duracionMinutos: 60,
    precioCentavos: 30000, // Q300.00
    imagen: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600",
    estado: "ACTIVO"
  },
  {
    nombre: "Terapia de Lenguaje y Comunicación",
    descripcion: "Intervención orientada a potenciar la fluidez, articulación y comprensión del lenguaje.",
    duracionMinutos: 45,
    precioCentavos: 20000, // Q200.00
    imagen: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600",
    estado: "ACTIVO"
  },
  {
    nombre: "Escuela para Padres y Orientación Familiar",
    descripcion: "Sesiones de guía y estrategias para padres en el acompañamiento de sus hijos.",
    duracionMinutos: 60,
    precioCentavos: 17500, // Q175.00
    imagen: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=600",
    estado: "ACTIVO"
  },
  {
    nombre: "Evaluación Psicológica y Diagnóstico",
    descripcion: "Batería de pruebas y diagnóstico clínico integral con informe detallado.",
    duracionMinutos: 90,
    precioCentavos: 45000, // Q450.00
    imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600",
    estado: "ACTIVO"
  }
];

const cargarDatos = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sigca');
    console.log('Conectado a MongoDB...');

    // Limpiar servicios anteriores para no duplicar
    await Servicio.deleteMany({});
    
    // Insertar los 5 servicios
    await Servicio.insertMany(serviciosPrueba);
    console.log('¡5 servicios de prueba insertados exitosamente!');

    process.exit(0);
  } catch (error) {
    console.error('Error al insertar servicios:', error);
    process.exit(1);
  }
};

cargarDatos();
