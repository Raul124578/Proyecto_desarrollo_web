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
            placeholder="admin@kaslemal.edu.gt" 
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
        <p><strong>Credenciales de prueba:</strong></p>
        <p>admin@kaslemal.edu.gt | admin123</p>
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

const correo = ref('admin@kaslemal.edu.gt');
const password = ref('admin123');
const cargando = ref(false);
const errorLogin = ref('');

const ejecutarLogin = async () => {
  try {
    cargando.value = true;
    errorLogin.value = '';
    await authStore.iniciarSesion(correo.value, password.value);
    // Redirige al panel de pacientes una vez logueado
    router.push('/admin/pacientes');
  } catch (err) {
    errorLogin.value = 'Credenciales incorrectas o usuario inactivo.';
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
  max-width: 400px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.login-header {
  text-align: center;
  margin-bottom: 25px;
}

.logo-login {
  width: 55px;
  height: 55px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
}

.login-header h2 {
  font-size: 1.3rem;
  color: #0056b3;
}

.login-header p {
  color: #666;
  font-size: 0.9rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.campo label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
}

.campo input {
  padding: 9px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
}

.btn-entrar {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
}

.btn-entrar:hover:not(:disabled) {
  background-color: #0056b3;
}

.alerta-error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-bottom: 15px;
  text-align: center;
}

.demo-box {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #666;
  text-align: center;
}
</style>
