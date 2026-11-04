<template>
  <div class="materiales-container">
    <div class="header-seccion">
      <div>
        <h2>Gestión de Materiales</h2>
        <p class="subtitulo">Control de inventario, insumos didácticos y recursos clínicos del centro</p>
      </div>
      <button @click="abrirModalCrear" class="btn-nuevo">
        + Registrar Nuevo Material
      </button>
    </div>

    <!-- Barra de búsqueda y filtros -->
    <div class="filtros-box">
      <input 
        type="text" 
        v-model="busqueda" 
        placeholder="Buscar material por nombre o descripción..." 
        class="input-busqueda"
      />
      <select v-model="filtroCategoria" class="select-filtro">
        <option value="">Todas las categorías</option>
        <option v-for="cat in categorias" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <select v-model="filtroEstado" class="select-filtro">
        <option value="">Todos los estados</option>
        <option value="DISPONIBLE">Disponible</option>
        <option value="EN_USO">En Uso</option>
        <option value="AGOTADO">Agotado</option>
        <option value="MANTENIMIENTO">Mantenimiento</option>
      </select>
    </div>

    <!-- Alerta de notificación -->
    <div v-if="mensajeAlerta" :class="['alerta', tipoAlerta === 'exito' ? 'alerta-exito' : 'alerta-error']">
      {{ mensajeAlerta }}
    </div>

    <!-- Resumen de Inventario -->
    <div class="resumen-cards">
      <div class="card-metrica">
        <span class="metrica-numero">{{ materiales.length }}</span>
        <span class="metrica-etiqueta">Total Registrados</span>
      </div>
      <div class="card-metrica metrica-disponible">
        <span class="metrica-numero">{{ totalDisponibles }}</span>
        <span class="metrica-etiqueta">Disponibles</span>
      </div>
      <div class="card-metrica metrica-uso">
        <span class="metrica-numero">{{ totalEnUso }}</span>
        <span class="metrica-etiqueta">En Uso</span>
      </div>
      <div class="card-metrica metrica-alerta">
        <span class="metrica-numero">{{ totalAgotados }}</span>
        <span class="metrica-etiqueta">Agotados</span>
      </div>
    </div>

    <!-- Tabla de Materiales -->
    <div class="tabla-responsive">
      <div v-if="cargando" class="mensaje-carga">Cargando catálogo de materiales...</div>
      <div v-else-if="materialesFiltrados.length === 0" class="mensaje-carga">
        No se encontraron materiales que coincidan con los filtros aplicados.
      </div>
      
      <table v-else class="tabla-datos">
        <thead>
          <tr>
            <th>Nombre y Descripción</th>
            <th>Categoría</th>
            <th>Cantidad</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in materialesFiltrados" :key="m._id">
            <td class="col-info">
              <strong>{{ m.nombre }}</strong>
              <p class="descripcion-texto">{{ m.descripcion }}</p>
            </td>
            <td>
              <span class="badge-categoria">{{ m.categoria }}</span>
            </td>
            <td>
              <span :class="['cantidad-valor', m.cantidad === 0 ? 'cantidad-cero' : '']">
                {{ m.cantidad }} un.
              </span>
            </td>
            <td>
              <span :class="['badge-estado', 'badge-' + m.estado.toLowerCase().replace('_', '-')]">
                {{ formatearEstado(m.estado) }}
              </span>
            </td>
            <td class="acciones">
              <button @click="abrirModalEditar(m)" class="btn-accion btn-editar" title="Editar detalles">
                ✏️ Editar
              </button>
              <button @click="confirmarEliminar(m)" class="btn-accion btn-eliminar" title="Eliminar material">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: Crear / Editar Material -->
    <div v-if="modalVisible" class="modal-overlay">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>{{ esEdicion ? 'Editar Material' : 'Registrar Nuevo Material' }}</h3>
          <button @click="cerrarModal" class="btn-cerrar">&times;</button>
        </div>

        <form @submit.prevent="guardarMaterial" class="formulario-modal">
          <div class="campo">
            <label for="mat-nombre">Nombre del Material *</label>
            <input 
              id="mat-nombre" 
              type="text" 
              v-model.trim="form.nombre" 
              placeholder="Ej. Set de Tarjetas Fonéticas" 
              required 
            />
          </div>

          <div class="campo">
            <label for="mat-desc">Descripción *</label>
            <textarea 
              id="mat-desc" 
              v-model.trim="form.descripcion" 
              rows="3" 
              placeholder="Describa el material, uso clínico o características..." 
              required
            ></textarea>
          </div>

          <div class="campo-doble">
            <div class="campo">
              <label for="mat-cant">Cantidad en Stock *</label>
              <input 
                id="mat-cant" 
                type="number" 
                min="0" 
                step="1" 
                v-model.number="form.cantidad" 
                placeholder="0" 
                required 
              />
            </div>

            <div class="campo">
              <label for="mat-cat">Categoría *</label>
              <select id="mat-cat" v-model="form.categoria" required>
                <option value="" disabled>Seleccione una categoría</option>
                <option v-for="cat in categorias" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>

          <div class="campo" v-if="esEdicion">
            <label for="mat-estado">Estado Actual *</label>
            <select id="mat-estado" v-model="form.estado" required>
              <option value="DISPONIBLE">DISPONIBLE</option>
              <option value="EN_USO">EN USO</option>
              <option value="AGOTADO">AGOTADO</option>
              <option value="MANTENIMIENTO">MANTENIMIENTO</option>
            </select>
          </div>

          <div class="modal-acciones">
            <button type="button" @click="cerrarModal" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-guardar" :disabled="guardando">
              {{ guardando ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Registrar') }}
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

const categorias = [
  'Fonoaudiología',
  'Terapia Ocupacional',
  'Diagnóstico Clínico',
  'Orientación Familiar',
  'Audiología',
  'General'
];

const materiales = ref([]);
const cargando = ref(true);
const guardando = ref(false);

const busqueda = ref('');
const filtroCategoria = ref('');
const filtroEstado = ref('');
const mensajeAlerta = ref('');
const tipoAlerta = ref('exito');

const modalVisible = ref(false);
const esEdicion = ref(false);
const materialIdSeleccionado = ref(null);

const form = ref({
  nombre: '',
  descripcion: '',
  cantidad: 1,
  categoria: '',
  estado: 'DISPONIBLE'
});

const mostrarMensaje = (msg, tipo = 'exito') => {
  mensajeAlerta.value = msg;
  tipoAlerta.value = tipo;
  setTimeout(() => {
    mensajeAlerta.value = '';
  }, 4000);
};

const cargarMateriales = async () => {
  try {
    cargando.value = true;
    const res = await api.get('/materiales');
    materiales.value = res.data;
  } catch (err) {
    mostrarMensaje('Error al obtener materiales del servidor', 'error');
  } finally {
    cargando.value = false;
  }
};

const materialesFiltrados = computed(() => {
  return materiales.value.filter(m => {
    const coincideCat = !filtroCategoria.value || m.categoria === filtroCategoria.value;
    const coincideEst = !filtroEstado.value || m.estado === filtroEstado.value;
    const termino = busqueda.value.toLowerCase().trim();
    const coincideTexto = !termino || 
      (m.nombre && m.nombre.toLowerCase().includes(termino)) ||
      (m.descripcion && m.descripcion.toLowerCase().includes(termino));
    return coincideCat && coincideEst && coincideTexto;
  });
});

const totalDisponibles = computed(() => 
  materiales.value.filter(m => m.estado === 'DISPONIBLE').length
);

const totalEnUso = computed(() => 
  materiales.value.filter(m => m.estado === 'EN_USO').length
);

const totalAgotados = computed(() => 
  materiales.value.filter(m => m.estado === 'AGOTADO' || m.cantidad === 0).length
);

const abrirModalCrear = () => {
  esEdicion.value = false;
  materialIdSeleccionado.value = null;
  form.value = {
    nombre: '',
    descripcion: '',
    cantidad: 1,
    categoria: categorias[0],
    estado: 'DISPONIBLE'
  };
  modalVisible.value = true;
};

const abrirModalEditar = (material) => {
  esEdicion.value = true;
  materialIdSeleccionado.value = material._id;
  form.value = {
    nombre: material.nombre,
    descripcion: material.descripcion,
    cantidad: material.cantidad,
    categoria: material.categoria,
    estado: material.estado
  };
  modalVisible.value = true;
};

const cerrarModal = () => {
  modalVisible.value = false;
  materialIdSeleccionado.value = null;
};

const guardarMaterial = async () => {
  try {
    guardando.value = true;
    if (esEdicion.value) {
      await api.put(`/materiales/${materialIdSeleccionado.value}`, form.value);
      mostrarMensaje('Material actualizado exitosamente', 'exito');
    } else {
      await api.post('/materiales', form.value);
      mostrarMensaje('Material registrado exitosamente', 'exito');
    }
    cerrarModal();
    await cargarMateriales();
  } catch (err) {
    const errorMsg = err.response?.data?.mensaje || 'Error al procesar el material';
    mostrarMensaje(errorMsg, 'error');
  } finally {
    guardando.value = false;
  }
};

const confirmarEliminar = async (material) => {
  if (!confirm(`¿Está seguro de eliminar el material "${material.nombre}"?`)) {
    return;
  }
  try {
    await api.delete(`/materiales/${material._id}`);
    mostrarMensaje('Material eliminado correctamente', 'exito');
    await cargarMateriales();
  } catch (err) {
    const errorMsg = err.response?.data?.mensaje || 'Error al eliminar el material';
    mostrarMensaje(errorMsg, 'error');
  }
};

const formatearEstado = (est) => {
  switch (est) {
    case 'DISPONIBLE': return 'Disponible';
    case 'EN_USO': return 'En Uso';
    case 'AGOTADO': return 'Agotado';
    case 'MANTENIMIENTO': return 'Mantenimiento';
    default: return est;
  }
};

onMounted(() => {
  cargarMateriales();
});
</script>

<style scoped>
.materiales-container {
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

.btn-nuevo {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 9px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}

.btn-nuevo:hover {
  background-color: #0056b3;
}

.filtros-box {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.input-busqueda {
  flex: 1;
  min-width: 260px;
  padding: 9px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.select-filtro {
  padding: 9px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  min-width: 180px;
}

.resumen-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.card-metrica {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

.metrica-numero {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
}

.metrica-etiqueta {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 4px;
}

.metrica-disponible .metrica-numero { color: #28a745; }
.metrica-uso .metrica-numero { color: #007bff; }
.metrica-alerta .metrica-numero { color: #dc3545; }

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

.col-info {
  max-width: 380px;
}

.descripcion-texto {
  font-size: 0.82rem;
  color: #6c757d;
  margin-top: 4px;
  line-height: 1.3;
}

.badge-categoria {
  background-color: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.cantidad-valor {
  font-weight: bold;
  color: #333;
}

.cantidad-cero {
  color: #dc3545;
}

.badge-estado {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.badge-disponible {
  background-color: #d4edda;
  color: #155724;
}

.badge-en-uso {
  background-color: #cce5ff;
  color: #004085;
}

.badge-agotado {
  background-color: #f8d7da;
  color: #721c24;
}

.badge-mantenimiento {
  background-color: #ffeeba;
  color: #856404;
}

.acciones {
  display: flex;
  gap: 8px;
}

.btn-accion {
  padding: 5px 10px;
  font-size: 0.85rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.btn-editar {
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  color: #333;
}

.btn-editar:hover {
  background-color: #e2e6ea;
}

.btn-eliminar {
  background-color: #fff;
  border: 1px solid #dc3545;
  color: #dc3545;
}

.btn-eliminar:hover {
  background-color: #dc3545;
  color: white;
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
  max-width: 520px;
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

.formulario-modal {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
</style>

