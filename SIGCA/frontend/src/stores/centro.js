import { defineStore } from 'pinia';
import api from '../services/api';

export const useCentroStore = defineStore('centro', {
    state: () => ({
        nombre: "K'aslemal",
        subtitulo: "Centro de Atención Psicológica y Estimulación Auditiva Verbal",
        lema: "Acompañando procesos, transformando vidas",
        logoUrl: "/logo.jpg",
        mision: "Brindar servicios de atención psicológica y estimulación auditiva-verbal a personas que requieren apoyo para su bienestar y desarrollo.",
        vision: "Ser un centro de referencia a nivel nacional, con presencia en toda la República de Guatemala.",
        valores: ["Empatía", "Ética profesional", "Compromiso familiar", "Excelencia terapéutica"],
        contacto: {
            telefono: "2200-0000",
            correo: "info@kaslemal.edu.gt",
            direccion: "Ciudad de Guatemala, Guatemala",
            horarioAtencion: "Lunes a Viernes de 8:00 a 18:00"
        },
        cargado: false
    }),
    actions: {
        async cargarDesdeBD() {
            try {
                const res = await api.get('/institucional');
                if (res.data) {
                    if (res.data.institucion) this.nombre = res.data.institucion;
                    if (res.data.lema) this.lema = res.data.lema;
                    if (res.data.logoUrl) this.logoUrl = res.data.logoUrl;
                    if (res.data.mision) this.mision = res.data.mision;
                    if (res.data.vision) this.vision = res.data.vision;
                    if (res.data.valores) this.valores = res.data.valores;
                    if (res.data.contacto) this.contacto = res.data.contacto;
                    this.cargado = true;
                }
            } catch (err) {
                console.warn('No se pudo cargar contenido institucional desde la BD, usando predeterminado:', err);
            }
        },
        actualizarDatos(nuevosDatos) {
            if (nuevosDatos.nombre) this.nombre = nuevosDatos.nombre;
            if (nuevosDatos.logoUrl) this.logoUrl = nuevosDatos.logoUrl;
            if (nuevosDatos.mision) this.mision = nuevosDatos.mision;
            if (nuevosDatos.vision) this.vision = nuevosDatos.vision;
        }
    }
});
