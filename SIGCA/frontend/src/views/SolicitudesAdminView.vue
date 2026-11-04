<template>
  <div class="solicitudes-container">
    <div class="header-seccion">
      <div>
        <h2>Solicitudes de Citas</h2>
        <p class="subtitulo">Revisión de solicitudes en línea, seguimiento y conversión a citas formales</p>
      </div>
      <button @click="cargarDatos" class="btn-recargar">
        🔄 Actualizar Lista
      </button>
    </div>

    <!-- Filtros de búsqueda y estado -->
    <div class="filtros-box">
      <input 
        type="text" 
        v-model="busqueda" 
        placeholder="Buscar por solicitante, correo o teléfono..." 
        class="input-busqueda"
      />
      <select v-model="filtroEstado" class="select-filtro">
        <option value="">Todos los estados</option>
        <option value="PENDIENTE">Pendientes</option>
        <option value="CONTACTADO">Contactados</option>
        <option value="CONVERTIDA">Convertidas a Cita</option>
        <option value="RECHAZADA">Rechazadas</option>
      </select>
    </div>

    <!-- Alerta de notificación -->
    <div v-if="mensajeAlerta" :class="['alerta', tipoAlerta === 'exito' ? 'alerta-exito' : 'alerta-error']">
      {{ mensajeAlerta }}
    </div>

    <!-- Tabla de Solicitudes -->
    <div class="tabla-responsive">
      <div v-if="cargando" class="mensaje-carga">Cargando solicitudes de citas...</div>
      <div v-else-if="solicitudesFiltradas.length === 0" class="mensaje-carga">
        No se encontraron solicitudes registradas con los filtros seleccionados.
      </div>
      
      <table v-else class="tabla-datos">
        <thead>
          <tr>
            <th>Solicitante</th>
            <th>Contacto</th>
            <th>Servicio</th>
            <th>Fecha Preferida</th>
            <th>Motivo / Observación</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in solicitudesFiltradas" :key="s._id">
            <td>
              <strong>{{ s.nombre }}</strong>
              <div class="fecha-creacion">Recibida: {{ formatearFechaCorta(s.createdAt) }}</div>
            </td>
            <td>
              <div>📧 {{ s.correo }}</div>
              <div>📞 {{ s.telefono }}</div>
            </td>
            <td>
              <span v-if="s.servicioId">
                <strong>{{ s.servicioId.nombre }}</strong>
                <div class="servicio-info">{{ s.servicioId.duracionMinutos }} min</div>
              </span>
              <span v-else class="texto-inactivo">Servicio no especificado</span>
            </td>
            <td>
              <div>📅 {{ formatearFecha(s.fechaPreferida) }}</div>
              <small class="texto-horario">Horario: {{ s.horarioPreferido || 'Cualquiera' }}</small>
            </td>
            <td class="col-motivo">
              <span v-if="s.motivo">{{ s.motivo }}</span>
              <span v-else class="texto-inactivo">- Sin mensaje -</span>
              <div v-if="s.observacionesAdmin" class="nota-admin">
                <strong>Admin:</strong> {{ s.observacionesAdmin }}
              </div>
            </td>
            <td>
              <span :class="['badge-estado', 'badge-' + s.estado.toLowerCase()]">
                {{ s.estado }}
              </span>
            </td>
            <td class="acciones">
              <button 
                @click="abrirModalGestion(s)" 
                class="btn-accion btn-gestionar"
                title="Cambiar estado o agregar notas"
              >
                ✏️ Gestionar
              </button>
              
              <button 
                v-if="s.estado !== 'CONVERTIDA' && s.estado !== 'RECHAZADA'"
                @click="abrirModalConversion(s)" 
                class="btn-accion btn-convertir"
                title="Agendar como cita formal"
              >
                📅 Convertir a Cita
              </button>

              <span v-else-if="s.estado === 'CONVERTIDA'" class="texto-convertida">
                ✓ Agendada
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal 1: Gestionar Estado y Observaciones -->
    <div v-if="modalGestion" class="modal-overlay">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>Gestionar Solicitud de {{ solicitudSeleccionada?.nombre }}</h3>
          <button @click="cerrarModalGestion" class="btn-cerrar">&times;</button>
        </div>
        <form @submit.prevent="guardarGestion" class="formulario-modal">
          <div class="campo">
            <label>Estado de la Solicitud *</label>
            <select v-model="formGestion.estado" required>
              <option value="PENDIENTE">PENDIENTE (A la espera de contactar)</option>
              <option value="CONTACTADO">CONTACTADO (Se llamó o envió correo)</option>
              <option value="RECHAZADA">RECHAZADA (No procede o canceló)</option>
              <option value="CONVERTIDA" disabled>CONVERTIDA (Usar botón "Convertir a Cita")</option>
            </select>
          </div>

          <div class="campo">
            <label>Observaciones Administrativas</label>
            <textarea 
              v-model="formGestion.observacionesAdmin" 
              rows="3" 
              placeholder="Ej. Se llamó el 03/11 a las 10am, prefiere citas los martes..."
            ></textarea>
          </div>

          <div class="modal-acciones">
            <button type="button" @click="cerrarModalGestion" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-guardar" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Actualizar Solicitud' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal 2: Convertir Solicitud a Cita Formal -->
    <div v-if="modalConversion" class="modal-overlay">
      <div class="modal-contenido modal-amplio">
        <div class="modal-header">
          <h3>Agendar Cita Formal desde Solicitud</h3>
          <button @click="cerrarModalConversion" class="btn-cerrar">&times;</button>
        </div>
        
        <div class="resumen-solicitud-card">
          <p><strong>Solicitante:</strong> {{ solicitudSeleccionada?.nombre }} ({{ solicitudSeleccionada?.telefono }} / {{ solicitudSeleccionada?.correo }})</p>
          <p><strong>Servicio:</strong> {{ solicitudSeleccionada?.servicioId?.nombre }}</p>
          <p><strong>Fecha solicitada:</strong> {{ formatearFecha(solicitudSeleccionada?.fechaPreferida) }} ({{ solicitudSeleccionada?.horarioPreferido }})</p>
        </div>

        <form @submit.prevent="ejecutarConversion" class="formulario-modal">
          
          <!-- Selector: Paciente nuevo vs existente -->
          <div class="campo">
            <label>1. Asignación del Paciente *</label>
            <div class="opciones-modo-paciente">
              <label class="opcion-card" :class="{ activa: modoPaciente === 'nuevo' }">
                <input type="radio" value="nuevo" v-model="modoPaciente" />
                <div>
                  <strong>🆕 Crear expediente nuevo</strong>
                  <div class="opcion-desc">Registra a {{ solicitudSeleccionada?.nombre }} automáticamente</div>
                </div>
              </label>

              <label class="opcion-card" :class="{ activa: modoPaciente === 'existente' }">
                <input type="radio" value="existente" v-model="modoPaciente" />
                <div>
                  <strong>👤 Paciente ya registrado</strong>
                  <div class="opcion-desc">Seleccionar de los pacientes existentes</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Caso A: Crear paciente nuevo -->
          <div v-if="modoPaciente === 'nuevo'" class="caja-formulario-paciente">
            <div class="campo-doble">
              <div class="campo">
                <label>Nombres *</label>
                <input type="text" v-model.trim="formNuevoPaciente.nombres" required />
              </div>
              <div class="campo">
                <label>Apellidos *</label>
                <input type="text" v-model.trim="formNuevoPaciente.apellidos" required />
              </div>
            </div>

            <div class="campo-triple">
              <div class="campo">
                <label>Teléfono *</label>
                <input type="text" v-model.trim="formNuevoPaciente.telefono" required />
              </div>
              <div class="campo">
                <label>Sexo *</label>
                <select v-model="formNuevoPaciente.sexo" required>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div class="campo">
                <label>Fecha de Nacimiento *</label>
                <input type="date" v-model="formNuevoPaciente.fechaNacimiento" required />
              </div>
            </div>

            <div class="campo">
              <label>Dirección de Residencia *</label>
              <input type="text" v-model.trim="formNuevoPaciente.direccion" placeholder="Ej. Ciudad de Guatemala" required />
            </div>
          </div>

          <!-- Caso B: Seleccionar paciente existente -->
          <div v-else class="campo">
            <select v-model="formConversion.pacienteId" required>
              <option value="" disabled>-- Selecciona un paciente registrado --</option>
              <option v-for="pac in pacientes" :key="pac._id" :value="pac._id">
                {{ pac.nombres }} {{ pac.apellidos }} (Tel: {{ pac.telefono || 'S/N' }})
              </option>
            </select>
          </div>

          <!-- Datos de la cita -->
          <div class="campo">
            <label>2. Profesional Responsable *</label>
            <select v-model="formConversion.profesionalId" required>
              <option value="" disabled>-- Selecciona un profesional --</option>
              <option v-for="pro in profesionales" :key="pro._id" :value="pro._id">
                {{ pro.nombre }} ({{ pro.especialidad || pro.rol }})
              </option>
            </select>
          </div>

          <div class="campo">
            <label>3. Fecha y Hora Exacta de Inicio *</label>
            <input 
              type="datetime-local" 
              v-model="formConversion.fechaInicio" 
              required 
            />
            <small class="campo-ayuda">Se reservará según la duración del servicio.</small>
          </div>

          <div class="campo">
            <label>Observaciones de la Cita</label>
            <textarea 
              v-model="formConversion.observaciones" 
              rows="2" 
              placeholder="Detalles adicionales para el expediente de la cita..."
            ></textarea>
          </div>

          <div class="modal-acciones">
            <button type="button" @click="cerrarModalConversion" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-guardar btn-confirmar-conversion" :disabled="guardando">
              {{ guardando ? 'Agendando...' : 'Confirmar y Agendar Cita' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

const solicitudes = ref([]);
const pacientes = ref([]);
const profesionales = ref([]);
const cargando = ref(true);
const guardando = ref(false);

const busqueda = ref('');
const filtroEstado = ref('');
const mensajeAlerta = ref('');
const tipoAlerta = ref('exito');

const modalGestion = ref(false);
const modalConversion = ref(false);
const solicitudSeleccionada = ref(null);

// Modo para gestionar el paciente en la conversión: 'nuevo' o 'existente'
const modoPaciente = ref('nuevo');

const formNuevoPaciente = ref({
  nombres: '',
  apellidos: '',
  telefono: '',
  sexo: 'MASCULINO',
  fechaNacimiento: '2000-01-01',
  direccion: 'Ciudad de Guatemala'
});

const formGestion = ref({
  estado: 'PENDIENTE',
  observacionesAdmin: ''
});

const formConversion = ref({
  pacienteId: '',
  profesionalId: '',
  fechaInicio: '',
  observaciones: ''
});

const mostrarMensaje = (msg, tipo = 'exito') => {
  mensajeAlerta.value = msg;
  tipoAlerta.value = tipo;
  setTimeout(() => {
    mensajeAlerta.value = '';
  }, 4000);
};

const cargarDatos = async () => {
  try {
    cargando.value = true;
    const [resSolicitudes, resPacientes, resUsuarios] = await Promise.all([
      api.get('/solicitudes-cita'),
      api.get('/pacientes?estado=ACTIVO').catch(() => ({ data: [] })),
      api.get('/usuarios').catch(() => ({ data: [] }))
    ]);

    solicitudes.value = resSolicitudes.data;
    pacientes.value = resPacientes.data;
    profesionales.value = resUsuarios.data.filter(u => 
      ['PROFESIONAL', 'ADMINISTRADOR'].includes(u.rol) && u.estado === 'ACTIVO'
    );
  } catch (err) {
    mostrarMensaje('Error al cargar datos del servidor', 'error');
  } finally {
    cargando.value = false;
  }
};

const solicitudesFiltradas = computed(() => {
  return solicitudes.value.filter(s => {
    const coincideEstado = !filtroEstado.value || s.estado === filtroEstado.value;
    const termino = busqueda.value.toLowerCase().trim();
    const coincideTexto = !termino || 
      (s.nombre && s.nombre.toLowerCase().includes(termino)) ||
      (s.correo && s.correo.toLowerCase().includes(termino)) ||
      (s.telefono && s.telefono.includes(termino));
    return coincideEstado && coincideTexto;
  });
});

const abrirModalGestion = (solicitud) => {
  solicitudSeleccionada.value = solicitud;
  formGestion.value = {
    estado: solicitud.estado,
    observacionesAdmin: solicitud.observacionesAdmin || ''
  };
  modalGestion.value = true;
};

const cerrarModalGestion = () => {
  modalGestion.value = false;
  solicitudSeleccionada.value = null;
};

const guardarGestion = async () => {
  try {
    guardando.value = true;
    await api.patch(`/solicitudes-cita/${solicitudSeleccionada.value._id}/estado`, formGestion.value);
    mostrarMensaje('Solicitud actualizada correctamente', 'exito');
    cerrarModalGestion();
    await cargarDatos();
  } catch (err) {
    const errorMsg = err.response?.data?.mensaje || 'Error al actualizar la solicitud';
    mostrarMensaje(errorMsg, 'error');
  } finally {
    guardando.value = false;
  }
};

const abrirModalConversion = (solicitud) => {
  solicitudSeleccionada.value = solicitud;

  // Buscar si coincide con algún paciente registrado por teléfono o nombre
  const pacienteCoincidente = pacientes.value.find(p => 
    p.telefono === solicitud.telefono ||
    (p.nombres + ' ' + p.apellidos).toLowerCase().includes(solicitud.nombre.toLowerCase())
  );

  // Separar nombre del solicitante en nombres y apellidos sugeridos
  const partesNombre = (solicitud.nombre || '').trim().split(/\s+/);
  let nombresSugeridos = partesNombre[0] || 'Solicitante';
  let apellidosSugeridos = partesNombre.slice(1).join(' ') || 'General';

  // Si no hay coincidencia previa, preseleccionamos "nuevo" paciente
  if (pacienteCoincidente) {
    modoPaciente.value = 'existente';
  } else {
    modoPaciente.value = 'nuevo';
  }

  formNuevoPaciente.value = {
    nombres: nombresSugeridos,
    apellidos: apellidosSugeridos,
    telefono: solicitud.telefono || '',
    sexo: 'MASCULINO',
    fechaNacimiento: '2000-01-01',
    direccion: 'Ciudad de Guatemala'
  };

  // Formatear fecha preferida para el input datetime-local (YYYY-MM-DDTHH:mm)
  let fechaInicioDefecto = '';

if (solicitud.fechaPreferida) {
  const fecha = String(solicitud.fechaPreferida).slice(0, 10);
  const hora = solicitud.horarioPreferido === 'Tarde' ? '14:00' : '09:00';
  fechaInicioDefecto = `${fecha}T${hora}`;
}

  formConversion.value = {
    pacienteId: pacienteCoincidente ? pacienteCoincidente._id : '',
    profesionalId: profesionales.value[0]?._id || '',
    fechaInicio: fechaInicioDefecto,
    observaciones: `Cita confirmada a partir de solicitud web de ${solicitud.nombre}. Motivo original: ${solicitud.motivo || 'N/A'}`
  };

  modalConversion.value = true;
};

const cerrarModalConversion = () => {
  modalConversion.value = false;
  solicitudSeleccionada.value = null;
};

const ejecutarConversion = async () => {
  try {
    guardando.value = true;

    const payload = {
      profesionalId: formConversion.value.profesionalId,
      fechaInicio: formConversion.value.fechaInicio,
      observaciones: formConversion.value.observaciones
    };

    if (modoPaciente.value === 'nuevo') {
      payload.crearPacienteNuevo = true;
      payload.nuevoPaciente = formNuevoPaciente.value;
    } else {
      payload.crearPacienteNuevo = false;
      payload.pacienteId = formConversion.value.pacienteId;
    }

    await api.post(`/solicitudes-cita/${solicitudSeleccionada.value._id}/convertir-cita`, payload);
    mostrarMensaje('¡Cita agendada y expediente generado con éxito!', 'exito');
    cerrarModalConversion();
    await cargarDatos();
  } catch (err) {
    const errorMsg = err.response?.data?.mensaje || 'Error al convertir la solicitud a cita';
    mostrarMensaje(errorMsg, 'error');
  } finally {
    guardando.value = false;
  }
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '-';

  const [anio, mes, dia] = String(fechaStr)
    .slice(0, 10)
    .split('-')
    .map(Number);

  const fecha = new Date(anio, mes - 1, dia, 12);

  return fecha.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatearFechaCorta = (fechaStr) => {
  if (!fechaStr) return '-';
  const f = new Date(fechaStr);
  return f.toLocaleDateString('es-GT', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  cargarDatos();
});
</script>

<style scoped>
.solicitudes-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 25px 20px;
}

.header-seccion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.subtitulo {
  color: #6c757d;
  font-size: 0.95rem;
  margin-top: 4px;
}

.btn-recargar {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-recargar:hover {
  background-color: #5a6268;
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
  min-width: 200px;
}

.alerta {
  padding: 12px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-weight: 500;
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

.tabla-responsive {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.mensaje-carga {
  text-align: center;
  padding: 35px;
  color: #6c757d;
}

.tabla-datos {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.tabla-datos th, .tabla-datos td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
}

.tabla-datos th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.fecha-creacion {
  font-size: 0.78rem;
  color: #888;
}

.servicio-info {
  font-size: 0.8rem;
  color: #6c757d;
}

.texto-horario {
  color: #495057;
  font-weight: 500;
}

.col-motivo {
  max-width: 250px;
  font-size: 0.85rem;
}

.nota-admin {
  background: #f1f3f5;
  padding: 4px 6px;
  border-radius: 4px;
  margin-top: 4px;
  font-size: 0.8rem;
  color: #495057;
}

.badge-estado {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.badge-pendiente {
  background-color: #fff3cd;
  color: #856404;
}

.badge-contactado {
  background-color: #cce5ff;
  color: #004085;
}

.badge-convertida {
  background-color: #d4edda;
  color: #155724;
}

.badge-rechazada {
  background-color: #f8d7da;
  color: #721c24;
}

.acciones {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn-accion {
  padding: 5px 8px;
  font-size: 0.8rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  text-align: center;
}

.btn-gestionar {
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  color: #333;
}

.btn-gestionar:hover {
  background-color: #e2e6ea;
}

.btn-convertir {
  background-color: #28a745;
  color: white;
}

.btn-convertir:hover {
  background-color: #218838;
}

.texto-convertida {
  color: #28a745;
  font-weight: bold;
  font-size: 0.85rem;
}

.texto-inactivo {
  color: #999;
  font-style: italic;
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
  max-width: 500px;
  padding: 22px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-amplio {
  max-width: 660px;
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

.resumen-solicitud-card {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 10px 14px;
  margin-bottom: 15px;
  font-size: 0.88rem;
}

.resumen-solicitud-card p {
  margin: 3px 0;
}

/* Opciones de modo paciente */
.opciones-modo-paciente {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.opcion-card {
  border: 1px solid #ced4da;
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  background: #fdfdfd;
}

.opcion-card.activa {
  border-color: #007bff;
  background: #f0f7ff;
}

.opcion-desc {
  font-size: 0.76rem;
  color: #6c757d;
  margin-top: 2px;
}

.caja-formulario-paciente {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.formulario-modal {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.campo-doble {
  display: flex;
  gap: 10px;
}

.campo-doble .campo {
  flex: 1;
}

.campo-triple {
  display: flex;
  gap: 10px;
}

.campo-triple .campo {
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

.campo input, .campo select, .campo textarea {
  padding: 8px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.campo-ayuda {
  font-size: 0.78rem;
  color: #6c757d;
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

.btn-guardar:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-guardar:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-confirmar-conversion {
  background-color: #28a745;
}

.btn-confirmar-conversion:hover:not(:disabled) {
  background-color: #218838;
}

@media (max-width: 600px) {
  .opciones-modo-paciente {
    grid-template-columns: 1fr;
  }
  .campo-doble, .campo-triple {
    flex-direction: column;
  }
}
</style>
