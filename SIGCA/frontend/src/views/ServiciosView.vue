<template>
  <div class="servicios-container">
    <h2>Nuestros Servicios</h2>
    <p class="subtitulo">Servicios especializados en psicología y estimulación auditiva verbal</p>

    <!-- Estado de carga -->
    <div v-if="cargando" class="mensaje-estado">
      Cargando servicios disponibles...
    </div>

    <!-- Mensaje de error si el backend no responde -->
    <div v-else-if="error" class="mensaje-error">
      {{ error }}
    </div>

    <!-- Lista vacía -->
    <div v-else-if="servicios.length === 0" class="mensaje-estado">
      No hay servicios activos registrados en este momento.
    </div>

    <!-- Cuadrícula de servicios -->
    <div v-else class="servicios-grid">
      <div v-for="servicio in servicios" :key="servicio._id" class="servicio-card">
        <!-- Imagen del servicio o cuadro por defecto -->
        <div class="servicio-img-box">
          <img v-if="servicio.imagen" :src="servicio.imagen" :alt="servicio.nombre" />
          <div v-else class="img-placeholder">Sin imagen</div>
        </div>

        <div class="servicio-info">
          <h3>{{ servicio.nombre }}</h3>
          <p class="descripcion">{{ servicio.descripcion }}</p>
          
          <div class="detalles">
            <span><strong>Duración:</strong> {{ servicio.duracionMinutos }} min</span>
            <span class="precio"><strong>Precio:</strong> Q{{ servicio.precio ? servicio.precio.toFixed(2) : (servicio.precioCentavos / 100).toFixed(2) }}</span>
          </div>

          <!-- Redirige a solicitar cita enviando el ID del servicio -->
          <router-link :to="`/solicitar-cita?servicioId=${servicio._id}`" class="btn-solicitar">
            Solicitar Cita
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const servicios = ref([]);
const cargando = ref(true);
const error = ref(null);

const cargarServicios = async () => {
  try {
    cargando.value = true;
    error.value = null;
    // Petición GET a la API REST de Express
    const respuesta = await api.get('/servicios?estado=ACTIVO');
    servicios.value = respuesta.data;
  } catch (err) {
    error.value = 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.';
    console.error('Error al cargar servicios:', err);
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  cargarServicios();
});
</script>

<style scoped>
.servicios-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
}

h2 {
  text-align: center;
  color: #333;
}

.subtitulo {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.mensaje-estado, .mensaje-error {
  text-align: center;
  padding: 20px;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.mensaje-error {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.servicios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.servicio-card {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.servicio-img-box {
  height: 160px;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
}

.servicio-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-placeholder {
  color: #888;
  font-size: 0.9rem;
}

.servicio-info {
  padding: 15px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.servicio-info h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: #222;
}

.descripcion {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 15px;
  flex: 1;
}

.detalles {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.precio {
  color: #28a745;
  font-weight: bold;
}

.btn-solicitar {
  display: block;
  text-align: center;
  background-color: #007bff;
  color: #ffffff;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.btn-solicitar:hover {
  background-color: #0056b3;
}
</style>

