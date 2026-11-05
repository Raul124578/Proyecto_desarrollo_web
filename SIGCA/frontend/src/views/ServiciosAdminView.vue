<template>
  <div class="servicios-admin-container">
    <div class="header-seccion">
      <div>
        <h2>Administración de Servicios</h2>
        <p class="subtitulo">Gestión de catálogo clínico, tarifas, duraciones e imágenes (RF-05)</p>
      </div>
      <button @click="abrirModalCrear" class="btn-nuevo">
        + Registrar Nuevo Servicio
      </button>
    </div>

    <!-- Filtros de búsqueda y estado -->
    <div class="filtros-box">
      <input 
        type="text" 
        v-model="busqueda" 
        @input="cargarServicios" 
        placeholder="Buscar servicio por nombre o descripción..." 
        class="input-busqueda"
      />
      <select v-model="filtroEstado" @change="cargarServicios" class="select-filtro">
        <option value="">Todos los estados</option>
        <option value="ACTIVO">Solo Activos</option>
        <option value="INACTIVO">Solo Inactivos</option>
      </select>
    </div>

    <!-- Alertas -->
    <div v-if="mensajeAlerta" :class="['alerta', tipoAlerta === 'exito' ? 'alerta-exito' : 'alerta-error']">
      {{ mensajeAlerta }}
    </div>

    <!-- Tabla de Servicios -->
    <div class="tabla-responsive">
      <div v-if="cargando" class="mensaje-carga">Cargando servicios clínicos...</div>
      <div v-else-if="servicios.length === 0" class="mensaje-carga">No se encontraron servicios registrados.</div>
      
      <table v-else class="tabla-datos">
        <thead>
          <tr>
            <th>ID</th>
            <th>Imagen</th>
            <th>Servicio</th>
            <th>Duración</th>
            <th>Precio (Q)</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in servicios" :key="s._id">
            <!-- Identificador único (RF-05) -->
            <td>
              <span class="badge-id" :title="s._id">
                #{{ s._id.slice(-6) }}
              </span>
            </td>

            <!-- Imagen / URL (RF-05) -->
            <td>
              <div class="servicio-img-minibox">
                <img v-if="s.imagen" :src="s.imagen" :alt="s.nombre" class="servicio-mini-img" />
                <span v-else class="img-mini-placeholder">🩺</span>
              </div>
            </td>

            <!-- Nombre y Descripción -->
            <td class="col-info">
              <strong class="servicio-titulo">{{ s.nombre }}</strong>
              <p class="servicio-desc">{{ s.descripcion }}</p>
            </td>

            <!-- Duración en minutos -->
            <td>
              <span class="duracion-tag">⏱️ {{ s.duracionMinutos }} min</span>
            </td>

            <!-- Precio en quetzales -->
            <td>
              <strong class="precio-tag">
                Q{{ s.precio ? s.precio.toFixed(2) : (s.precioCentavos / 100).toFixed(2) }}
              </strong>
            </td>

            <!-- Estado ACTIVO / INACTIVO -->
            <td>
              <span :class="['badge', s.estado === 'ACTIVO' ? 'badge-activo' : 'badge-inactivo']">
                {{ s.estado }}
              </span>
            </td>

            <!-- Acciones: Editar y Activar/Desactivar -->
            <td class="acciones">
              <button 
                @click="abrirModalEditar(s)" 
                class="btn-accion btn-editar" 
                title="Editar datos del servicio"
              >
                ✏️ Editar
              </button>

              <button 
                @click="cambiarEstado(s)" 
                :class="['btn-accion', s.estado === 'ACTIVO' ? 'btn-desactivar' : 'btn-activar']"
                :title="s.estado === 'ACTIVO' ? 'Desactivar servicio' : 'Activar servicio'"
              >
                {{ s.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL CREAR / EDITAR SERVICIO (RF-05) -->
    <div v-if="mostrarModal" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>{{ esEdicion ? 'Editar Servicio Clínico' : 'Registrar Nuevo Servicio' }}</h3>
          <button @click="cerrarModal" class="btn-cerrar">&times;</button>
        </div>

        <form @submit.prevent="guardarServicio" class="formulario-modal">
          
          <div v-if="esEdicion" class="campo-id-unico">
            <span><strong>Identificador Único:</strong> <code>{{ servicioIdSeleccionado }}</code></span>
          </div>

          <div class="campo">
            <label for="srv-nombre">Nombre del Servicio *</label>
            <input 
              id="srv-nombre" 
              type="text" 
              v-model.trim="form.nombre" 
              required 
              placeholder="Ej. Terapia de Lenguaje y Comunicación" 
            />
          </div>

          <div class="campo">
            <label for="srv-desc">Descripción Detallada *</label>
            <textarea 
              id="srv-desc" 
              rows="3" 
              v-model.trim="form.descripcion" 
              required 
              placeholder="Describa el objetivo clínico, metodología o a quién está dirigido..."
            ></textarea>
          </div>

          <div class="campo-doble">
            <div class="campo">
              <label for="srv-dur">Duración (minutos enteros) *</label>
              <input 
                id="srv-dur" 
                type="number" 
                min="5" 
                max="480" 
                step="5" 
                v-model.number="form.duracionMinutos" 
                required 
                placeholder="Ej. 45" 
              />
            </div>

            <div class="campo">
              <label for="srv-precio">Precio en Quetzales (Q) *</label>
              <input 
                id="srv-precio" 
                type="number" 
                min="0" 
                step="0.01" 
                v-model.number="form.precio" 
                required 
                placeholder="Ej. 150.00" 
              />
            </div>
          </div>

          <!-- Imagen o URL de imagen (RF-05) -->
          <div class="campo">
            <label for="srv-img">URL de Imagen del Servicio</label>
            <input 
              id="srv-img" 
              type="url" 
              v-model.trim="form.imagen" 
              placeholder="https://ejemplo.com/servicios/terapia.jpg" 
            />
          </div>

          <!-- Previsualización de la imagen -->
          <div v-if="form.imagen" class="preview-img-box">
            <span>Vista previa de la imagen:</span>
            <img :src="form.imagen" alt="Preview" class="preview-img-servicio" @error="form.imagen = ''" />
          </div>

          <div class="campo" v-if="esEdicion">
            <label for="srv-estado">Estado del Servicio *</label>
            <select id="srv-estado" v-model="form.estado" required>
              <option value="ACTIVO">ACTIVO (Visible en portal y disponible para citas)</option>
              <option value="INACTIVO">INACTIVO (Oculto para nuevas citas)</option>
            </select>
          </div>

          <div class="modal-acciones">
            <button type="button" @click="cerrarModal" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-guardar" :disabled="guardando">
              {{ guardando ? 'Guardando...' : (esEdicion ? 'Actualizar Servicio' : 'Registrar Servicio') }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../services/api';

const servicios = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const mostrarModal = ref(false);
const esEdicion = ref(false);
const servicioIdSeleccionado = ref(null);

const busqueda = ref('');
const filtroEstado = ref('');
const mensajeAlerta = ref('');
const tipoAlerta = ref('exito');

const form = reactive({
  nombre: '',
  descripcion: '',
  duracionMinutos: 45,
  precio: 150.00,
  imagen: '',
  estado: 'ACTIVO'
});

const cargarServicios = async () => {
  try {
    cargando.value = true;
    let url = '/servicios';
    const params = [];
    if (busqueda.value) params.push(`buscar=${encodeURIComponent(busqueda.value)}`);
    if (filtroEstado.value) params.push(`estado=${filtroEstado.value}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const res = await api.get(url);
    servicios.value = res.data;
  } catch (error) {
    console.error('Error al cargar servicios:', error);
  } finally {
    cargando.value = false;
  }
};

const abrirModalCrear = () => {
  esEdicion.value = false;
  servicioIdSeleccionado.value = null;
  form.nombre = '';
  form.descripcion = '';
  form.duracionMinutos = 45;
  form.precio = 150.00;
  form.imagen = '';
  form.estado = 'ACTIVO';
  mostrarModal.value = true;
};

const abrirModalEditar = (servicio) => {
  esEdicion.value = true;
  servicioIdSeleccionado.value = servicio._id;
  form.nombre = servicio.nombre;
  form.descripcion = servicio.descripcion;
  form.duracionMinutos = servicio.duracionMinutos;
  form.precio = servicio.precio !== undefined ? servicio.precio : (servicio.precioCentavos / 100);
  form.imagen = servicio.imagen || '';
  form.estado = servicio.estado || 'ACTIVO';
  mostrarModal.value = true;
};

const guardarServicio = async () => {
  if (form.duracionMinutos <= 0 || form.precio < 0) {
    mostrarAlerta('La duración y el precio deben ser valores positivos válidos', 'error');
    return;
  }

  try {
    guardando.value = true;
    if (esEdicion.value) {
      await api.put(`/servicios/${servicioIdSeleccionado.value}`, form);
      mostrarAlerta('Servicio actualizado correctamente ', 'exito');
    } else {
      await api.post('/servicios', form);
      mostrarAlerta('Servicio registrado exitosamente', 'exito');
    }
    cerrarModal();
    cargarServicios();
  } catch (error) {
    mostrarAlerta(error.response?.data?.mensaje || 'Error al procesar servicio', 'error');
  } finally {
    guardando.value = false;
  }
};

const cambiarEstado = async (servicio) => {
  const nuevoEstado = servicio.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  try {
    await api.patch(`/servicios/${servicio._id}/estado`, { estado: nuevoEstado });
    servicio.estado = nuevoEstado;
    mostrarAlerta(`Servicio marcado como ${nuevoEstado}`, 'exito');
  } catch (error) {
    mostrarAlerta('No se pudo cambiar el estado del servicio', 'error');
  }
};

const mostrarAlerta = (mensaje, tipo) => {
  mensajeAlerta.value = mensaje;
  tipoAlerta.value = tipo;
  setTimeout(() => { mensajeAlerta.value = ''; }, 4000);
};

const cerrarModal = () => {
  mostrarModal.value = false;
  esEdicion.value = false;
  servicioIdSeleccionado.value = null;
};

onMounted(() => {
  cargarServicios();
});
</script>

<style scoped>
.servicios-admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.header-seccion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}

h2 {
  color: #333;
}

.subtitulo {
  color: #666;
  font-size: 0.95rem;
}

.btn-nuevo {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}

.btn-nuevo:hover {
  background-color: #0069d9;
}

.filtros-box {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.input-busqueda {
  flex: 1;
  padding: 9px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.select-filtro {
  padding: 9px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: white;
}

.tabla-responsive {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.tabla-datos {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.tabla-datos th, .tabla-datos td {
  padding: 12px 14px;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

.tabla-datos th {
  background-color: #f8f9fa;
  color: #495057;
}

.badge-id {
  background: #f1f3f5;
  color: #495057;
  padding: 3px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: 600;
}

.servicio-img-minibox {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.servicio-mini-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-mini-placeholder {
  font-size: 1.3rem;
}

.col-info {
  max-width: 380px;
}

.servicio-titulo {
  color: #222;
  display: block;
  font-size: 0.95rem;
}

.servicio-desc {
  font-size: 0.82rem;
  color: #6c757d;
  margin-top: 3px;
  line-height: 1.3;
}

.duracion-tag {
  color: #495057;
  font-weight: 500;
}

.precio-tag {
  color: #28a745;
  font-size: 1rem;
}

.badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.badge-activo {
  background-color: #d4edda;
  color: #155724;
}

.badge-inactivo {
  background-color: #f8d7da;
  color: #721c24;
}

.acciones {
  display: flex;
  gap: 6px;
}

.btn-accion {
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
}

.btn-editar {
  background-color: #007bff;
  color: white;
}

.btn-editar:hover {
  background-color: #0069d9;
}

.btn-desactivar {
  background-color: #ffc107;
  color: #212529;
}

.btn-activar {
  background-color: #28a745;
  color: white;
}

.mensaje-carga {
  padding: 25px;
  text-align: center;
  color: #666;
}

.alerta {
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.alerta-exito {
  background-color: #d4edda;
  color: #155724;
}

.alerta-error {
  background-color: #f8d7da;
  color: #721c24;
}

/* Modales */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 15px;
}

.modal-contenido {
  background: white;
  border-radius: 6px;
  width: 100%;
  max-width: 550px;
  padding: 22px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.btn-cerrar {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.campo-id-unico {
  background-color: #f8f9fa;
  border: 1px dashed #ced4da;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.88rem;
}

.formulario-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.campo-doble {
  display: flex;
  gap: 12px;
}

.campo-doble .campo {
  flex: 1;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.campo label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
}

.campo input, .campo select, .campo textarea {
  padding: 8px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.preview-img-box {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  color: #555;
}

.preview-img-servicio {
  width: 80px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #ced4da;
}

.modal-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.btn-cancelar {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-guardar {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
</style>
