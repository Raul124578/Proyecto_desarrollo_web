import axios from 'axios';

// Instancia centralizada de Axios apuntando al backend de Express
const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para inyectar automáticamente el token JWT en las peticiones
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sigca_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor de respuesta para limpiar sesión si el token expira o es inválido
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token vencido o inválido
            localStorage.removeItem('sigca_token');
            localStorage.removeItem('sigca_user');
        }
        return Promise.reject(error);
    }
);

export default api;
