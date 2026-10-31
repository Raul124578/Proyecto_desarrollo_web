const express = require('express');
const cors = require('cors');
const citaRoutes = require('./routes/citaRoutes');
const cajaRoutes = require('./routes/cajaRoutes');
const pagoRoutes = require('./routes/pagoRoutes');

const pacienteRoutes = require('./routes/pacienteRoutes');
const responsableRoutes = require('./routes/responsableRoutes');
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const horarioRoutes = require('./routes/horarioRoutes');

const app = express();

// Middlewares.
app.use(cors());
app.use(express.json());

// Verificar funcionamiento del servidor.
app.get('/api/status', (req, res) => {
  res.status(200).json({
    estado: 'OK',
    aplicacion: 'SIGCA',
    mensaje: 'API funcionando correctamente'
  });
});

// Rutas.
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/responsables', responsableRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/cajas', cajaRoutes);
app.use('/api/pagos', pagoRoutes);

module.exports = app;


