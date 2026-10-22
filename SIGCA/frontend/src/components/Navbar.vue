<template>
  <header class="navbar">
    <div class="navbar-brand">
      <router-link to="/" style="display: flex; align-items: center; gap: 10px; text-decoration: none;">
        <img :src="centroStore.logoUrl" alt="Logo" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
        <span class="brand-text"><strong>{{ centroStore.nombre }}</strong> | Centro de Atención</span>
      </router-link>
    </div>

    <!-- NAVEGACIÓN -->
    <nav class="navbar-links">
      <!-- 1. Enlaces Públicos (Siempre visibles para visitantes) -->
      <router-link to="/">Inicio</router-link>
      <router-link to="/servicios">Servicios</router-link>
      <router-link to="/horarios">Horarios</router-link>
      <router-link to="/contacto">Contacto</router-link>

      <!-- 2. Menú de Administración (SOLO si inició sesión) -->
      <template v-if="authStore.estaAutenticado">
        <router-link to="/admin/pacientes" class="link-admin">Pacientes</router-link>
        <router-link to="/admin/responsables" class="link-admin">Responsables</router-link>
        <router-link to="/admin/citas" class="link-admin">Calendario</router-link>

        <span class="user-badge">👤 {{ authStore.nombreUsuario }}</span>
        <button @click="salir" class="btn-logout">Salir</button>
      </template>

      <!-- 3. Botones para visitante no logueado -->
      <template v-else>
        <router-link to="/solicitar-cita" class="btn-cita">Solicitar Cita</router-link>
        <router-link to="/login" class="btn-login">Ingresar</router-link>
      </template>
    </nav>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useCentroStore } from '../stores/centro';
import { useAuthStore } from '../stores/sesion';

const router = useRouter();
const centroStore = useCentroStore();
const authStore = useAuthStore();

const salir = () => {
  authStore.cerrarSesion();
  router.push('/');
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 25px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
}

.brand-text {
  color: #0056b3;
  font-size: 1.15rem;
}

.navbar-links {
  display: flex;
  gap: 15px;
  align-items: center;
}

.navbar-links a {
  color: #555;
  font-weight: 500;
  text-decoration: none;
}

.navbar-links a.router-link-active {
  color: #0056b3;
  font-weight: bold;
}

.link-admin {
  background-color: #f1f3f5;
  padding: 5px 10px;
  border-radius: 4px;
}

.btn-cita {
  background-color: #007bff;
  color: #ffffff !important;
  padding: 6px 12px;
  border-radius: 4px;
}

.btn-login {
  border: 1px solid #6c757d;
  padding: 5px 12px;
  border-radius: 4px;
}

.user-badge {
  font-size: 0.85rem;
  color: #28a745;
  font-weight: bold;
  background-color: #e8f5e9;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-logout {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-logout:hover {
  background-color: #bd2130;
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
    text-align: center;
  }

  .navbar-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
}
</style>

