# SIGCA – Sistema de Gestión y Control de Atención

## Descripción del proyecto

SIGCA es un sistema web desarrollado para facilitar la administración de pacientes, responsables, servicios, citas y pagos mediante una plataforma centralizada.

El proyecto se desarrolla en equipo y utiliza una arquitectura Full Stack, con un backend encargado de procesar las solicitudes, aplicar las reglas del sistema y comunicarse con la base de datos.

El backend cuenta con los módulos de pacientes, responsables y servicios. La rama seguridad-finanzas incorpora autenticación JWT y roles, gestión de citas, pagos y caja diaria. La integración entre el frontend y estos nuevos endpoints se coordina con el equipo.

## Tecnologías utilizadas

- **Node.js:** entorno de ejecución del backend.
- **Express.js:** framework para desarrollar la API REST.
- **MongoDB:** base de datos NoSQL.
- **Mongoose:** herramienta para definir modelos y consultar MongoDB.
- **Vue 3:** tecnología utilizada en el frontend.
- **Vue Router:** navegación entre las vistas del frontend.
- **Pinia:** gestión del estado del frontend.
- **JWT:** autenticación de usuarios y protección de rutas.
- **bcryptjs:** cifrado de contraseñas.
- **Postman:** pruebas de los endpoints.
- **Visual Studio Code:** entorno de desarrollo.

## Estructura del backend

```text
backend/
├── src/
│   ├── config/
|       ├── db.js
│   ├── controllers/
│   │   ├── pacienteController.js
│   │   ├── responsableController.js
│   │   └── servicioController.js
│   ├── middlewares/
│   │   ├── validarPacienteCita.js
│   │   └── validarServicioCita.js
│   ├── models/
│   │   ├── Paciente.js
│   │   ├── Responsable.js
│   │   └── Servicio.js
│   ├── routes/
│   │   ├── pacienteRoutes.js
│   │   ├── responsableRoutes.js
│   │   └── servicioRoutes.js
│   ├── seed.js
│   └── app.js
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

## Estructura del frontend

```text
frontend/
├── public/
│   └── logo.jpg
├── src/
│   ├── components/
│   │   ├── Footer.vue
│   │   └── Navbar.vue
│   ├── router/
│   │   └── index.js
│   ├── services/
│   │   └── api.js
│   ├── stores/
│   │   ├── centro.js
│   │   └── sesion.js
│   ├── views/
│   │   ├── CitasCalendarioView.vue
│   │   ├── ContactoView.vue
│   │   ├── HomeView.vue
│   │   ├── HorariosView.vue
│   │   ├── LoginView.vue
│   │   ├── PacientesView.vue
│   │   ├── ResponsablesView.vue
│   │   ├── ServiciosView.vue
│   │   └── SolicitarCitaView.vue
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── vite.config.js
└── package.json
```

## Requisitos para ejecutar el proyecto

Antes de iniciar, es necesario contar con:

- Node.js y npm.
- MongoDB instalado y funcionando.
- Visual Studio Code o un editor equivalente.
- Postman, opcional para realizar pruebas.

## Instalación y configuración

### 1. Obtener el proyecto

Descargar el repositorio desde GitHub y abrirlo en Visual Studio Code.

### 2. Instalar las dependencias

Abrir una terminal dentro de la carpeta `backend` y ejecutar:

```bash
npm install
```

### 3. Configurar las variables de entorno

Crear un archivo llamado `.env` dentro de `backend`, tomando como referencia `.env.example`.

Ejemplo para desarrollo local:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/sigca?replicaSet=rs0
JWT_SECRET=COLOCAR_UNA_CLAVE_SEGURA
```

El archivo `.env` no debe subirse al repositorio, ya que puede contener información privada.

### 4. Iniciar MongoDB

Verificar que MongoDB esté funcionando como un replica set de un solo nodo llamado `rs0`. Es necesario porque los módulos de pagos y caja usan transacciones.

Si es la primera configuración, inicia MongoDB con el replica set `rs0`. Después, en `mongosh`, ejecuta una sola vez:

```javascript
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "127.0.0.1:27017" }]
})
```

Para comprobarlo, ejecuta `rs.status()`. Si el replica set ya está inicializado, no vuelvas a ejecutar `rs.initiate`.

La base de datos utilizada es `sigca`.

### 5. Ejecutar el backend

Desde la carpeta `backend`, ejecutar:

```bash
npm run dev
```

### 6. Ejecutar el frontend (Vue 3 + Vite)

Abrir una segunda terminal dentro de la carpeta `frontend` y ejecutar:

```bash
npm install
npm run dev
```

El portal público y el panel administrativo estarán disponibles en:
```text
http://localhost:5173
```

### 7. Cargar datos de prueba (Seed)

Para cargar los servicios iniciales del centro K'aslemal en MongoDB, ejecutar desde la carpeta `backend`:

```bash
node src/seed.js
```

### 8. Comprobar el funcionamiento

Abrir en el navegador o Postman:

```text
GET http://localhost:3000/api/status
```

Este endpoint permite comprobar que el servidor está respondiendo.

## API REST disponibles

### Pacientes

| Método | Endpoint | Función |
|---|---|---|
| GET | `/api/pacientes` | Consultar pacientes |
| GET | `/api/pacientes/:id` | Consultar un paciente |
| POST | `/api/pacientes` | Registrar un paciente |
| PUT | `/api/pacientes/:id` | Actualizar información |
| PATCH | `/api/pacientes/:id/estado` | Cambiar estado |

El módulo permite almacenar datos personales, fecha de nacimiento, fotografía como referencia de texto, observaciones y responsables asociados.

La edad se calcula automáticamente a partir de la fecha de nacimiento.

### Responsables

| Método | Endpoint | Función |
|---|---|---|
| GET | `/api/responsables` | Consultar responsables |
| GET | `/api/responsables/:id` | Consultar un responsable |
| POST | `/api/responsables` | Registrar un responsable |
| PUT | `/api/responsables/:id` | Actualizar información |
| POST | `/api/responsables/:id/pacientes` | Asociar pacientes |
| GET | `/api/responsables/:id/pacientes` | Consultar pacientes asociados |

Un responsable puede estar relacionado con varios pacientes.

### Servicios

| Método | Endpoint | Función |
|---|---|---|
| GET | `/api/servicios` | Consultar servicios |
| GET | `/api/servicios/:id` | Consultar un servicio |
| POST | `/api/servicios` | Registrar un servicio |
| PUT | `/api/servicios/:id` | Actualizar información |
| PATCH | `/api/servicios/:id/estado` | Cambiar estado |

También es posible consultar servicios activos mediante:

```text
GET /api/servicios?estado=ACTIVO
```

Los servicios incluyen nombre, descripción, duración, precio, imagen y estado.

Internamente, los precios se almacenan en el campo `precioCentavos` para evitar problemas de precisión con valores monetarios.

### Autenticación y módulos administrativos

| Recurso | Prefijo | Función |
|---|---|---|
| Autenticación | `/api/auth` | Inicio y consulta de sesión. |
| Usuarios | `/api/usuarios` | Gestión de usuarios y roles. |
| Horarios | `/api/horarios` | Gestión de horarios disponibles. |
| Citas | `/api/citas` | Gestión de citas. |
| Caja diaria | `/api/cajas` | Operaciones de caja diaria. |
| Pagos | `/api/pagos` | Registro y consulta de pagos. |

## Validaciones implementadas

Los modelos validan campos requeridos y reglas como fechas de nacimiento no futuras, duraciones válidas y precios no negativos.

En la creación de citas, `validarPacienteCita.js` comprueba que el paciente exista y esté activo y que, si es menor de edad, tenga un responsable asociado. `validarServicioCita.js` comprueba que el servicio exista y esté activo. Ambos middlewares están integrados en la ruta de creación de citas y reciben `pacienteId` y `servicioId` en el cuerpo de la solicitud.

## Recomendaciones para integrar los módulos

Para mantener el funcionamiento del sistema, los integrantes deben considerar lo siguiente:

1. Utilizar los modelos existentes y evitar duplicarlos.
2. Mantener una sola conexión a MongoDB.
3. Registrar las nuevas rutas en `src/app.js`.
4. Utilizar los identificadores de MongoDB para relacionar los registros.
5. Validar pacientes y servicios antes de registrar citas.
6. Verificar la disponibilidad de los horarios para evitar reservas duplicadas.
7. Conservar el precio del servicio al momento de crear cada cita, aunque posteriormente cambie.
8. Verificar la integración del frontend con JWT y los permisos antes de publicar el sistema.
9. Evitar subir archivos `.env`, carpetas `node_modules` o credenciales al repositorio.
10. Coordinar cualquier modificación a los modelos compartidos.

## Estado del proyecto

| Módulo | Estado |
|---|---|
| Conexión MongoDB | Funcional; usa el replica set `rs0` para las transacciones. |
| Pacientes, responsables y servicios | Desarrollados y probados. |
| Validaciones para citas | Integradas en las rutas de citas. |
| Gestión de citas y estados | Implementada en backend; incluida en `seguridad-finanzas`. |
| Autenticación JWT y roles | Implementados en backend; incluidos en `seguridad-finanzas`. |
| Pagos y caja diaria | Implementados en backend; incluidos en `seguridad-finanzas`. |
| Frontend Vue (K'aslemal) | Desarrollado; la integración con los nuevos endpoints se coordina con el equipo. |


## Trabajo colaborativo
El proyecto se desarrolla mediante un repositorio compartido en GitHub.

Cada integrante debe trabajar en el módulo asignado, respetando los modelos, las rutas y las convenciones existentes.

Antes de integrar nuevas funcionalidades, se recomienda comprobar que el servidor inicia correctamente y que los endpoints existentes continúan funcionando.

## Consideraciones finales

SIGCA busca mantener una estructura organizada que facilite el desarrollo colaborativo, las pruebas y el mantenimiento del sistema.

El backend de SIGCA incluye los módulos de pacientes, responsables, servicios, citas, autenticación, pagos y caja diaria. La integración de los nuevos endpoints con el frontend se coordina con el equipo.
