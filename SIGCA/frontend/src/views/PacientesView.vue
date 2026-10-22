<template>
  <div class="pacientes-container">
    <!-- Encabezado con título y botón de registro -->
    <div class="header-seccion">
      <div>
        <h2>Gestión de Pacientes</h2>
        <p class="subtitulo">Administración y control de expedientes de pacientes</p>
      </div>
      <button @click="mostrarModal = true" class="btn-nuevo">
        + Registrar Nuevo Paciente
      </button>
    </div>

    <!-- Barra de búsqueda y filtros -->
    <div class="filtros-box">
      <input 
        type="text" 
        v-model="busqueda" 
        @input="cargarPacientes" 
        placeholder="Buscar por nombre, apellido o teléfono..." 
        class="input-busqueda"
      />
      <select v-model="filtroEstado" @change="cargarPacientes" class="select-filtro">
        <option value="">Todos los estados</option>
        <option value="ACTIVO">Solo Activos</option>
        <option value="INACTIVO">Solo Inactivos</option>
      </select>
    </div>

    <!-- Alerta de mensaje -->
    <div v-if="mensajeAlerta" :class="['alerta', tipoAlerta === 'exito' ? 'alerta-exito' : 'alerta-error']">
      {{ mensajeAlerta }}
    </div>

    <!-- Tabla de Pacientes -->
    <div class="tabla-responsive">
      <div v-if="cargando" class="mensaje-carga">Cargando pacientes...</div>
      <div v-else-if="pacientes.length === 0" class="mensaje-carga">No se encontraron pacientes registrados.</div>
      
      <table v-else class="tabla-datos">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Edad</th>
            <th>Sexo</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in pacientes" :key="p._id">
            <td>
              <strong>{{ p.nombres }} {{ p.apellidos }}</strong>
            </td>
            <td>{{ p.edad !== null ? p.edad + ' años' : '-' }}</td>
            <td>{{ p.sexo }}</td>
            <td>{{ p.telefono }}</td>
            <td>{{ p.direccion }}</td>
            <td>
              <span :class="['badge', p.estado === 'ACTIVO' ? 'badge-activo' : 'badge-inactivo']">
                {{ p.estado }}
              </span>
            </td>
            <td>
              <!-- Eliminación lógica: cambio de estado -->
              <button 
                @click="cambiarEstado(p)" 
                :class="['btn-accion', p.estado === 'ACTIVO' ? 'btn-desactivar' : 'btn-activar']"
              >
                {{ p.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL PARA REGISTRAR PACIENTE -->
    <div v-if="mostrarModal" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>Registrar Nuevo Paciente</h3>
          <button @click="cerrarModal" class="btn-cerrar">&times;</button>
        </div>

        <form @submit.prevent="guardarPaciente" class="formulario-modal">
          <div class="campo-doble">
            <div class="campo">
              <label>Nombres *</label>
              <input type="text" v-model.trim="form.nombres" required placeholder="Ej. Carlos Eduardo" />
            </div>
            <div class="campo">
              <label>Apellidos *</label>
              <input type="text" v-model.trim="form.apellidos" required placeholder="Ej. Gómez Pérez" />
            </div>
          </div>

          <div class="campo-doble">
            <div class="campo">
              <label>Fecha de Nacimiento *</label>
              <input type="date" v-model="form.fechaNacimiento" :max="hoy" required />
            </div>
            <div class="campo">
              <label>Sexo *</label>
              <select v-model="form.sexo" required>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>

          <div class="campo-doble">
            <div class="campo">
              <label>Teléfono *</label>
              <input type="tel" v-model.trim="form.telefono" required placeholder="Ej. 55551234" />
            </div>
            <div class="campo">
              <label>Dirección *</label>
              <input type="text" v-model.trim="form.direccion" required placeholder="Zona o municipio" />
            </div>
          </div>

          <div class="campo">
            <label>Observaciones Administrativas (Opcional)</label>
            <textarea rows="2" v-model.trim="form.observaciones" placeholder="Detalles médicos o administrativos..."></textarea>
          </div>

          <div class="modal-acciones">
            <button type="button" @click="cerrarModal" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-guardar" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Guardar Paciente' }}
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

const pacientes = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const mostrarModal = ref(false);
const busqueda = ref('');
const filtroEstado = ref('');
const mensajeAlerta = ref('');
const tipoAlerta = ref('exito');

const hoy = new Date().toISOString().split('T')[0];

const form = reactive({
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  sexo: 'MASCULINO',
  telefono: '',
  direccion: '',
  observaciones: ''
});

const cargarPacientes = async () => {
  try {
    cargando.value = true;
    let url = '/pacientes';
    const params = [];
    if (busqueda.value) params.push(`buscar=${encodeURIComponent(busqueda.value)}`);
    if (filtroEstado.value) params.push(`estado=${filtroEstado.value}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const res = await api.get(url);
    pacientes.value = res.data;
  } catch (error) {
    console.error('Error al cargar pacientes:', error);
  } finally {
    cargando.value = false;
  }
};

const guardarPaciente = async () => {
  try {
    guardando.value = true;
    await api.post('/pacientes', form);
    mostrarAlerta('Paciente registrado correctamente', 'exito');
    cerrarModal();
    cargarPacientes();
  } catch (error) {
    mostrarAlerta(error.response?.data?.mensaje || 'Error al registrar paciente', 'error');
  } finally {
    guardando.value = false;
  }
};

// Eliminación lógica (cambio de estado ACTIVO <-> INACTIVO)
const cambiarEstado = async (paciente) => {
  const nuevoEstado = paciente.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  try {
    await api.patch(`/pacientes/${paciente._id}/estado`, { estado: nuevoEstado });
    paciente.estado = nuevoEstado;
    mostrarAlerta(`Paciente marcado como ${nuevoEstado}`, 'exito');
  } catch (error) {
    mostrarAlerta('No se pudo cambiar el estado del paciente', 'error');
  }
};

const mostrarAlerta = (mensaje, tipo) => {
  mensajeAlerta.value = mensaje;
  tipoAlerta.value = tipo;
  setTimeout(() => { mensajeAlerta.value = ''; }, 4000);
};

const cerrarModal = () => {
  mostrarModal.value = false;
  form.nombres = '';
  form.apellidos = '';
  form.fechaNacimiento = '';
  form.sexo = 'MASCULINO';
  form.telefono = '';
  form.direccion = '';
  form.observaciones = '';
};

onMounted(() => {
  cargarPacientes();
});
</script>

<style scoped>
.pacientes-container {
  max-width: 1050px;
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
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}

.btn-nuevo:hover {
  background-color: #218838;
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

.btn-accion {
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-desactivar {
  background-color: #ffc107;
  color: #212529;
}

.btn-activar {
  background-color: #17a2b8;
  color: white;
}

.mensaje-carga {
  padding: 20px;
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

/* Modal */
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
  padding: 20px;
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

.formulario-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.campo-doble {
  display: flex;
  gap: 10px;
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
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
}

.campo input, .campo select, .campo textarea {
  padding: 7px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
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
