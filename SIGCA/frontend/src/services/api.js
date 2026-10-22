import axios from 'axios';

// Instancia centralizada de Axios apuntando al backend de Express
const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;
