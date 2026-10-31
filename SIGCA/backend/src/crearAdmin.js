require('dotenv').config();

const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');

const crearAdmin = async () => {
  try {
    if (!process.env.MONGO_URI || !process.env.ADMIN_PASSWORD) {
      throw new Error('Falta MONGO_URI o ADMIN_PASSWORD en .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    await Usuario.init();

    const correo = 'admin@sigca.test';
    const existente = await Usuario.findOne({ correo });

    if (existente) {
      console.log('El usuario ya existe. No se modificó.');
      return;
    }

    await Usuario.create({
      nombre: 'Administrador de prueba',
      correo,
      password: process.env.ADMIN_PASSWORD,
      rol: 'ADMINISTRADOR',
      estado: 'ACTIVO'
    });

    console.log('Administrador creado correctamente.');
    console.log('Correo: admin@sigca.test');
  } catch (error) {
    console.error('No se pudo crear el administrador:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

crearAdmin();