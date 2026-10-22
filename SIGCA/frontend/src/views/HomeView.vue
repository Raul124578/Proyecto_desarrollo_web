<template>
  <div class="home-page">
    
    <!-- 1. Encabezado institucional desde Pinia -->
    <section class="hero-header">
      <h1>Centro {{ centroStore.nombre }}</h1>
      <p>{{ centroStore.subtitulo }}</p>
    </section>

    <!-- 2. Carrusel con 5 imágenes (Requisito RF-01) -->
    <section class="carrusel-container">
      <div class="carrusel-slide">
        <img :src="imagenes[indiceActual].url" :alt="imagenes[indiceActual].titulo" />
        <div class="carrusel-caption">
          <h3>{{ imagenes[indiceActual].titulo }}</h3>
          <p>{{ imagenes[indiceActual].descripcion }}</p>
        </div>
      </div>

      <!-- Botones de navegación -->
      <button class="carrusel-btn anterior" @click="anteriorImagen" aria-label="Anterior">&#10094;</button>
      <button class="carrusel-btn siguiente" @click="siguienteImagen" aria-label="Siguiente">&#10095;</button>

      <!-- Indicadores -->
      <div class="carrusel-indicadores">
        <span 
          v-for="(img, idx) in imagenes" 
          :key="idx" 
          :class="['punto', { activo: idx === indiceActual }]"
          @click="indiceActual = idx"
        ></span>
      </div>
    </section>

    <!-- 3. Accesos Rápidos a secciones principales -->
    <section class="accesos-rapidos">
      <div class="card-acceso">
        <h3>Nuestros Servicios</h3>
        <p>Conoce los tratamientos y áreas de atención que ofrecemos.</p>
        <router-link to="/servicios" class="btn-link">Ver Catálogo &rarr;</router-link>
      </div>

      <div class="card-acceso">
        <h3>Solicitar una Cita</h3>
        <p>Envía tu solicitud en línea para programar tu consulta.</p>
        <router-link to="/solicitar-cita" class="btn-link">Solicitar &rarr;</router-link>
      </div>

      <div class="card-acceso">
        <h3>Horarios de Atención</h3>
        <p>Consulta nuestras jornadas y horas de atención al público.</p>
        <router-link to="/horarios" class="btn-link">Consultar &rarr;</router-link>
      </div>
    </section>

    <!-- 4. Misión y Visión (obtenidas del store de Pinia) -->
    <section class="mision-vision-container">
      <div class="bloque-mv">
        <h2>Misión</h2>
        <p>{{ centroStore.mision }}</p>
      </div>

      <div class="bloque-mv">
        <h2>Visión</h2>
        <p>{{ centroStore.vision }}</p>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useCentroStore } from '../stores/centro';

const centroStore = useCentroStore();

// 5 imágenes para el carrusel
const imagenes = ref([
  {
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1000',
    titulo: 'Atención Psicológica Personalizada',
    descripcion: 'Espacios seguros y confidenciales para el bienestar emocional.'
  },
  {
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1000',
    titulo: 'Estimulación Auditiva Verbal',
    descripcion: 'Desarrollo de habilidades de escucha y lenguaje en niños y adultos.'
  },
  {
    url: 'https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=1000',
    titulo: 'Escuela para Padres',
    descripcion: 'Acompañamiento integral a las familias en cada etapa.'
  },
  {
    url: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=1000',
    titulo: 'Instalaciones Modernas y Accesibles',
    descripcion: 'Ambiente profesional pensado para tu tranquilidad y desarrollo.'
  },
  {
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1000',
    titulo: 'Especialistas Comprometidos',
    descripcion: 'Profesionales dedicados a mejorar la calidad de vida de cada paciente.'
  }
]);

const indiceActual = ref(0);

const siguienteImagen = () => {
  indiceActual.value = (indiceActual.value + 1) % imagenes.value.length;
};

const anteriorImagen = () => {
  indiceActual.value = (indiceActual.value - 1 + imagenes.value.length) % imagenes.value.length;
};
</script>

<style scoped>
.home-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.hero-header {
  text-align: center;
  margin-bottom: 25px;
}

.hero-header h1 {
  color: #0056b3;
  font-size: 2rem;
  margin-bottom: 6px;
}

.hero-header p {
  color: #666;
  font-size: 1.05rem;
}

/* Carrusel Responsive */
.carrusel-container {
  position: relative;
  width: 100%;
  height: 380px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 35px;
  background-color: #000;
}

.carrusel-slide {
  width: 100%;
  height: 100%;
  position: relative;
}

.carrusel-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
}

.carrusel-caption {
  position: absolute;
  bottom: 30px;
  left: 30px;
  right: 30px;
  color: #ffffff;
  background-color: rgba(0, 0, 0, 0.65);
  padding: 15px 20px;
  border-radius: 6px;
}

.carrusel-caption h3 {
  margin-bottom: 5px;
  font-size: 1.25rem;
}

.carrusel-caption p {
  font-size: 0.95rem;
}

.carrusel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  font-size: 24px;
  padding: 10px 15px;
  cursor: pointer;
  border-radius: 4px;
}

.carrusel-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.anterior {
  left: 15px;
}

.siguiente {
  right: 15px;
}

.carrusel-indicadores {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.punto {
  width: 12px;
  height: 12px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  cursor: pointer;
}

.punto.activo {
  background-color: #007bff;
}

/* Accesos Rápidos */
.accesos-rapidos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 35px;
}

.card-acceso {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-acceso h3 {
  color: #333;
  margin-bottom: 10px;
}

.card-acceso p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 15px;
}

.btn-link {
  color: #007bff;
  font-weight: bold;
  text-decoration: none;
}

/* Misión y Visión */
.mision-vision-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 25px;
}

.bloque-mv h2 {
  color: #0056b3;
  margin-bottom: 12px;
  font-size: 1.3rem;
}

.bloque-mv p {
  color: #555;
  line-height: 1.6;
}

/* Reglas Responsive */
@media (max-width: 768px) {
  .carrusel-container {
    height: 250px;
  }

  .carrusel-caption {
    bottom: 15px;
    left: 10px;
    right: 10px;
    padding: 10px;
  }

  .carrusel-caption h3 {
    font-size: 1rem;
  }

  .carrusel-caption p {
    font-size: 0.8rem;
  }
}
</style>
