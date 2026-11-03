<template>
  <div class="pagos-container">
    <div class="header-seccion">
      <div>
        <h2>Gestión de Pagos y Facturación</h2>
        <p class="subtitulo">Registro de cobros, recibos UUID, saldos y control de anulaciones</p>
      </div>
      <button @click="abrirModalNuevoPago" class="btn-nuevo">
        + Registrar Nuevo Pago
      </button>
    </div>

    <!-- Alertas -->
    <div v-if="mensajeAlerta" :class="['alerta', tipoAlerta === 'exito' ? 'alerta-exito' : 'alerta-error']">
      {{ mensajeAlerta }}
    </div>

    <!-- Tarjetas de resumen -->
    <div class="resumen-grid">
      <div class="resumen-card">
        <span class="label">Total Recaudado (Vigente)</span>
        <span class="valor monto">Q{{ (totalRecaudadoCentavos / 100).toFixed(2) }}</span>
      </div>
      <div class="resumen-card">
        <span class="label">Pagos Registrados</span>
        <span class="valor">{{ pagosRegistradosCount }}</span>
      </div>
      <div class="resumen-card">
        <span class="label">Pagos Anulados</span>
        <span class="valor text-anulado">{{ pagosAnuladosCount }}</span>
      </div>
    </div>

    <!-- Filtros de búsqueda -->
    <div class="filtros-box">
      <input 
        type="text" 
        v-model="busqueda" 
        placeholder="Buscar por número de recibo o paciente..." 
        class="input-busqueda"
      />
      <select v-model="filtroEstado" class="select-filtro">
        <option value="">Todos los estados</option>
        <option value="REGISTRADO">Solo Registrados</option>
        <option value="ANULADO">Solo Anulados</option>
      </select>
    </div>

    <!-- Tabla de Pagos -->
    <div class="tabla-responsive">
      <div v-if="cargando" class="mensaje-carga">Cargando historial de pagos...</div>
      <div v-else-if="pagosFiltrados.length === 0" class="mensaje-carga">No se encontraron pagos con los criterios especificados.</div>
      <table v-else class="tabla-datos">
        <thead>
          <tr>
            <th>No. Recibo</th>
            <th>Fecha</th>
            <th>Paciente</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, idx) in pagosFiltrados" :key="p._id">
            <td>
              <div class="recibo-box">
                <span class="correlativo-recibo">{{ correlativoPago(p, idx) }}</span>
                <span class="codigo-uuid" :title="'Identificador UUID único: ' + p.numeroRecibo">
                  {{ formatearUUID(p.numeroRecibo) }}
                </span>
              </div>
            </td>
            <td>{{ formatearFecha(p.createdAt) }}</td>
            <td>
              <strong>{{ p.paciente ? `${p.paciente.nombres} ${p.paciente.apellidos}` : 'Paciente' }}</strong>
            </td>
            <td class="monto-tabla">Q{{ (p.montoCentavos / 100).toFixed(2) }}</td>
            <td>
              <span class="badge-metodo">{{ p.metodo }}</span>
            </td>
            <td>
              <span :class="['badge-estado', p.estado === 'REGISTRADO' ? 'badge-exito' : 'badge-error']">
                {{ p.estado }}
              </span>
            </td>
            <td>
              <button 
                v-if="p.estado === 'REGISTRADO'" 
                @click="abrirModalAnular(p)" 
                class="btn-anular"
                title="Anular pago"
              >
                Anular
              </button>
              <span v-else class="texto-motivo" :title="p.motivoAnulacion">
                Anulado: {{ p.motivoAnulacion ? p.motivoAnulacion.substring(0, 20) + '...' : 'Sin detalle' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Registrar Pago -->
    <div v-if="mostrarModalPago" class="modal-overlay">
      <div class="modal-card">
        <h3>Registrar Nuevo Cobro / Pago</h3>
        <p class="modal-desc">Elige la cita del paciente. Se calculará el saldo pendiente automáticamente.</p>

        <form @submit.prevent="confirmarRegistroPago">
          <div class="campo">
            <label for="citaSelect">Selecciona la Cita del Paciente *</label>
            <select id="citaSelect" v-model="formPago.citaId" required @change="alCambiarCita">
              <option value="" disabled>-- Selecciona una cita --</option>
              <option v-for="c in citasDisponibles" :key="c._id" :value="c._id">
                {{ c.paciente ? `${c.paciente.nombres} ${c.paciente.apellidos}` : 'Paciente' }} - {{ c.servicio?.nombre || 'Servicio' }} | Saldo: Q{{ (obtenerSaldoCita(c._id) / 100).toFixed(2) }}
              </option>
            </select>
          </div>

          <div v-if="formPago.citaId" class="saldo-info-box">
            Saldo pendiente a liquidar: <strong>Q{{ (obtenerSaldoCita(formPago.citaId) / 100).toFixed(2) }}</strong>
          </div>

          <div class="campo">
            <label for="montoPago">Monto a Pagar en Quetzales (Q) *</label>
            <input 
              id="montoPago" 
              type="number" 
              step="0.01" 
              min="0.01" 
              v-model.number="formPago.montoQuetzales" 
              placeholder="Ej. 100.00" 
              required 
            />
          </div>

          <div class="campo">
            <label for="metodoPago">Método de Pago *</label>
            <select id="metodoPago" v-model="formPago.metodo" required>
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TARJETA">TARJETA DE CRÉDITO/DÉBITO</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA BANCARIA</option>
            </select>
          </div>

          <div class="modal-acciones">
            <button type="button" @click="mostrarModalPago = false" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-confirmar">Cobrar y Generar Recibo</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Anular Pago -->
    <div v-if="mostrarModalAnulacion" class="modal-overlay">
      <div class="modal-card">
        <h3>Anulación de Recibo / Pago</h3>
        <p class="modal-desc">Indica el motivo de la anulación para los registros contables y auditoría.</p>

        <form @submit.prevent="confirmarAnulacion">
          <div class="campo">
            <label for="motivoAnula">Motivo de Anulación *</label>
            <textarea 
              id="motivoAnula" 
              v-model.trim="motivoAnulacion" 
              rows="3" 
              maxlength="500" 
              placeholder="Ej. Error en cobro de tarjeta, cobrado dos veces..." 
              required
            ></textarea>
          </div>

          <div class="modal-acciones">
            <button type="button" @click="mostrarModalAnulacion = false" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-confirmar-anula">Confirmar Anulación</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

const pagos = ref([]);
const citasDisponibles = ref([]);
const cargando = ref(true);

const busqueda = ref('');
const filtroEstado = ref('');

const mensajeAlerta = ref('');
const tipoAlerta = ref('exito');

const mostrarModalPago = ref(false);
const mostrarModalAnulacion = ref(false);

const pagoSeleccionado = ref(null);
const motivoAnulacion = ref('');

const formPago = ref({
  citaId: '',
  montoQuetzales: 0,
  metodo: 'EFECTIVO'
});

const notificar = (msg, tipo = 'exito') => {
  mensajeAlerta.value = msg;
  tipoAlerta.value = tipo;
  setTimeout(() => { mensajeAlerta.value = ''; }, 4500);
};

const correlativoPago = (pago, idx) => {
  const numero = pagos.value.length - idx;
  return `#REC-${numero.toString().padStart(3, '0')}`;
};

const formatearUUID = (uuidCompleto) => {
  if (!uuidCompleto) return '-';
  // Muestra SIGCA-XXXX...XXXX
  if (uuidCompleto.length > 20) {
    return uuidCompleto.slice(0, 12) + '...' + uuidCompleto.slice(-4);
  }
  return uuidCompleto;
};

const cargarPagos = async () => {
  try {
    cargando.value = true;
    const res = await api.get('/pagos');
    pagos.value = res.data || [];
  } catch (error) {
    notificar(error.response?.data?.mensaje || 'Error al cargar pagos', 'error');
  } finally {
    cargando.value = false;
  }
};

const cargarCitas = async () => {
  try {
    const res = await api.get('/citas?limite=100');
    const lista = res.data?.citas || (Array.isArray(res.data) ? res.data : []);
    citasDisponibles.value = lista.filter(c => c.estado !== 'CANCELADA');
  } catch (error) {
    console.error('Error al cargar citas:', error);
  }
};

const obtenerSaldoCita = (citaId) => {
  const cita = citasDisponibles.value.find(c => c._id === citaId);
  if (!cita) return 0;
  const pagado = pagos.value
    .filter(p => (p.cita?._id === citaId || p.cita === citaId) && p.estado === 'REGISTRADO')
    .reduce((sum, p) => sum + (p.montoCentavos || 0), 0);
  return Math.max(0, (cita.precioCentavos || 0) - pagado);
};

const abrirModalNuevoPago = async () => {
  await cargarCitas();
  formPago.value = {
    citaId: '',
    montoQuetzales: 0,
    metodo: 'EFECTIVO'
  };
  mostrarModalPago.value = true;
};

const alCambiarCita = () => {
  const saldoCentavos = obtenerSaldoCita(formPago.value.citaId);
  formPago.value.montoQuetzales = saldoCentavos / 100;
};

const confirmarRegistroPago = async () => {
  try {
    const centavos = Math.round(Number(formPago.value.montoQuetzales) * 100);
    const res = await api.post('/pagos', {
      citaId: formPago.value.citaId,
      montoCentavos: centavos,
      metodo: formPago.value.metodo
    });
    notificar(res.data?.mensaje || 'Pago registrado exitosamente.');
    mostrarModalPago.value = false;
    await cargarPagos();
  } catch (error) {
    notificar(error.response?.data?.mensaje || 'Error al registrar pago (Verifica tener caja abierta y saldo pendiente)', 'error');
  }
};

const abrirModalAnular = (pago) => {
  pagoSeleccionado.value = pago;
  motivoAnulacion.value = '';
  mostrarModalAnulacion.value = true;
};

const confirmarAnulacion = async () => {
  if (!pagoSeleccionado.value) return;
  try {
    const res = await api.patch(`/pagos/${pagoSeleccionado.value._id}/anular`, {
      motivo: motivoAnulacion.value
    });
    notificar(res.data?.mensaje || 'Pago anulado correctamente.');
    mostrarModalAnulacion.value = false;
    await cargarPagos();
  } catch (error) {
    notificar(error.response?.data?.mensaje || 'Error al anular pago', 'error');
  }
};

const pagosFiltrados = computed(() => {
  return pagos.value.filter(p => {
    const termino = busqueda.value.toLowerCase().trim();
    const coincideTexto = !termino || 
      (p.numeroRecibo && p.numeroRecibo.toLowerCase().includes(termino)) ||
      (p.paciente && `${p.paciente.nombres} ${p.paciente.apellidos}`.toLowerCase().includes(termino));
    
    const coincideEstado = !filtroEstado.value || p.estado === filtroEstado.value;
    return coincideTexto && coincideEstado;
  });
});

const totalRecaudadoCentavos = computed(() => {
  return pagos.value
    .filter(p => p.estado === 'REGISTRADO')
    .reduce((acum, p) => acum + (p.montoCentavos || 0), 0);
});

const pagosRegistradosCount = computed(() => {
  return pagos.value.filter(p => p.estado === 'REGISTRADO').length;
});

const pagosAnuladosCount = computed(() => {
  return pagos.value.filter(p => p.estado === 'ANULADO').length;
});

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '-';
  const d = new Date(fechaStr);
  return d.toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' });
};

onMounted(() => {
  cargarPagos();
  cargarCitas();
});
</script>

<style scoped>
.pagos-container {
  max-width: 1100px;
  margin: 30px auto;
  padding: 0 20px;
}

.header-seccion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.header-seccion h2 {
  color: #1a365d;
  margin: 0;
}

.subtitulo {
  color: #64748b;
  margin: 5px 0 0 0;
}

.btn-nuevo {
  background-color: #2b6cb0;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.resumen-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.resumen-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}

.resumen-card .label {
  font-size: 0.85rem;
  color: #718096;
}

.resumen-card .valor {
  font-size: 1.6rem;
  font-weight: bold;
  color: #2d3748;
  margin-top: 5px;
}

.resumen-card .monto {
  color: #2b6cb0;
}

.text-anulado {
  color: #e53e3e !important;
}

.filtros-box {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.input-busqueda {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.95rem;
}

.select-filtro {
  padding: 10px 14px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  background: white;
  font-size: 0.95rem;
}

.tabla-responsive {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  overflow-x: auto;
}

.tabla-datos {
  width: 100%;
  border-collapse: collapse;
}

.tabla-datos th, .tabla-datos td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.tabla-datos th {
  background-color: #f7fafc;
  color: #4a5568;
  font-size: 0.85rem;
}

.recibo-box {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.correlativo-recibo {
  font-weight: 700;
  color: #2b6cb0;
  font-family: monospace;
  font-size: 0.95rem;
}

.codigo-uuid {
  font-size: 0.75rem;
  color: #718096;
  font-family: monospace;
}

.saldo-info-box {
  background: #ebf8ff;
  border: 1px solid #bee3f8;
  color: #2b6cb0;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.monto-tabla {
  font-weight: 700;
  color: #2d3748;
}

.badge-metodo {
  background: #e2e8f0;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #4a5568;
}

.badge-estado {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.badge-exito {
  background-color: #c6f6d5;
  color: #22543d;
}

.badge-error {
  background-color: #fed7d7;
  color: #742a2a;
}

.btn-anular {
  background: #fed7d7;
  color: #c53030;
  border: 1px solid #feb2b2;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
}

.texto-motivo {
  font-size: 0.8rem;
  color: #718096;
}

.alerta {
  padding: 12px 18px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-weight: 500;
}

.alerta-exito {
  background-color: #c6f6d5;
  color: #22543d;
}

.alerta-error {
  background-color: #fed7d7;
  color: #742a2a;
}

.mensaje-carga {
  padding: 30px;
  text-align: center;
  color: #718096;
}

/* Modales */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
}

.modal-card h3 {
  margin-top: 0;
  color: #1a365d;
}

.modal-desc {
  color: #718096;
  font-size: 0.95rem;
  margin-bottom: 20px;
}

.campo {
  margin-bottom: 18px;
}

.campo label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #2d3748;
}

.campo input, .campo select, .campo textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.modal-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancelar {
  background: #e2e8f0;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: #4a5568;
}

.btn-confirmar {
  background: #2b6cb0;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-confirmar-anula {
  background: #c53030;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
</style>
