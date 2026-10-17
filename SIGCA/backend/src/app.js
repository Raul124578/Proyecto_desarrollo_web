
const express = require('express');
const cors = require('cors');

const pacienteRoutes = require('./routes/pacienteRoutes');
const responsableRoutes = require('./routes/responsableRoutes');
const servicioRoutes = require('./routes/servicioRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Verificar funcionamiento del servidor
app.get('/api/status', (req, res) => {
  res.status(200).json({
    estado: 'OK',
    aplicacion: 'SIGCA',
    mensaje: 'API funcionando correctamente'
  });
});

// Rutas de pacientes
app.use('/api/pacientes', pacienteRoutes);

// Rutas de responsables
app.use('/api/responsables', responsableRoutes);

// Rutas de servicios
app.use('/api/servicios', servicioRoutes);

module.exports = app;


