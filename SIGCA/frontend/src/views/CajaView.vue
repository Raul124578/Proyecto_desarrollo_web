<template>
  <div class="caja-container">
    <div class="header-seccion">
      <div>
        <h2>Control y Arqueo de Caja Diaria</h2>
        <p class="subtitulo">Apertura, registro de movimientos, historial y cierre de caja</p>
      </div>
      <button v-if="!cajaActiva" @click="mostrarModalAbrir = true" class="btn-nuevo">
        + Abrir Nueva Caja
      </button>
      <button v-else @click="prepararCierre" class="btn-cerrar-caja">
        🔒 Realizar Corte y Cerrar Caja
      </button>
    </div>

    <!-- Alertas -->
    <div v-if="mensajeAlerta" :class="['alerta', tipoAlerta === 'exito' ? 'alerta-exito' : 'alerta-error']">
      {{ mensajeAlerta }}
    </div>

    <!-- Tarjeta de Estado de la Caja Activa -->
    <div class="caja-activa-card" :class="cajaActiva ? 'borde-activa' : 'borde-inactiva'">
      <div class="tarjeta-cabecera">
        <h3>
          <span class="icono-caja">💼</span>
          Estado de tu Caja: 
          <span :class="['badge-estado', cajaActiva ? 'badge-abierta' : 'badge-cerrada']">
            {{ cajaActiva ? 'ABIERTA' : 'CERRADA' }}
          </span>
        </h3>
      </div>

      <div v-if="cajaActiva" class="detalles-caja-grid">
        <div class="info-item">
          <span class="label">No. de Caja / Turno:</span>
          <span class="valor correlativo-destacado">{{ correlativoCaja(cajaActiva) }}</span>
        </div>
        <div class="info-item">
          <span class="label">Fecha y Hora de Apertura:</span>
          <span class="valor">{{ formatearFecha(cajaActiva.fechaApertura) }}</span>
        </div>
        <div class="info-item">
          <span class="label">Fondo Inicial en Caja:</span>
          <span class="valor monto-resaltado">Q{{ (cajaActiva.montoInicialCentavos / 100).toFixed(2) }}</span>
        </div>
        <div class="info-item">
          <span class="label">Cajero Responsable:</span>
          <span class="valor">{{ cajaActiva.usuario?.nombre || 'Tú' }}</span>
        </div>
      </div>

      <div v-else class="sin-caja-activa">
        <p>No tienes ninguna caja abierta actualmente. Para poder registrar pagos y cobros de pacientes, debes realizar la apertura de turno.</p>
        <button @click="mostrarModalAbrir = true" class="btn-abrir-cta">Abrir Caja con Fondo Inicial</button>
      </div>
    </div>

    <!-- Historial de Cajas -->
    <div class="historial-seccion">
      <h3>Historial de Cajas y Cortes Diarios</h3>
      <div class="tabla-responsive">
        <div v-if="cargando" class="mensaje-carga">Cargando registros de caja...</div>
        <div v-else-if="cajas.length === 0" class="mensaje-carga">No hay registros de cajas archivadas.</div>
        <table v-else class="tabla-datos">
          <thead>
            <tr>
              <th>No. Caja</th>
              <th>Estado</th>
              <th>Apertura</th>
              <th>Cierre</th>
              <th>Responsable</th>
              <th>Fondo Inicial</th>
              <th>Monto Contado</th>
              <th>Diferencia</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(c, idx) in cajas" :key="c._id">
              <td>
                <span class="correlativo-tabla">{{ correlativoFila(c, idx) }}</span>
              </td>
              <td>
                <span :class="['badge-estado', c.estado === 'ABIERTA' ? 'badge-abierta' : 'badge-cerrada']">
                  {{ c.estado }}
                </span>
              </td>
              <td>{{ formatearFecha(c.fechaApertura) }}</td>
              <td>{{ c.fechaCierre ? formatearFecha(c.fechaCierre) : 'En curso...' }}</td>
              <td>{{ c.usuario?.nombre || 'Usuario' }}</td>
              <td>Q{{ (c.montoInicialCentavos / 100).toFixed(2) }}</td>
              <td>{{ c.montoContadoCentavos !== null ? 'Q' + (c.montoContadoCentavos / 100).toFixed(2) : '-' }}</td>
              <td>
                <span v-if="c.diferenciaCentavos !== null" :class="c.diferenciaCentavos === 0 ? 'diferencia-cuadra' : 'diferencia-descuadre'">
                  {{ c.diferenciaCentavos === 0 ? 'Exacto (Q0.00)' : 'Q' + (c.diferenciaCentavos / 100).toFixed(2) }}
                </span>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Abrir Caja -->
    <div v-if="mostrarModalAbrir" class="modal-overlay">
      <div class="modal-card">
        <h3>Apertura de Caja Diaria</h3>
        <p class="modal-desc">Ingresa el monto inicial con el que inicias operaciones en caja (sencillo / cambio).</p>
        
        <form @submit.prevent="confirmarAbrirCaja">
          <div class="campo">
            <label for="fondoInicial">Fondo Inicial en Efectivo (Q) *</label>
            <input 
              id="fondoInicial" 
              type="number" 
              step="0.01" 
              min="0" 
              v-model.number="formAbrir.montoQuetzales" 
              placeholder="Ej. 100.00" 
              required 
            />
          </div>

          <div class="modal-acciones">
            <button type="button" @click="mostrarModalAbrir = false" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-confirmar">Confirmar Apertura</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Cerrar Caja -->
    <div v-if="mostrarModalCerrar" class="modal-overlay">
      <div class="modal-card">
        <h3>Cierre y Corte de Caja</h3>
        <p class="modal-desc">Realiza el arqueo físico de efectivo y escribe el monto total contado.</p>

        <form @submit.prevent="confirmarCierreCaja">
          <div class="campo">
            <label for="montoContado">Total Contado en Caja (Q) *</label>
            <input 
              id="montoContado" 
              type="number" 
              step="0.01" 
              min="0" 
              v-model.number="formCerrar.montoQuetzales" 
              placeholder="Ej. 500.00" 
              required 
            />
          </div>

          <div class="modal-acciones">
            <button type="button" @click="mostrarModalCerrar = false" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-confirmar-cierre">Proceder al Cierre</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const cajas = ref([]);
const cajaActiva = ref(null);
const cargando = ref(true);

const mensajeAlerta = ref('');
const tipoAlerta = ref('exito');

const mostrarModalAbrir = ref(false);
const mostrarModalCerrar = ref(false);

const formAbrir = ref({ montoQuetzales: 0 });
const formCerrar = ref({ montoQuetzales: 0 });

const notificar = (msg, tipo = 'exito') => {
  mensajeAlerta.value = msg;
  tipoAlerta.value = tipo;
  setTimeout(() => { mensajeAlerta.value = ''; }, 4500);
};

const correlativoCaja = (caja) => {
  if (!caja) return '-';
  const index = cajas.value.findIndex(c => c._id === caja._id);
  const correlativo = index >= 0 ? (cajas.value.length - index) : 1;
  return `#CJ-${correlativo.toString().padStart(3, '0')}`;
};

const correlativoFila = (caja, idx) => {
  const correlativo = cajas.value.length - idx;
  return `#CJ-${correlativo.toString().padStart(3, '0')}`;
};

const cargarCajas = async () => {
  try {
    cargando.value = true;
    const res = await api.get('/cajas');
    cajas.value = res.data || [];
    cajaActiva.value = cajas.value.find(c => c.estado === 'ABIERTA') || null;
  } catch (error) {
    notificar(error.response?.data?.mensaje || 'Error al cargar registros de caja', 'error');
  } finally {
    cargando.value = false;
  }
};

const confirmarAbrirCaja = async () => {
  try {
    const centavos = Math.round(Number(formAbrir.value.montoQuetzales || 0) * 100);
    await api.post('/cajas', { montoInicialCentavos: centavos });
    notificar('Caja abierta exitosamente.');
    mostrarModalAbrir.value = false;
    formAbrir.value.montoQuetzales = 0;
    await cargarCajas();
  } catch (error) {
    notificar(error.response?.data?.mensaje || 'Error al abrir caja', 'error');
  }
};

const prepararCierre = () => {
  formCerrar.value.montoQuetzales = cajaActiva.value ? (cajaActiva.value.montoInicialCentavos / 100) : 0;
  mostrarModalCerrar.value = true;
};

const confirmarCierreCaja = async () => {
  if (!cajaActiva.value) return;
  try {
    const centavos = Math.round(Number(formCerrar.value.montoQuetzales || 0) * 100);
    const res = await api.patch(`/cajas/${cajaActiva.value._id}/cerrar`, { montoContadoCentavos: centavos });
    notificar(res.data?.mensaje || 'Caja cerrada exitosamente.');
    mostrarModalCerrar.value = false;
    await cargarCajas();
  } catch (error) {
    notificar(error.response?.data?.mensaje || 'Error al cerrar caja', 'error');
  }
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '-';
  const d = new Date(fechaStr);
  return d.toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' });
};

onMounted(() => {
  cargarCajas();
});
</script>

<style scoped>
.caja-container {
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

.btn-cerrar-caja {
  background-color: #c53030;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.caja-activa-card {
  background: white;
  padding: 22px;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.borde-activa {
  border-left: 6px solid #38a169;
}

.borde-inactiva {
  border-left: 6px solid #a0aec0;
}

.tarjeta-cabecera h3 {
  margin: 0 0 15px 0;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge-estado {
  font-size: 0.8rem;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: bold;
}

.badge-abierta {
  background-color: #c6f6d5;
  color: #22543d;
}

.badge-cerrada {
  background-color: #edf2f7;
  color: #4a5568;
}

.detalles-caja-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.info-item .label {
  display: block;
  font-size: 0.85rem;
  color: #718096;
}

.info-item .valor {
  font-size: 1.05rem;
  font-weight: 600;
  color: #2d3748;
}

.correlativo-destacado {
  color: #2b6cb0;
  font-family: monospace;
  font-size: 1.25rem !important;
  font-weight: 700;
}

.correlativo-tabla {
  background: #ebf8ff;
  color: #2b6cb0;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: 700;
}

.monto-resaltado {
  color: #2b6cb0 !important;
  font-size: 1.25rem !important;
}

.sin-caja-activa {
  padding: 15px 0;
  color: #4a5568;
}

.btn-abrir-cta {
  background-color: #38a169;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 10px;
}

.historial-seccion h3 {
  color: #2d3748;
  margin-bottom: 15px;
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
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.tabla-datos th {
  background-color: #f7fafc;
  color: #4a5568;
  font-size: 0.9rem;
}

.diferencia-cuadra {
  color: #22543d;
  font-weight: bold;
}

.diferencia-descuadre {
  color: #c53030;
  font-weight: bold;
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

/* Modal */
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
  max-width: 480px;
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
  margin-bottom: 20px;
}

.campo label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #2d3748;
}

.campo input {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.modal-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

.btn-confirmar-cierre {
  background: #c53030;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
</style>
