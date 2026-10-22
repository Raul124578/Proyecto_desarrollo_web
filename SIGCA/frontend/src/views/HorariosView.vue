<template>
  <div class="horarios-container">
    <h2>Horarios de Atención</h2>
    <p class="subtitulo">Conoce nuestras jornadas de atención presencial y consultas programadas</p>

    <div class="tabla-responsive">
      <table class="tabla-horarios">
        <thead>
          <tr>
            <th>Día</th>
            <th>Horario Matutino</th>
            <th>Horario Vespertino</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in horarios" :key="index">
            <td><strong>{{ item.dia }}</strong></td>
            <td>{{ item.inicioManana }} - {{ item.finManana }}</td>
            <td>{{ item.inicioTarde }} - {{ item.finTarde }}</td>
            <td>
              <span :class="['badge', item.abierto ? 'badge-abierto' : 'badge-cerrado']">
                {{ item.abierto ? 'Abierto' : 'Cerrado' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Nota adicional -->
    <div class="nota-horarios">
      <p><strong>Nota importante:</strong> Las citas de evaluación y estimulación auditiva verbal se atienden previa cita confirmada.</p>
      <router-link to="/solicitar-cita" class="btn-solicitar">Solicitar una Cita Ahora</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const horarios = ref([
  { dia: 'Lunes', inicioManana: '08:00', finManana: '12:00', inicioTarde: '14:00', finTarde: '18:00', abierto: true },
  { dia: 'Martes', inicioManana: '08:00', finManana: '12:00', inicioTarde: '14:00', finTarde: '18:00', abierto: true },
  { dia: 'Miércoles', inicioManana: '08:00', finManana: '12:00', inicioTarde: '14:00', finTarde: '18:00', abierto: true },
  { dia: 'Jueves', inicioManana: '08:00', finManana: '12:00', inicioTarde: '14:00', finTarde: '18:00', abierto: true },
  { dia: 'Viernes', inicioManana: '08:00', finManana: '12:00', inicioTarde: '14:00', finTarde: '17:00', abierto: true },
  { dia: 'Sábado', inicioManana: '08:00', finManana: '12:30', inicioTarde: 'Sin atención', finTarde: '', abierto: true },
  { dia: 'Domingo', inicioManana: '-', finManana: '-', inicioTarde: '-', finTarde: '-', abierto: false }
]);
</script>

<style scoped>
.horarios-container {
  max-width: 850px;
  margin: 0 auto;
  padding: 30px 20px;
}

h2 {
  text-align: center;
  color: #333;
}

.subtitulo {
  text-align: center;
  color: #666;
  margin-bottom: 25px;
}

.tabla-responsive {
  overflow-x: auto;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.tabla-horarios {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.tabla-horarios th, .tabla-horarios td {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.tabla-horarios th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.badge-abierto {
  background-color: #d4edda;
  color: #155724;
}

.badge-cerrado {
  background-color: #f8d7da;
  color: #721c24;
}

.nota-horarios {
  margin-top: 30px;
  background-color: #e9f5ff;
  border-left: 4px solid #007bff;
  padding: 15px 20px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.btn-solicitar {
  background-color: #007bff;
  color: #ffffff;
  padding: 8px 15px;
  border-radius: 4px;
  font-weight: 500;
  text-decoration: none;
}

.btn-solicitar:hover {
  background-color: #0056b3;
}
</style>
