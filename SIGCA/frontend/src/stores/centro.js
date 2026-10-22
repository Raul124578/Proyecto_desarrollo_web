import { defineStore } from 'pinia';

export const useCentroStore = defineStore('centro', {
    state: () => ({
        nombre: "K'aslemal",
        subtitulo: "Centro de Atención Psicológica y Estimulación Auditiva Verbal",
        logoUrl: "/logo.jpg",
        mision: "Brindar servicios de atención psicológica y estimulación auditiva-verbal a personas que requieren apoyo para su bienestar y desarrollo, mediante la atención profesional, humana y comprometida de especialistas que ofrecen lo mejor de sus conocimientos y capacidades para mejorar su calidad de vida.",
        vision: "Ser un centro de referencia a nivel nacional, con presencia en toda la República de Guatemala, ampliando el acceso a servicios de atención psicológica y estimulación auditiva-verbal para todas las personas que los necesiten, mediante profesionales comprometidos con el bienestar y desarrollo de la población."
    }),
    actions: {
        actualizarDatos(nuevosDatos) {
            if (nuevosDatos.nombre) this.nombre = nuevosDatos.nombre;
            if (nuevosDatos.logoUrl) this.logoUrl = nuevosDatos.logoUrl;
            if (nuevosDatos.mision) this.mision = nuevosDatos.mision;
            if (nuevosDatos.vision) this.vision = nuevosDatos.vision;
        }
    }
});
