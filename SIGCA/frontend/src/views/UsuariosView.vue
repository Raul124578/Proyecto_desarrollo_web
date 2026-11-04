<template>
  <section class="usuarios">
    <h1>Administración de usuarios</h1>
    <p>Registra usuarios y administra sus roles y estados.</p>

    <div v-if="mensaje" class="mensaje">{{ mensaje }}</div>
    <div v-if="error" class="error">{{ error }}</div>

    <form class="formulario" @submit.prevent="crearUsuario">
      <h2>Registrar usuario</h2>

      <label>
        Nombre
        <input v-model.trim="nuevoUsuario.nombre" required />
      </label>

      <label>
        Correo
        <input v-model.trim="nuevoUsuario.correo" type="email" required />
      </label>

      <label>
        Contraseña
        <input
          v-model="nuevoUsuario.password"
          type="password"
          minlength="8"
          required
        />
      </label>

      <label>
        Rol
        <select v-model="nuevoUsuario.rol">
          <option v-for="rol in roles" :key="rol" :value="rol">
            {{ rol }}
          </option>
        </select>
      </label>

      <button type="submit" :disabled="guardando">
        {{ guardando ? 'Guardando...' : 'Crear usuario' }}
      </button>
    </form>

    <h2>Usuarios registrados</h2>
    <p v-if="cargando">Cargando usuarios...</p>

    <div v-else class="tabla-contenedor">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="usuario in usuarios" :key="usuario._id">
            <td>
              <input v-model.trim="usuario.nombre" aria-label="Nombre" />
            </td>
            <td>
              <input v-model.trim="usuario.correo" type="email" aria-label="Correo" />
            </td>
            <td>
              <select v-model="usuario.rol" aria-label="Rol">
                <option v-for="rol in roles" :key="rol" :value="rol">
                  {{ rol }}
                </option>
              </select>
            </td>
            <td>
              <select v-model="usuario.estado" aria-label="Estado">
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </td>
            <td>
              <button @click="guardarUsuario(usuario)" :disabled="guardando">
                Guardar
              </button>
            </td>
          </tr>

          <tr v-if="usuarios.length === 0">
            <td colspan="5">No hay usuarios registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../services/api';

const roles = ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'];
const usuarios = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const mensaje = ref('');
const error = ref('');

const nuevoUsuario = reactive({
  nombre: '',
  correo: '',
  password: '',
  rol: 'RECEPCIONISTA'
});

const mostrarError = (err) => {
  return err.response?.data?.mensaje || 'Ocurrió un error. Intenta de nuevo.';
};

const cargarUsuarios = async () => {
  cargando.value = true;
  error.value = '';

  try {
    const respuesta = await api.get('/usuarios');
    usuarios.value = respuesta.data;
  } catch (err) {
    error.value = mostrarError(err);
  } finally {
    cargando.value = false;
  }
};

const crearUsuario = async () => {
  guardando.value = true;
  mensaje.value = '';
  error.value = '';

  try {
    await api.post('/usuarios', nuevoUsuario);
    mensaje.value = 'Usuario creado correctamente.';
    nuevoUsuario.nombre = '';
    nuevoUsuario.correo = '';
    nuevoUsuario.password = '';
    nuevoUsuario.rol = 'RECEPCIONISTA';
    await cargarUsuarios();
  } catch (err) {
    error.value = mostrarError(err);
  } finally {
    guardando.value = false;
  }
};

const guardarUsuario = async (usuario) => {
  guardando.value = true;
  mensaje.value = '';
  error.value = '';

  try {
    await api.put(`/usuarios/${usuario._id}`, {
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      estado: usuario.estado
    });
    mensaje.value = 'Usuario actualizado correctamente.';
    await cargarUsuarios();
  } catch (err) {
    error.value = mostrarError(err);
  } finally {
    guardando.value = false;
  }
};

onMounted(cargarUsuarios);
</script>

<style scoped>
.usuarios {
  max-width: 1100px;
  margin: 30px auto;
  padding: 20px;
}

.formulario {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin: 24px 0;
  padding: 18px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.formulario h2 {
  grid-column: 1 / -1;
  margin: 0;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

input,
select,
button {
  padding: 8px;
}

button {
  cursor: pointer;
}

.tabla-contenedor {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 9px;
  border: 1px solid #ddd;
  text-align: left;
}

th {
  background: #315b78;
  color: white;
}

.mensaje {
  color: #176b35;
  margin: 10px 0;
}

.error {
  color: #a12626;
  margin: 10px 0;
}
</style>