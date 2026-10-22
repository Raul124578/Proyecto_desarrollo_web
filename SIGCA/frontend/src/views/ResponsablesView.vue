<template>
  <div class="responsables-container">
    <div class="header-seccion">
      <div>
        <h2>Gestión de Responsables</h2>
        <p class="subtitulo">Registro de tutores y asociación con expedientes de pacientes</p>
      </div>
      <button @click="mostrarModalNuevo = true" class="btn-nuevo">
        + Registrar Nuevo Responsable
      </button>
    </div>

    <!-- Alerta -->
    <div v-if="mensajeAlerta" :class="['alerta', tipoAlerta === 'exito' ? 'alerta-exito' : 'alerta-error']">
      {{ mensajeAlerta }}
    </div>

    <!-- Tabla de Responsables -->
    <div class="tabla-responsive">
      <div v-if="cargando" class="mensaje-carga">Cargando responsables...</div>
      <div v-else-if="responsables.length === 0" class="mensaje-carga">No hay responsables registrados.</div>

      <table v-else class="tabla-datos">
        <thead>
          <tr>
            <th>Responsable</th>
            <th>Parentesco</th>
            <th>Teléfono</th>
            <th>Correo Electrónico</th>
            <th>Pacientes Asociados</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in responsables" :key="r._id">
            <td>
              <strong>{{ r.nombres }} {{ r.apellidos }}</strong>
            </td>
            <td>{{ r.parentesco }}</td>
            <td>{{ r.telefono }}</td>
            <td>{{ r.correo }}</td>
            <td>
              <div v-if="r.pacientes && r.pacientes.length > 0" class="tags-pacientes">
                <span v-for="pac in r.pacientes" :key="pac._id" class="badge-paciente">
                  {{ pac.nombres }} {{ pac.apellidos }}
                </span>
              </div>
              <span v-else class="texto-vacio">Sin pacientes asociados</span>
            </td>
            <td>
              <button @click="abrirModalAsociar(r)" class="btn-asociar">
                + Asociar Paciente
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL 1: REGISTRAR RESPONSABLE -->
    <div v-if="mostrarModalNuevo" class="modal-overlay" @click.self="cerrarModalNuevo">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>Registrar Nuevo Responsable</h3>
          <button @click="cerrarModalNuevo" class="btn-cerrar">&times;</button>
        </div>

        <form @submit.prevent="guardarResponsable" class="formulario-modal">
          <div class="campo-doble">
            <div class="campo">
              <label>Nombres *</label>
              <input type="text" v-model.trim="form.nombres" required placeholder="Ej. Ana María" />
            </div>
            <div class="campo">
              <label>Apellidos *</label>
              <input type="text" v-model.trim="form.apellidos" required placeholder="Ej. Castillo Ramos" />
            </div>
          </div>

          <div class="campo-doble">
            <div class="campo">
              <label>Parentesco *</label>
              <input type="text" v-model.trim="form.parentesco" required placeholder="Ej. Madre, Padre, Tutor" />
            </div>
            <div class="campo">
              <label>Teléfono (8 dígitos) *</label>
              <input 
                type="tel" 
                v-model.trim="form.telefono" 
                maxlength="8"
                @input="form.telefono = form.telefono.replace(/\D/g, '').slice(0, 8)"
                required 
                placeholder="Ej. 55554321" 
              />
            </div>
          </div>

          <div class="campo">
            <label>Correo Electrónico *</label>
            <input type="email" v-model.trim="form.correo" required placeholder="ejemplo@dominio.com" />
          </div>

          <div class="campo">
            <label>Dirección *</label>
            <input type="text" v-model.trim="form.direccion" required placeholder="Zona o domicilio completo" />
          </div>

          <div class="modal-acciones">
            <button type="button" @click="cerrarModalNuevo" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-guardar" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Guardar Responsable' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: ASOCIAR PACIENTE -->
    <div v-if="mostrarModalAsociar" class="modal-overlay" @click.self="mostrarModalAsociar = false">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>Asociar Paciente a {{ responsableSeleccionado?.nombres }}</h3>
          <button @click="mostrarModalAsociar = false" class="btn-cerrar">&times;</button>
        </div>

        <form @submit.prevent="confirmarAsociacion" class="formulario-modal">
          <div class="campo">
            <label>Selecciona el Paciente a vincular *</label>
            <select v-model="pacienteParaAsociar" required class="select-paciente">
              <option value="" disabled>Selecciona un paciente</option>
              <option v-for="pac in pacientesDisponibles" :key="pac._id" :value="pac._id">
                {{ pac.nombres }} {{ pac.apellidos }} ({{ pac.edad !== null ? pac.edad + ' años' : 'Sin edad' }})
              </option>
            </select>
          </div>

          <div class="modal-acciones">
            <button type="button" @click="mostrarModalAsociar = false" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-guardar" :disabled="guardando || !pacienteParaAsociar">
              {{ guardando ? 'Asociando...' : 'Confirmar Asociación' }}
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

const responsables = ref([]);
const pacientesDisponibles = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const mostrarModalNuevo = ref(false);
const mostrarModalAsociar = ref(false);
const responsableSeleccionado = ref(null);
const pacienteParaAsociar = ref('');

const mensajeAlerta = ref('');
const tipoAlerta = ref('exito');

const form = reactive({
  nombres: '',
  apellidos: '',
  parentesco: '',
  telefono: '',
  correo: '',
  direccion: ''
});

const cargarResponsables = async () => {
  try {
    cargando.value = true;
    const res = await api.get('/responsables');
    responsables.value = res.data;
  } catch (error) {
    console.error('Error al cargar responsables:', error);
  } finally {
    cargando.value = false;
  }
};

const cargarPacientes = async () => {
  try {
    const res = await api.get('/pacientes?estado=ACTIVO');
    pacientesDisponibles.value = res.data;
  } catch (error) {
    console.error('Error al cargar pacientes para asociación:', error);
  }
};

const guardarResponsable = async () => {
  // Validación estricta de correo electrónico
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regexCorreo.test(form.correo)) {
    mostrarAlerta('Por favor ingresa un correo electrónico válido (ej. nombre@dominio.com o .gt).', 'error');
    return;
  }

  // Validación estricta de teléfono: exactamente 8 dígitos
  const regexTelefono = /^[0-9]{8}$/;
  if (!regexTelefono.test(form.telefono)) {
    mostrarAlerta('El número de teléfono debe contener exactamente 8 dígitos numéricos.', 'error');
    return;
  }

  try {
    guardando.value = true;
    await api.post('/responsables', form);
    mostrarAlerta('Responsable registrado correctamente', 'exito');
    cerrarModalNuevo();
    cargarResponsables();
  } catch (error) {
    mostrarAlerta(error.response?.data?.mensaje || 'Error al registrar responsable', 'error');
  } finally {
    guardando.value = false;
  }
};

const abrirModalAsociar = (responsable) => {
  responsableSeleccionado.value = responsable;
  pacienteParaAsociar.value = '';
  mostrarModalAsociar.value = true;
};

const confirmarAsociacion = async () => {
  if (!responsableSeleccionado.value || !pacienteParaAsociar.value) return;

  try {
    guardando.value = true;
    // API backend: POST /api/responsables/:id/pacientes con { pacientes: [id] }
    await api.post(`/responsables/${responsableSeleccionado.value._id}/pacientes`, {
      pacientes: [pacienteParaAsociar.value]
    });
    mostrarAlerta('Paciente asociado exitosamente', 'exito');
    mostrarModalAsociar.value = false;
    cargarResponsables();
  } catch (error) {
    mostrarAlerta(error.response?.data?.mensaje || 'Error al asociar paciente', 'error');
  } finally {
    guardando.value = false;
  }
};

const mostrarAlerta = (mensaje, tipo) => {
  mensajeAlerta.value = mensaje;
  tipoAlerta.value = tipo;
  setTimeout(() => { mensajeAlerta.value = ''; }, 4000);
};

const cerrarModalNuevo = () => {
  mostrarModalNuevo.value = false;
  form.nombres = '';
  form.apellidos = '';
  form.parentesco = '';
  form.telefono = '';
  form.correo = '';
  form.direccion = '';
};

onMounted(() => {
  cargarResponsables();
  cargarPacientes();
});
</script>

<style scoped>
.responsables-container {
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

.tags-pacientes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge-paciente {
  background-color: #e3f2fd;
  color: #0d47a1;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.texto-vacio {
  color: #888;
  font-style: italic;
  font-size: 0.85rem;
}

.btn-asociar {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-asociar:hover {
  background-color: #0056b3;
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
  max-width: 520px;
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

.campo input, .select-paciente {
  padding: 7px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: inherit;
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
