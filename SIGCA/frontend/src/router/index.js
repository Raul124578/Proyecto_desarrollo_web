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
import UsuariosView from '../views/UsuariosView.vue';
import CajaView from '../views/CajaView.vue';
import PagosView from '../views/PagosView.vue';
import { useAuthStore } from '../stores/sesion';

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
        component: PacientesView,
        meta: {
            requiresAuth: true,
            roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
        }
    },
    {
        path: '/admin/responsables',
        name: 'Responsables',
        component: ResponsablesView,
        meta: {
            requiresAuth: true,
            roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
        }
    },
    {
        path: '/admin/usuarios',
        name: 'Usuarios',
        component: UsuariosView,
        meta: {
            requiresAuth: true,
            roles: ['ADMINISTRADOR']
        }
    },
    {
        path: '/admin/citas',
        name: 'Citas',
        component: CitasCalendarioView,
        meta: {
            requiresAuth: true,
            roles: ['ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL']
        }
    },
    {
        path: '/admin/pagos',
        name: 'Pagos',
        component: PagosView,
        meta: {
            requiresAuth: true,
            roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
        }
    },
    {
        path: '/admin/caja',
        name: 'Caja',
        component: CajaView,
        meta: {
            requiresAuth: true,
            roles: ['ADMINISTRADOR', 'RECEPCIONISTA']
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.estaAutenticado) {
        return { name: 'Login' };
    }

    if (to.meta.roles && !to.meta.roles.includes(authStore.usuario?.rol)) {
        return { name: 'Home' };
    }

    return true;
});

export default router;
