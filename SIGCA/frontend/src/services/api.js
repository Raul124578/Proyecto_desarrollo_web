import axios from 'axios';

// Instancia centralizada de Axios apuntando al backend de Express
const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Envía el token en las solicitudes que requieren autenticación.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sigca_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
