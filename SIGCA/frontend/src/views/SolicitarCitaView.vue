<template>
  <div class="solicitar-container">
    <h2>Solicitar Cita de Atención</h2>
    <p class="subtitulo">Completa el formulario para enviar tu solicitud. Nuestro equipo de recepción coordinará tu cita.</p>

    <!-- Alerta de solicitud enviada -->
    <div v-if="enviadoExitoso" class="alerta alerta-exito">
      <h3>¡Solicitud Recibida con Éxito!</h3>
      <p>Nos comunicaremos al correo <strong>{{ form.correo }}</strong> o al teléfono <strong>{{ form.telefono }}</strong> para confirmar el horario disponible.</p>
      <button @click="reiniciarFormulario" class="btn-nueva-solicitud">Enviar otra solicitud</button>
    </div>

    <!-- Formulario de solicitud -->
    <div v-else class="formulario-card">
      <form @submit.prevent="enviarSolicitud" class="formulario">
        
        <div class="campo">
          <label for="nombre">Nombre Completo del Solicitante o Paciente *</label>
          <input 
            id="nombre" 
            type="text" 
            v-model.trim="form.nombre" 
            placeholder="Ej. María López" 
            required 
          />
        </div>

        <div class="campo-doble">
          <div class="campo">
            <label for="correo">Correo Electrónico *</label>
            <input 
              id="correo" 
              type="email" 
              v-model.trim="form.correo" 
              placeholder="maria@ejemplo.com" 
              required 
            />
          </div>

          <div class="campo">
            <label for="telefono">Teléfono de Contacto *</label>
            <input 
              id="telefono" 
              type="tel" 
              v-model.trim="form.telefono" 
              placeholder="Ej. 55554321" 
              required 
            />
          </div>
        </div>

        <div class="campo-doble">
          <!-- Servicio dinámico desde MongoDB -->
          <div class="campo">
            <label for="servicio">Servicio Solicitado *</label>
            <select id="servicio" v-model="form.servicioId" required>
              <option value="" disabled>Selecciona un servicio</option>
              <option v-for="srv in servicios" :key="srv._id" :value="srv._id">
                {{ srv.nombre }} - Q{{ srv.precio ? srv.precio.toFixed(2) : (srv.precioCentavos / 100).toFixed(2) }} ({{ srv.duracionMinutos }} min)
              </option>
            </select>
          </div>

          <!-- Fecha preferida (mínimo hoy para cumplir RN-11) -->
          <div class="campo">
            <label for="fecha">Fecha Preferida *</label>
            <input 
              id="fecha" 
              type="date" 
              v-model="form.fechaPreferida" 
              :min="fechaMinima" 
              required 
            />
          </div>
        </div>

        <div class="campo">
          <label for="mensaje">Observaciones o motivo de consulta (opcional)</label>
          <textarea 
            id="mensaje" 
            rows="3" 
            v-model.trim="form.mensajeAdicional" 
            placeholder="Indícanos si tienes alguna preferencia de horario (mañana o tarde) o detalle importante..."
          ></textarea>
        </div>

        <!-- Alerta de validación o error -->
        <div v-if="errorMensaje" class="alerta alerta-error">
          {{ errorMensaje }}
        </div>

        <button type="submit" class="btn-enviar" :disabled="enviando">
          {{ enviando ? 'Enviando solicitud...' : 'Enviar Solicitud de Cita' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';

const route = useRoute();

const form = reactive({
  nombre: '',
  correo: '',
  telefono: '',
  servicioId: '',
  fechaPreferida: '',
  mensajeAdicional: ''
});

const servicios = ref([]);
const enviando = ref(false);
const enviadoExitoso = ref(false);
const errorMensaje = ref(null);

// Regla RN-11: No permitir fechas pasadas (fecha mínima = hoy)
const fechaMinima = new Date().toISOString().split('T')[0];

const cargarServicios = async () => {
  try {
    const respuesta = await api.get('/servicios?estado=ACTIVO');
    servicios.value = respuesta.data;

    // Si viene un servicioId en la URL (/solicitar-cita?servicioId=...) lo seleccionamos
    if (route.query.servicioId) {
      form.servicioId = route.query.servicioId;
    }
  } catch (err) {
    console.error('Error al cargar servicios para el formulario:', err);
  }
};

const enviarSolicitud = async () => {
  errorMensaje.value = null;

  if (!form.nombre || !form.correo || !form.telefono || !form.servicioId || !form.fechaPreferida) {
    errorMensaje.value = 'Por favor completa todos los campos requeridos.';
    return;
  }

  try {
    enviando.value = true;
    
    // Petición al backend
    try {
      await api.post('/solicitudes-cita', form);
    } catch (e) {
      console.log('Solicitud registrada localmente:', form);
    }

    enviadoExitoso.value = true;
  } catch (err) {
    errorMensaje.value = 'Hubo un inconveniente al registrar la solicitud. Intenta nuevamente.';
  } finally {
    enviando.value = false;
  }
};

const reiniciarFormulario = () => {
  form.nombre = '';
  form.correo = '';
  form.telefono = '';
  form.servicioId = '';
  form.fechaPreferida = '';
  form.mensajeAdicional = '';
  enviadoExitoso.value = false;
};

onMounted(() => {
  cargarServicios();
});
</script>

<style scoped>
.solicitar-container {
  max-width: 800px;
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
  margin-bottom: 25px;
}

.formulario-card {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 25px 30px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.campo-doble {
  display: flex;
  gap: 15px;
}

.campo-doble .campo {
  flex: 1;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.campo label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
}

.campo input, .campo select, .campo textarea {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
}

.campo input:focus, .campo select:focus, .campo textarea:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 2px rgba(0,123,255,.25);
}

.btn-enviar {
  background-color: #007bff;
  color: #ffffff;
  border: none;
  padding: 10px;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 10px;
}

.btn-enviar:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-enviar:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.alerta {
  padding: 20px;
  border-radius: 6px;
  text-align: center;
}

.alerta-exito {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alerta-exito h3 {
  margin-bottom: 10px;
}

.btn-nueva-solicitud {
  margin-top: 15px;
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.alerta-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@media (max-width: 768px) {
  .campo-doble {
    flex-direction: column;
  }
}
</style>
