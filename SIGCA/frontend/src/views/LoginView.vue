<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-header">
        <img :src="centroStore.logoUrl" alt="Logo K'aslemal" class="logo-login" />
        <h2>Acceso Administrativo</h2>
        <p>Centro {{ centroStore.nombre }}</p>
      </div>

      <div v-if="errorLogin" class="alerta-error">
        {{ errorLogin }}
      </div>

      <form @submit.prevent="ejecutarLogin" class="login-form">
        <div class="campo">
          <label>Correo Electrónico</label>
          <input 
            type="email" 
            v-model.trim="correo" 
            required 
            placeholder="admin@sigca.test" 
          />
        </div>

        <div class="campo">
          <label>Contraseña</label>
          <input 
            type="password" 
            v-model="password" 
            required 
            placeholder="••••••••" 
          />
        </div>

        <button type="submit" class="btn-entrar" :disabled="cargando">
          {{ cargando ? 'Ingresando...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <div class="demo-box">
        <p><strong>Credenciales de demostración (Seed):</strong></p>
        <p><strong>Admin:</strong> admin@sigca.test | Password123*</p>
        <p><strong>Recepción:</strong> recepcion1@sigca.test | Password123*</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/sesion';
import { useCentroStore } from '../stores/centro';

const router = useRouter();
const authStore = useAuthStore();
const centroStore = useCentroStore();

const correo = ref('admin@sigca.test');
const password = ref('Password123*');
const cargando = ref(false);
const errorLogin = ref('');

const ejecutarLogin = async () => {
  try {
    cargando.value = true;
    errorLogin.value = '';
    await authStore.iniciarSesion(correo.value, password.value);
    router.push('/admin/caja');
  } catch (err) {
    errorLogin.value = err.message || 'Credenciales incorrectas o usuario inactivo.';
  } finally {
    cargando.value = false;
  }
};
</script>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 20px;
}

.login-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  width: 100%;
  max-width: 420px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.login-header {
  text-align: center;
  margin-bottom: 25px;
}

.logo-login {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
}

.login-header h2 {
  margin: 0;
  color: #1a365d;
}

.login-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

.campo {
  margin-bottom: 18px;
}

.campo label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #334155;
  font-size: 0.9rem;
}

.campo input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.campo input:focus {
  outline: none;
  border-color: #2b6cb0;
}

.btn-entrar {
  width: 100%;
  padding: 12px;
  background-color: #2b6cb0;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
}

.btn-entrar:hover:not(:disabled) {
  background-color: #2c5282;
}

.alerta-error {
  background-color: #fee2e2;
  color: #991b1b;
  padding: 10px;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 15px;
  text-align: center;
}

.demo-box {
  margin-top: 25px;
  padding: 12px;
  background-color: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #475569;
}

.demo-box p {
  margin: 4px 0;
}
</style>
