<template>
  <div class="pacientes-container">
    <!-- Encabezado con título y botón de registro -->
    <div class="header-seccion">
      <div>
        <h2>Gestión de Pacientes</h2>
        <p class="subtitulo">Administración, expedientes clínicos y control integral de pacientes (RF-03)</p>
      </div>
      <button @click="abrirModalCrear" class="btn-nuevo">
        + Registrar Nuevo Paciente
      </button>
    </div>

    <!-- Barra de búsqueda y filtros -->
    <div class="filtros-box">
      <input 
        type="text" 
        v-model="busqueda" 
        @input="cargarPacientes" 
        placeholder="Buscar por ID, nombre, apellido o teléfono..." 
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
      <div v-if="cargando" class="mensaje-carga">Cargando catálogo de pacientes...</div>
      <div v-else-if="pacientes.length === 0" class="mensaje-carga">No se encontraron pacientes registrados.</div>
      
      <table v-else class="tabla-datos">
        <thead>
          <tr>
            <th>ID</th>
            <th>Foto</th>
            <th>Paciente y Proceso</th>
            <th>Edad / Nac.</th>
            <th>Sexo</th>
            <th>Teléfono y Dirección</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in pacientes" :key="p._id">
            <!-- Identificador único (RF-03) -->
            <td>
              <span class="badge-id" :title="p._id">
                #{{ p._id.slice(-6) }}
              </span>
            </td>

            <!-- Fotografía (RF-03) -->
            <td>
              <div class="avatar-box">
                <img v-if="p.fotografia" :src="p.fotografia" :alt="p.nombres" class="avatar-img" />
                <span v-else class="avatar-placeholder">👤</span>
              </div>
            </td>

            <!-- Datos del Paciente y Fecha de Inicio -->
            <td>
              <strong class="paciente-nombre">{{ p.nombres }} {{ p.apellidos }}</strong>
              <div class="fecha-inicio" title="Fecha de inicio del proceso clínico">
                📅 Inicio: {{ formatearFecha(p.fechaInicioProceso) }}
              </div>
            </td>

            <!-- Edad calculada automáticamente (RF-03) -->
            <td>
              <strong>{{ p.edad !== null && p.edad !== undefined ? p.edad + ' años' : '-' }}</strong>
              <div class="fecha-nac">{{ formatearFecha(p.fechaNacimiento) }}</div>
            </td>

            <td>{{ p.sexo }}</td>

            <td>
              <div>📞 {{ p.telefono }}</div>
              <small class="direccion-texto">📍 {{ p.direccion }}</small>
            </td>

            <td>
              <span :class="['badge', p.estado === 'ACTIVO' ? 'badge-activo' : 'badge-inactivo']">
                {{ p.estado }}
              </span>
            </td>

            <!-- Acciones: Historial (Citas/Pagos), Editar y Eliminación lógica -->
            <td class="acciones">
              <button 
                @click="abrirHistorial(p)" 
                class="btn-accion btn-historial" 
                title="Consultar citas y pagos relacionados"
              >
                📋 Expediente
              </button>

              <button 
                @click="abrirModalEditar(p)" 
                class="btn-accion btn-editar" 
                title="Actualizar datos del paciente"
              >
                ✏️ Editar
              </button>

              <button 
                @click="cambiarEstado(p)" 
                :class="['btn-accion', p.estado === 'ACTIVO' ? 'btn-desactivar' : 'btn-activar']"
                :title="p.estado === 'ACTIVO' ? 'Desactivar paciente (eliminación lógica)' : 'Reactivar paciente'"
              >
                {{ p.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL 1: REGISTRAR / EDITAR PACIENTE (RF-03) -->
    <div v-if="mostrarModal" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-contenido modal-paciente">
        <div class="modal-header">
          <h3>{{ esEdicion ? 'Actualizar Paciente' : 'Registrar Nuevo Paciente' }}</h3>
          <button @click="cerrarModal" class="btn-cerrar">&times;</button>
        </div>

        <form @submit.prevent="guardarPaciente" class="formulario-modal">
          
          <!-- Si es edición, mostrar ID único -->
          <div v-if="esEdicion" class="campo-id-unico">
            <span><strong>Identificador Único:</strong> <code>{{ pacienteIdSeleccionado }}</code></span>
          </div>

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
              <label>Teléfono (8 dígitos) *</label>
              <input 
                type="tel" 
                v-model.trim="form.telefono" 
                maxlength="8"
                @input="form.telefono = form.telefono.replace(/\D/g, '').slice(0, 8)"
                required 
                placeholder="Ej. 55551234" 
              />
            </div>
            <div class="campo">
              <label>Dirección *</label>
              <input type="text" v-model.trim="form.direccion" required placeholder="Zona o municipio" />
            </div>
          </div>

          <!-- Campos RF-03: Fotografía y Fecha de Inicio de Proceso -->
          <div class="campo-doble">
            <div class="campo">
              <label>Fotografía (URL de la imagen)</label>
              <input 
                type="url" 
                v-model.trim="form.fotografia" 
                placeholder="https://ejemplo.com/foto.jpg" 
              />
            </div>
            <div class="campo">
              <label>Fecha de Inicio del Proceso *</label>
              <input 
                type="date" 
                v-model="form.fechaInicioProceso" 
                :max="hoy" 
                required 
              />
            </div>
          </div>

          <!-- Vista previa de fotografía si se ingresó URL -->
          <div v-if="form.fotografia" class="preview-foto-box">
            <span>Vista previa de foto:</span>
            <img :src="form.fotografia" alt="Preview" class="preview-img" @error="form.fotografia = ''" />
          </div>

          <div class="campo">
            <label>Observaciones Administrativas Generales</label>
            <textarea rows="2" v-model.trim="form.observaciones" placeholder="Detalles médicos o antecedentes importantes..."></textarea>
          </div>

          <div class="modal-acciones">
            <button type="button" @click="cerrarModal" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-guardar" :disabled="guardando">
              {{ guardando ? 'Guardando...' : (esEdicion ? 'Actualizar Paciente' : 'Guardar Paciente') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: EXPEDIENTE HISTORIAL DE CITAS Y PAGOS (RF-03) -->
    <div v-if="mostrarHistorial" class="modal-overlay" @click.self="cerrarHistorial">
      <div class="modal-contenido modal-historial">
        <div class="modal-header">
          <h3>Expediente del Paciente</h3>
          <button @click="cerrarHistorial" class="btn-cerrar">&times;</button>
        </div>

        <div v-if="cargandoHistorial" class="mensaje-carga">
          Cargando expediente, citas y pagos del paciente...
        </div>

        <div v-else-if="historialPaciente" class="contenido-expediente">
          <!-- Cabecera del Paciente con Foto y Datos Generales -->
          <div class="tarjeta-paciente-encabezado">
            <div class="foto-perfil-box">
              <img v-if="historialPaciente.fotografia" :src="historialPaciente.fotografia" alt="Foto Paciente" class="foto-perfil-img" />
              <span v-else class="foto-perfil-placeholder">👤</span>
            </div>

            <div class="datos-perfil">
              <h4>{{ historialPaciente.nombres }} {{ historialPaciente.apellidos }}</h4>
              <p class="id-etiqueta"><strong>ID Único:</strong> <code>{{ historialPaciente._id }}</code></p>
              <div class="grid-resumen-paciente">
                <div><strong>Edad:</strong> {{ historialPaciente.edad }} años</div>
                <div><strong>Sexo:</strong> {{ historialPaciente.sexo }}</div>
                <div><strong>Teléfono:</strong> {{ historialPaciente.telefono }}</div>
                <div><strong>Dirección:</strong> {{ historialPaciente.direccion }}</div>
                <div><strong>Inicio de Proceso:</strong> {{ formatearFecha(historialPaciente.fechaInicioProceso) }}</div>
                <div>
                  <strong>Estado:</strong> 
                  <span :class="['badge', historialPaciente.estado === 'ACTIVO' ? 'badge-activo' : 'badge-inactivo']">
                    {{ historialPaciente.estado }}
                  </span>
                </div>
              </div>
              <div v-if="historialPaciente.observaciones" class="obs-paciente">
                <strong>Observaciones:</strong> {{ historialPaciente.observaciones }}
              </div>
            </div>
          </div>

          <!-- Pestañas de Navegación del Historial -->
          <div class="pestanas-historial">
            <button 
              @click="pestanaActiva = 'citas'" 
              :class="['btn-tab', pestanaActiva === 'citas' ? 'tab-activa' : '']"
            >
              📅 Citas Relacionadas ({{ citasPaciente.length }})
            </button>
            <button 
              @click="pestanaActiva = 'pagos'" 
              :class="['btn-tab', pestanaActiva === 'pagos' ? 'tab-activa' : '']"
            >
              💰 Pagos Registrados ({{ pagosPaciente.length }})
            </button>
          </div>

          <!-- Pestaña 1: Citas del Paciente -->
          <div v-if="pestanaActiva === 'citas'" class="seccion-tab">
            <div v-if="citasPaciente.length === 0" class="mensaje-vacio">
              Este paciente no tiene citas registradas en el sistema.
            </div>
            <table v-else class="tabla-subdatos">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Servicio</th>
                  <th>Profesional</th>
                  <th>Duración</th>
                  <th>Precio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in citasPaciente" :key="c._id">
                  <td>{{ formatearFechaHora(c.fechaInicio) }}</td>
                  <td><strong>{{ c.servicio?.nombre || 'Servicio' }}</strong></td>
                  <td>{{ c.profesional?.nombre || 'No asignado' }}</td>
                  <td>{{ c.duracionMinutos }} min</td>
                  <td>Q{{ (c.precioCentavos / 100).toFixed(2) }}</td>
                  <td>
                    <span :class="['badge-estado-cita', 'badge-cita-' + c.estado.toLowerCase()]">
                      {{ c.estado }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pestaña 2: Pagos del Paciente -->
          <div v-if="pestanaActiva === 'pagos'" class="seccion-tab">
            <div v-if="pagosPaciente.length === 0" class="mensaje-vacio">
              Este paciente no tiene pagos registrados.
            </div>
            <table v-else class="tabla-subdatos">
              <thead>
                <tr>
                  <th>Recibo</th>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th>Monto Pagado</th>
                  <th>Registrado Por</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pago in pagosPaciente" :key="pago._id">
                  <td><code>{{ pago.numeroRecibo || pago._id }}</code></td>
                  <td>{{ formatearFechaHora(pago.createdAt) }}</td>
                  <td>{{ pago.metodo }}</td>
                  <td><strong>Q{{ (pago.montoCentavos / 100).toFixed(2) }}</strong></td>
                  <td>{{ pago.registradoPor?.nombre || 'Caja' }}</td>
                  <td>
                    <span :class="['badge', pago.estado === 'REGISTRADO' ? 'badge-activo' : 'badge-inactivo']">
                      {{ pago.estado }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-acciones">
          <button type="button" @click="cerrarHistorial" class="btn-cancelar">Cerrar</button>
        </div>
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
const esEdicion = ref(false);
const pacienteIdSeleccionado = ref(null);

const busqueda = ref('');
const filtroEstado = ref('');
const mensajeAlerta = ref('');
const tipoAlerta = ref('exito');

// Historial (RF-03)
const mostrarHistorial = ref(false);
const cargandoHistorial = ref(false);
const historialPaciente = ref(null);
const citasPaciente = ref([]);
const pagosPaciente = ref([]);
const pestanaActiva = ref('citas');

const hoy = new Date().toISOString().split('T')[0];

const form = reactive({
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  sexo: 'MASCULINO',
  telefono: '',
  direccion: '',
  fotografia: '',
  fechaInicioProceso: hoy,
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

const abrirModalCrear = () => {
  esEdicion.value = false;
  pacienteIdSeleccionado.value = null;
  form.nombres = '';
  form.apellidos = '';
  form.fechaNacimiento = '';
  form.sexo = 'MASCULINO';
  form.telefono = '';
  form.direccion = '';
  form.fotografia = '';
  form.fechaInicioProceso = hoy;
  form.observaciones = '';
  mostrarModal.value = true;
};

const abrirModalEditar = (paciente) => {
  esEdicion.value = true;
  pacienteIdSeleccionado.value = paciente._id;
  form.nombres = paciente.nombres || '';
  form.apellidos = paciente.apellidos || '';
  form.fechaNacimiento = paciente.fechaNacimiento ? paciente.fechaNacimiento.split('T')[0] : '';
  form.sexo = paciente.sexo || 'MASCULINO';
  form.telefono = paciente.telefono || '';
  form.direccion = paciente.direccion || '';
  form.fotografia = paciente.fotografia || '';
  form.fechaInicioProceso = paciente.fechaInicioProceso ? paciente.fechaInicioProceso.split('T')[0] : hoy;
  form.observaciones = paciente.observaciones || '';
  mostrarModal.value = true;
};

const guardarPaciente = async () => {
  const regexTelefono = /^[0-9]{8}$/;
  if (!regexTelefono.test(form.telefono)) {
    mostrarAlerta('El número de teléfono debe contener exactamente 8 dígitos numéricos.', 'error');
    return;
  }

  try {
    guardando.value = true;
    if (esEdicion.value) {
      await api.put(`/pacientes/${pacienteIdSeleccionado.value}`, form);
      mostrarAlerta('Paciente actualizado correctamente', 'exito');
    } else {
      await api.post('/pacientes', form);
      mostrarAlerta('Paciente registrado correctamente con ID único ', 'exito');
    }
    cerrarModal();
    cargarPacientes();
  } catch (error) {
    mostrarAlerta(error.response?.data?.mensaje || 'Error al procesar paciente', 'error');
  } finally {
    guardando.value = false;
  }
};

// Consultar citas y pagos del paciente (RF-03)
const abrirHistorial = async (paciente) => {
  try {
    mostrarHistorial.value = true;
    cargandoHistorial.value = true;
    pestanaActiva.value = 'citas';

    const res = await api.get(`/pacientes/${paciente._id}/historial`);
    historialPaciente.value = res.data.paciente;
    citasPaciente.value = res.data.citas || [];
    pagosPaciente.value = res.data.pagos || [];
  } catch (err) {
    console.error('Error al consultar historial del paciente:', err);
    mostrarAlerta('No se pudo cargar el historial de citas y pagos del paciente', 'error');
    cerrarHistorial();
  } finally {
    cargandoHistorial.value = false;
  }
};

const cerrarHistorial = () => {
  mostrarHistorial.value = false;
  historialPaciente.value = null;
  citasPaciente.value = [];
  pagosPaciente.value = [];
};

// Eliminación lógica (cambio de estado ACTIVO <-> INACTIVO)
const cambiarEstado = async (paciente) => {
  const nuevoEstado = paciente.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  try {
    await api.patch(`/pacientes/${paciente._id}/estado`, { estado: nuevoEstado });
    paciente.estado = nuevoEstado;
    mostrarAlerta(`Paciente marcado como ${nuevoEstado} mediante eliminación lógica`, 'exito');
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
  esEdicion.value = false;
  pacienteIdSeleccionado.value = null;
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '-';
  const f = new Date(fechaStr);
  return f.toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatearFechaHora = (fechaStr) => {
  if (!fechaStr) return '-';
  const f = new Date(fechaStr);
  return f.toLocaleDateString('es-GT', { 
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit' 
  });
};

onMounted(() => {
  cargarPacientes();
});
</script>

<style scoped>
.pacientes-container {
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

.avatar-box {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 1.1rem;
}

.paciente-nombre {
  display: block;
  color: #222;
}

.fecha-inicio {
  font-size: 0.78rem;
  color: #6c757d;
  margin-top: 2px;
}

.fecha-nac {
  font-size: 0.8rem;
  color: #888;
}

.direccion-texto {
  display: block;
  color: #777;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  align-items: center;
}

.btn-accion {
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
}

.btn-historial {
  background-color: #17a2b8;
  color: white;
}

.btn-historial:hover {
  background-color: #138496;
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 22px;
}

.modal-historial {
  max-width: 780px;
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

.preview-foto-box {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  color: #555;
}

.preview-img {
  width: 50px;
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

/* Estilos de Expediente / Historial */
.tarjeta-paciente-encabezado {
  display: flex;
  gap: 18px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.foto-perfil-box {
  width: 75px;
  height: 75px;
  border-radius: 8px;
  background-color: #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.foto-perfil-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.foto-perfil-placeholder {
  font-size: 2.2rem;
}

.datos-perfil {
  flex: 1;
}

.datos-perfil h4 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 1.15rem;
}

.id-etiqueta {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 8px;
}

.grid-resumen-paciente {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 6px;
  font-size: 0.85rem;
  color: #495057;
}

.obs-paciente {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #555;
  background: white;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #eee;
}

.pestanas-historial {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 15px;
}

.btn-tab {
  background: none;
  border: none;
  padding: 8px 14px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #6c757d;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.btn-tab.tab-activa {
  color: #007bff;
  border-bottom-color: #007bff;
}

.tabla-subdatos {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.tabla-subdatos th, .tabla-subdatos td {
  padding: 9px 12px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.tabla-subdatos th {
  background-color: #f1f3f5;
  color: #495057;
}

.mensaje-vacio {
  text-align: center;
  padding: 25px;
  color: #888;
  font-style: italic;
}

.badge-estado-cita {
  display: inline-block;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.badge-cita-pendiente { background-color: #fff3cd; color: #856404; }
.badge-cita-confirmada { background-color: #cce5ff; color: #004085; }
.badge-cita-completada { background-color: #d4edda; color: #155724; }
.badge-cita-cancelada { background-color: #f8d7da; color: #721c24; }

@media (max-width: 600px) {
  .campo-doble {
    flex-direction: column;
  }
  .tarjeta-paciente-encabezado {
    flex-direction: column;
  }
}
</style>
