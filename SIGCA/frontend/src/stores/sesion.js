import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        usuario: JSON.parse(localStorage.getItem('sigca_user')) || null,
        token: localStorage.getItem('sigca_token') || null
    }),
    getters: {
        estaAutenticado: (state) => !!state.token,
        esAdmin: (state) => state.usuario?.rol === 'ADMINISTRADOR',
        nombreUsuario: (state) => state.usuario?.nombre || 'Usuario'
    },
    actions: {
        async iniciarSesion(correo, password) {
            try {
                const res = await api.post('/auth/login', { correo, password });
                this.token = res.data.token;
                this.usuario = res.data.usuario;
                localStorage.setItem('sigca_token', this.token);
                localStorage.setItem('sigca_user', JSON.stringify(this.usuario));
            } catch (error) {
                this.cerrarSesion();
                throw new Error(error.response?.data?.mensaje || 'Credenciales inválidas');
            }
        },

        cerrarSesion() {
            this.token = null;
            this.usuario = null;
            localStorage.removeItem('sigca_token');
            localStorage.removeItem('sigca_user');
        }
    }
});
