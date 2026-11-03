import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ServiciosView from '../views/ServiciosView.vue';
import HorariosView from '../views/HorariosView.vue';
import ContactoView from '../views/ContactoView.vue';
import SolicitudCitaView from '../views/SolicitarCitaView.vue';
import PacientesView from '../views/PacientesView.vue';
import ResponsablesView from '../views/ResponsablesView.vue';
import LoginView from '../views/LoginView.vue';
import CitasCalendarioView from '../views/CitasCalendarioView.vue';
import CajaView from '../views/CajaView.vue';
import PagosView from '../views/PagosView.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomeView
    },
    {
        path: '/servicios',
        name: 'Servicios',
        component: ServiciosView
    },
    {
        path: '/horarios',
        name: 'Horarios',
        component: HorariosView
    },
    {
        path: '/contacto',
        name: 'Contacto',
        component: ContactoView
    },
    {
        path: '/solicitar-cita',
        name: 'SolicitarCita',
        component: SolicitudCitaView
    },
    {
        path: '/login',
        name: 'Login',
        component: LoginView
    },
    {
        path: '/admin/pacientes',
        name: 'Pacientes',
        component: PacientesView
    },
    {
        path: '/admin/responsables',
        name: 'Responsables',
        component: ResponsablesView
    },
    {
        path: '/admin/citas',
        name: 'Citas',
        component: CitasCalendarioView
    },
    {
        path: '/admin/pagos',
        name: 'Pagos',
        component: PagosView
    },
    {
        path: '/admin/caja',
        name: 'Caja',
        component: CajaView
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
