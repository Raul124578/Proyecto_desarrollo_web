<template>
  <div class="citas-container">
    <div class="header-seccion">
      <div>
        <h2>Calendario y Gestión de Citas</h2>
        <p class="subtitulo">Programación, control de horarios y seguimiento de citas clínicas</p>
      </div>
      <button @click="abrirModalNuevaCita" class="btn-nuevo">
        + Programar Nueva Cita
      </button>
    </div>

    <!-- Alerta -->
    <div v-if="mensajeAlerta" class="alerta alerta-exito">
      {{ mensajeAlerta }}
    </div>

    <div class="calendario-layout">
      <!-- COLUMNA 1: EL CALENDARIO MENSUAL -->
      <div class="calendario-card">
        <div class="calendario-header">
          <button @click="mesAnterior" class="btn-nav">&laquo; Anterior</button>
          <h3>{{ nombreMesActual }} {{ anioActual }}</h3>
          <button @click="mesSiguiente" class="btn-nav">Siguiente &raquo;</button>
        </div>

        <!-- Días de la semana -->
        <div class="dias-semana">
          <span v-for="d in diasSemana" :key="d">{{ d }}</span>
        </div>

        <!-- Matriz de días del mes -->
        <div class="dias-grid">
          <div 
            v-for="(celda, index) in celdasMes" 
            :key="index"
            :class="[
              'dia-celda', 
              { 'otro-mes': !celda.esMesActual },
              { 'dia-seleccionado': celda.fechaStr === fechaSeleccionada },
              { 'tiene-citas': celda.cantidadCitas > 0 }
            ]"
            @click="seleccionarFecha(celda.fechaStr)"
          >
            <span class="num-dia">{{ celda.dia }}</span>
            <span v-if="celda.cantidadCitas > 0" class="punto-cita">
              {{ celda.cantidadCitas }}
            </span>
          </div>
        </div>
      </div>

      <!-- COLUMNA 2: DETALLE DE CITAS DE LA FECHA SELECCIONADA -->
      <div class="detalle-card">
        <div class="detalle-header">
          <h3>Citas para el {{ fechaSeleccionadaFormateada }}</h3>
          <span class="total-badge">{{ citasFiltradas.length }} cita(s)</span>
        </div>

        <div v-if="citasFiltradas.length === 0" class="sin-citas">
          <p>No hay citas programadas para esta fecha.</p>
          <button @click="abrirModalNuevaCita" class="btn-agendar-aqui">
            Agendar cita en este día
          </button>
        </div>

        <div v-else class="lista-citas">
          <div v-for="c in citasFiltradas" :key="c._id" class="cita-item">
            <div class="cita-top">
              <span class="horario-cita">⏰ {{ c.horaInicio }} - {{ c.horaFin }}</span>
              <span :class="['estado-badge', 'badge-' + c.estado.toLowerCase()]">
                {{ c.estado }}
              </span>
            </div>

            <div class="cita-info">
              <h4>{{ c.pacienteNombre }}</h4>
              <p><strong>Servicio:</strong> {{ c.servicioNombre }} (Q{{ c.precio.toFixed(2) }})</p>
              <p><strong>Profesional:</strong> {{ c.profesional }}</p>
              <p v-if="c.observaciones" class="obs"><em>"{{ c.observaciones }}"</em></p>
            </div>

            <!-- Acciones de Estado -->
            <div class="cita-acciones">
              <button 
                v-if="c.estado === 'PENDIENTE'" 
                @click="actualizarEstadoCita(c, 'CONFIRMADA')" 
                class="btn-sm btn-confirmar"
              >
                Confirmar
              </button>
              <button 
                v-if="c.estado === 'CONFIRMADA'" 
                @click="actualizarEstadoCita(c, 'COMPLETADA')" 
                class="btn-sm btn-completar"
              >
                Marcar Completada
              </button>
              <button 
                v-if="c.estado !== 'COMPLETADA' && c.estado !== 'CANCELADA'" 
                @click="actualizarEstadoCita(c, 'CANCELADA')" 
                class="btn-sm btn-cancelar"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: PROGRAMAR CITA -->
    <div v-if="mostrarModal" class="modal-overlay" @click.self="mostrarModal = false">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>Programar Nueva Cita</h3>
          <button @click="mostrarModal = false" class="btn-cerrar">&times;</button>
        </div>

        <form @submit.prevent="guardarCita" class="formulario-modal">
          <div class="campo">
            <label>Paciente *</label>
            <select v-model="formCita.pacienteId" required class="select-input">
              <option value="" disabled>Selecciona un paciente</option>
              <option v-for="p in pacientes" :key="p._id" :value="p._id">
                {{ p.nombres }} {{ p.apellidos }}
              </option>
            </select>
          </div>

          <div class="campo">
            <label>Servicio *</label>
            <select v-model="formCita.servicioId" @change="calcularHoraFin" required class="select-input">
              <option value="" disabled>Selecciona un servicio</option>
              <option v-for="s in servicios" :key="s._id" :value="s._id">
                {{ s.nombre }} - {{ s.duracionMinutos }} min (Q{{ s.precio ? s.precio.toFixed(2) : (s.precioCentavos/100).toFixed(2) }})
              </option>
            </select>
          </div>

          <div class="campo-doble">
            <div class="campo">
              <label>Fecha *</label>
              <input type="date" v-model="formCita.fecha" :min="hoy" required />
            </div>
            <div class="campo">
              <label>Hora de Inicio *</label>
              <input type="time" v-model="formCita.horaInicio" @change="calcularHoraFin" required />
            </div>
          </div>

          <div class="campo-doble">
            <div class="campo">
              <label>Hora de Fin (Automática - RN-12)</label>
              <input type="time" v-model="formCita.horaFin" readonly class="input-readonly" />
            </div>
            <div class="campo">
              <label>Profesional Asignado *</label>
              <select v-model="formCita.profesional" required class="select-input">
                <option value="Licda. Sofía Morales (Psicología)">Licda. Sofía Morales (Psicología)</option>
                <option value="Dr. Rodrigo Mendoza (Estimulación)">Dr. Rodrigo Mendoza (Estimulación)</option>
                <option value="Lic. Carlos Batres (Lenguaje)">Lic. Carlos Batres (Lenguaje)</option>
              </select>
            </div>
          </div>

          <div class="campo">
            <label>Observaciones Administrativas</label>
            <textarea rows="2" v-model="formCita.observaciones" placeholder="Motivo o notas especiales..."></textarea>
          </div>

          <div class="modal-acciones">
            <button type="button" @click="mostrarModal = false" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-guardar">Guardar Cita</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../services/api';

const hoy = new Date().toISOString().split('T')[0];

const fechaActual = ref(new Date());
const fechaSeleccionada = ref(hoy);
const mostrarModal = ref(false);
const mensajeAlerta = ref('');

const pacientes = ref([]);
const servicios = ref([]);

// Citas iniciales en memoria para demostración interactiva
const citas = ref([
  {
    _id: 'c1',
    fecha: hoy,
    horaInicio: '09:00',
    horaFin: '09:45',
    pacienteNombre: 'Juanito Pérez',
    servicioNombre: 'Atención Psicológica Individual',
    precio: 250,
    profesional: 'Licda. Sofía Morales (Psicología)',
    estado: 'CONFIRMADA',
    observaciones: 'Primera sesión diagnóstica'
  },
  {
    _id: 'c2',
    fecha: hoy,
    horaInicio: '11:00',
    horaFin: '12:00',
    pacienteNombre: 'María Celeste Ramos',
    servicioNombre: 'Estimulación Auditiva Verbal',
    precio: 300,
    profesional: 'Dr. Rodrigo Mendoza (Estimulación)',
    estado: 'PENDIENTE',
    observaciones: 'Paciente menor de edad acompañado de madre'
  }
]);

const formCita = reactive({
  pacienteId: '',
  servicioId: '',
  fecha: hoy,
  horaInicio: '10:00',
  horaFin: '10:45',
  profesional: 'Licda. Sofía Morales (Psicología)',
  observaciones: ''
});

const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const mesesNombres = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const anioActual = computed(() => fechaActual.value.getFullYear());
const mesActual = computed(() => fechaActual.value.getMonth());
const nombreMesActual = computed(() => mesesNombres[mesActual.value]);

const fechaSeleccionadaFormateada = computed(() => {
  const [y, m, d] = fechaSeleccionada.value.split('-');
  return `${d}/${m}/${y}`;
});

const citasFiltradas = computed(() => {
  return citas.value.filter(c => c.fecha === fechaSeleccionada.value);
});

// Generación de celdas del mes para el calendario
const celdasMes = computed(() => {
  const celdas = [];
  const y = anioActual.value;
  const m = mesActual.value;

  const primerDia = new Date(y, m, 1).getDay(); // 0 domingo
  const ajustePrimerDia = primerDia === 0 ? 6 : primerDia - 1; // 0 lunes
  const totalDiasMes = new Date(y, m + 1, 0).getDate();

  // Días vacíos previos
  for (let i = 0; i < ajustePrimerDia; i++) {
    celdas.push({ dia: '', esMesActual: false, fechaStr: '', cantidadCitas: 0 });
  }

  // Días del mes actual
  for (let d = 1; d <= totalDiasMes; d++) {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const fStr = `${y}-${mm}-${dd}`;
    const cantidad = citas.value.filter(c => c.fecha === fStr).length;

    celdas.push({
      dia: d,
      esMesActual: true,
      fechaStr: fStr,
      cantidadCitas: cantidad
    });
  }

  return celdas;
});

const seleccionarFecha = (fStr) => {
  if (fStr) fechaSeleccionada.value = fStr;
};

const mesAnterior = () => {
  fechaActual.value = new Date(anioActual.value, mesActual.value - 1, 1);
};

const mesSiguiente = () => {
  fechaActual.value = new Date(anioActual.value, mesActual.value + 1, 1);
};

// RN-12: Calcular hora de fin sumando duración del servicio a la hora de inicio
const calcularHoraFin = () => {
  if (!formCita.horaInicio || !formCita.servicioId) return;
  const srv = servicios.value.find(s => s._id === formCita.servicioId);
  const duracion = srv ? srv.duracionMinutos : 45;

  const [h, min] = formCita.horaInicio.split(':').map(Number);
  const totalMinutos = h * 60 + min + duracion;
  const finH = String(Math.floor(totalMinutos / 60) % 24).padStart(2, '0');
  const finMin = String(totalMinutos % 60).padStart(2, '0');

  formCita.horaFin = `${finH}:${finMin}`;
};

const abrirModalNuevaCita = () => {
  formCita.fecha = fechaSeleccionada.value;
  calcularHoraFin();
  mostrarModal.value = true;
};

const guardarCita = () => {
  const pac = pacientes.value.find(p => p._id === formCita.pacienteId);
  const srv = servicios.value.find(s => s._id === formCita.servicioId);

  const nuevaCita = {
    _id: 'cita_' + Date.now(),
    fecha: formCita.fecha,
    horaInicio: formCita.horaInicio,
    horaFin: formCita.horaFin,
    pacienteNombre: pac ? `${pac.nombres} ${pac.apellidos}` : 'Paciente Clínico',
    servicioNombre: srv ? srv.nombre : 'Atención General',
    precio: srv ? (srv.precio || (srv.precioCentavos / 100)) : 250,
    profesional: formCita.profesional,
    estado: 'PENDIENTE',
    observaciones: formCita.observaciones
  };

  citas.value.push(nuevaCita);
  fechaSeleccionada.value = formCita.fecha;
  mostrarModal.value = false;
  mostrarAlerta('Cita programada con éxito');
};

const actualizarEstadoCita = (cita, nuevoEstado) => {
  cita.estado = nuevoEstado;
  mostrarAlerta(`Estado actualizado a ${nuevoEstado}`);
};

const mostrarAlerta = (msg) => {
  mensajeAlerta.value = msg;
  setTimeout(() => { mensajeAlerta.value = ''; }, 3500);
};

const cargarDatos = async () => {
  try {
    const resP = await api.get('/pacientes?estado=ACTIVO');
    pacientes.value = resP.data;

    const resS = await api.get('/servicios?estado=ACTIVO');
    servicios.value = resS.data;

    if (servicios.value.length > 0) {
      formCita.servicioId = servicios.value[0]._id;
      calcularHoraFin();
    }
  } catch (error) {
    console.error('Error al cargar datos para citas:', error);
  }
};

onMounted(() => {
  cargarDatos();
});
</script>

<style scoped>
.citas-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 30px 20px;
}

.header-seccion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 25px;
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

.alerta-exito {
  background-color: #d4edda;
  color: #155724;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.calendario-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 25px;
}

/* Card Calendario */
.calendario-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.calendario-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.calendario-header h3 {
  font-size: 1.15rem;
  color: #0056b3;
}

.btn-nav {
  background: #f1f3f5;
  border: 1px solid #ced4da;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.dias-semana {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: bold;
  color: #6c757d;
  font-size: 0.85rem;
  margin-bottom: 10px;
}

.dias-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.dia-celda {
  height: 52px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  font-size: 0.9rem;
}

.dia-celda:hover:not(.otro-mes) {
  background-color: #e3f2fd;
}

.dia-seleccionado {
  background-color: #007bff !important;
  color: white !important;
  font-weight: bold;
}

.tiene-citas:not(.dia-seleccionado) {
  border-color: #28a745;
  background-color: #f6fff8;
}

.punto-cita {
  background: #28a745;
  color: white;
  font-size: 0.7rem;
  padding: 1px 5px;
  border-radius: 10px;
  margin-top: 2px;
}

.dia-seleccionado .punto-cita {
  background: white;
  color: #007bff;
}

.otro-mes {
  background: #fafafa;
  border-color: transparent;
  cursor: default;
}

/* Card Detalle Citas */
.detalle-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.detalle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.detalle-header h3 {
  font-size: 1.05rem;
  color: #333;
}

.total-badge {
  background: #e9ecef;
  color: #495057;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.sin-citas {
  text-align: center;
  padding: 40px 10px;
  color: #888;
}

.btn-agendar-aqui {
  margin-top: 15px;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.lista-citas {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.cita-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  background-color: #fdfdfd;
}

.cita-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.horario-cita {
  font-weight: bold;
  color: #0056b3;
  font-size: 0.9rem;
}

.estado-badge {
  font-size: 0.75rem;
  font-weight: bold;
  padding: 2px 7px;
  border-radius: 4px;
}

.badge-pendiente { background: #fff3cd; color: #856404; }
.badge-confirmada { background: #cce5ff; color: #004085; }
.badge-completada { background: #d4edda; color: #155724; }
.badge-cancelada { background: #f8d7da; color: #721c24; }

.cita-info h4 {
  font-size: 1rem;
  color: #222;
  margin-bottom: 5px;
}

.cita-info p {
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 3px;
}

.obs {
  color: #777 !important;
  margin-top: 5px;
}

.cita-acciones {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.btn-sm {
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-confirmar { background: #007bff; color: white; }
.btn-completar { background: #28a745; color: white; }
.btn-cancelar { background: #dc3545; color: white; }

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
  max-width: 540px;
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

.campo input, .select-input, .campo textarea {
  padding: 7px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: inherit;
}

.input-readonly {
  background-color: #f1f3f5;
  cursor: not-allowed;
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

@media (max-width: 850px) {
  .calendario-layout {
    grid-template-columns: 1fr;
  }
}
</style>
