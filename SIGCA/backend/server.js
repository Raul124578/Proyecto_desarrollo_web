require('dotenv').config();

const app = require('./src/app');
const conectarDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;

const iniciarServidor = async () => {
    try {
        await conectarDB();

        app.listen(PORT, () => {
            console.log(`Servidor SIGCA ejecutándose en puerto ${PORT}`);
        });

    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
};

iniciarServidor();