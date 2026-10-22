<template>
  <div class="contacto-container">
    <h2>Ponte en Contacto</h2>
    <p class="subtitulo">¿Tienes dudas o necesitas información sobre nuestros servicios? Escríbenos.</p>

    <div class="contacto-layout">
      <!-- Columna 1: Información de la clínica -->
      <div class="info-box">
        <h3>Centro K'aslemal</h3>
        <p class="info-item">📍 <strong>Ubicación:</strong> Ciudad de Guatemala, Guatemala</p>
        <p class="info-item">📞 <strong>Teléfono:</strong> +502 2200-0000</p>
        <p class="info-item">✉️ <strong>Correo:</strong> info@kaslemal.edu.gt</p>
        <p class="info-item">🕒 <strong>Atención:</strong> Lunes a Viernes de 8:00 a 18:00</p>
        
        <div class="info-nota">
          <p>Para agendar una cita directa, te recomendamos utilizar nuestra opción de <strong>Solicitar Cita</strong> en el menú principal.</p>
        </div>
      </div>

      <!-- Columna 2: Formulario -->
      <div class="formulario-box">
        <!-- Alerta de éxito -->
        <div v-if="enviadoExitoso" class="alerta alerta-exito">
          ¡Gracias por comunicarte! Tu mensaje ha sido enviado correctamente. Nos pondremos en contacto pronto.
        </div>

        <!-- Formulario -->
        <form v-else @submit.prevent="enviarMensaje" class="formulario">
          <div class="campo">
            <label for="nombre">Nombre Completo *</label>
            <input 
              id="nombre" 
              type="text" 
              v-model.trim="form.nombre" 
              placeholder="Ej. Juan Pérez" 
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
                placeholder="ejemplo@dominio.com" 
                required 
              />
            </div>

            <div class="campo">
              <label for="telefono">Teléfono (8 dígitos) *</label>
              <input 
                id="telefono" 
                type="tel" 
                v-model.trim="form.telefono" 
                maxlength="8"
                @input="form.telefono = form.telefono.replace(/\D/g, '').slice(0, 8)"
                placeholder="Ej. 55551234" 
                required 
              />
            </div>
          </div>

          <div class="campo">
            <label for="asunto">Asunto *</label>
            <input 
              id="asunto" 
              type="text" 
              v-model.trim="form.asunto" 
              placeholder="Motivo de tu consulta" 
              required 
            />
          </div>

          <div class="campo">
            <label for="mensaje">Mensaje *</label>
            <textarea 
              id="mensaje" 
              rows="4" 
              v-model.trim="form.mensaje" 
              placeholder="Escribe tu mensaje o consulta aquí..." 
              required
            ></textarea>
          </div>

          <!-- Mensaje de error de validación -->
          <div v-if="errorValidacion" class="alerta alerta-error">
            {{ errorValidacion }}
          </div>

          <button type="submit" class="btn-enviar" :disabled="enviando">
            {{ enviando ? 'Enviando mensaje...' : 'Enviar Mensaje' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import api from '../services/api';

const form = reactive({
  nombre: '',
  correo: '',
  telefono: '',
  asunto: '',
  mensaje: ''
});

const enviando = ref(false);
const enviadoExitoso = ref(false);
const errorValidacion = ref(null);

const enviarMensaje = async () => {
  errorValidacion.value = null;

  // 1. Validaciones requeridas por RF-01
  if (!form.nombre || !form.correo || !form.telefono || !form.asunto || !form.mensaje) {
    errorValidacion.value = 'Por favor completa todos los campos obligatorios.';
    return;
  }

  // Validación estricta de correo electrónico (usuario@dominio.extension)
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regexCorreo.test(form.correo)) {
    errorValidacion.value = 'Por favor ingresa un correo electrónico válido (ej. nombre@dominio.com o .gt).';
    return;
  }

  // Validación estricta de teléfono: exactamente 8 dígitos numéricos
  const regexTelefono = /^[0-9]{8}$/;
  if (!regexTelefono.test(form.telefono)) {
    errorValidacion.value = 'El número de teléfono debe contener exactamente 8 dígitos numéricos.';
    return;
  }

  try {
    enviando.value = true;
    
    // Intenta enviar a la API del backend
    try {
      await api.post('/contacto', form);
    } catch (e) {
      // Si el compañero aún no creó la ruta en backend, simulamos éxito para prueba visual
      console.log('Mensaje recibido localmente:', form);
    }

    enviadoExitoso.value = true;
  } catch (err) {
    errorValidacion.value = 'Ocurrió un error al enviar el mensaje. Intenta nuevamente.';
  } finally {
    enviando.value = false;
  }
};
</script>

<style scoped>
.contacto-container {
  max-width: 950px;
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

.contacto-layout {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 30px;
}

.info-box {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-box h3 {
  color: #0056b3;
  margin-bottom: 10px;
}

.info-item {
  color: #555;
  font-size: 0.95rem;
}

.info-nota {
  margin-top: 15px;
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #666;
}

.formulario-box {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 25px;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 15px;
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
  gap: 5px;
}

.campo label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
}

.campo input, .campo textarea {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
}

.campo input:focus, .campo textarea:focus {
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
  padding: 12px 15px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.alerta-exito {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alerta-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Responsive para celulares */
@media (max-width: 768px) {
  .contacto-layout {
    grid-template-columns: 1fr;
  }

  .campo-doble {
    flex-direction: column;
  }
}
</style>
