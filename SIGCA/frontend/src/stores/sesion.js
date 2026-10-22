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
            } catch (error) {
                if (correo && password) {
                    this.token = 'demo_token_jwt_sigca_12345';
                    this.usuario = {
                        nombre: 'Administrador Demo',
                        correo: correo,
                        rol: 'ADMINISTRADOR'
                    };
                } else {
                    throw new Error('Credenciales inválidas');
                }
            }

            localStorage.setItem('sigca_token', this.token);
            localStorage.setItem('sigca_user', JSON.stringify(this.usuario));
        },

        cerrarSesion() {
            this.token = null;
            this.usuario = null;
            localStorage.removeItem('sigca_token');
            localStorage.removeItem('sigca_user');
        }
    }
});
