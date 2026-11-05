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
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── cajaController.js
│   │   ├── citaController.js
│   │   ├── citaEstadoController.js
│   │   ├── citaReprogramacionController.js
│   │   ├── horarioController.js
│   │   ├── pacienteController.js
│   │   ├── pagoController.js
│   │   ├── responsableController.js
│   │   ├── servicioController.js
│   │   └── usuarioController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── validarHorarioCita.js
│   │   ├── validarPacienteCita.js
│   │   ├── validarProfesionalCita.js
│   │   └── validarServicioCita.js
│   ├── models/
│   │   ├── Caja.js
│   │   ├── Cita.js
│   │   ├── Horario.js
│   │   ├── Paciente.js
│   │   ├── Pago.js
│   │   ├── Responsable.js
│   │   ├── Servicio.js
│   │   └── Usuario.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── cajaRoutes.js
│   │   ├── citaRoutes.js
│   │   ├── horarioRoutes.js
│   │   ├── pacienteRoutes.js
│   │   ├── pagoRoutes.js
│   │   ├── responsableRoutes.js
│   │   ├── servicioRoutes.js
│   │   └── usuarioRoutes.js
│   ├── app.js
│   ├── crearAdmin.js
│   └── seed.js
├── server.js
├── package.json
├── package-lock.json
├── .env.example
└── .gitignore
```
### Cargar servicios de prueba

Desde la carpeta `backend`, ejecuta:

```bash
node src/seed.js
```
Nota: Este script elimina los servicios existentes y carga cinco servicios de prueba. Úsalo solo con la base de datos local de pruebas.

## Estructura del frontend

```text
frontend/
├── public/
│   └── logo.jpg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Footer.vue
│   │   ├── HelloWorld.vue
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
│   │   ├── SolicitarCitaView.vue
│   │   └── UsuariosView.vue
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── vite.config.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

## Requisitos para ejecutar el proyecto

Antes de iniciar, es necesario contar con:

- Node.js y npm.
- MongoDB instalado y funcionando.
- Visual Studio Code o un editor equivalente.
- Postman, opcional para realizar pruebas.

## Instalación y configuración

## Ejecución de datos de prueba

Para cargar los datos iniciales del sistema SIGCA en MongoDB, realizar los siguientes pasos:


### 1. Iniciar MongoDB

Verificar que el servicio MongoDB esté en ejecución y que la replica set `rs0` esté configurado.

### 2. Configurar la conexión

Verificar que el archivo `backend/.env` contenga la conexión:

```env
MONGO_URI=mongodb://127.0.0.1:27017/sigca?replicaSet=rs0
```

### 3. Instalar las dependencias del backend

```bash
cd backend
npm install
```

### 4. Ejecutar el archivo de datos de prueba

```bash
node src/seed.js
```

Este comando carga los servicios de prueba en la base de datos `sigca`.

### 5. Verificar los datos

Abrir MongoDB Compass y conectarse utilizando:

```text
mongodb://127.0.0.1:27017/sigca?replicaSet=rs0
```

Verificar que los registros aparezcan en la colección correspondiente.

### 6. Iniciar el backend

Desde la carpeta `backend`:

```bash
npm run dev
```

### 7. Iniciar el frontend

Abrir otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Acceder a [http://localhost:5173](http://localhost:5173) para utilizar el sistema.
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

## Credenciales de demostración

Cuentas disponibles para probar los roles en el entorno local:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@sigca.test` | La definida en `ADMIN_PASSWORD` dentro de `backend/.env` |
| Recepcionista | `prueba2026@sigca.test` | `SigcaPrueba2026!` |
| Profesional | `profesional.demo@sigca.test` | `ProfesionalDemo2026!` |

Estas cuentas son solo para pruebas locales. No subas el archivo `backend/.env` al repositorio ni uses estas cuentas en producción.

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


## Trabajo colaborativo
El proyecto se desarrolla mediante un repositorio compartido en GitHub.

Cada integrante debe trabajar en el módulo asignado, respetando los modelos, las rutas y las convenciones existentes.

Antes de integrar nuevas funcionalidades, se recomienda comprobar que el servidor inicia correctamente y que los endpoints existentes continúan funcionando.

## Integrantes y distribución de responsabilidades

| Integrante | Nombre | Carné | Responsabilidades |
|---|---|---|---|
| 1 | Stephanie A. | 5190-16-18341 |Backend y base de datos:modelos MongoDB,API REST,pacientes,responsables,servicios.Portal público y contenido institucional (RF-01 y RF-12). |
| 2 | Miguel A. | 1990-23-8264 |Frontend e integración:vue.js,vue Router,pinia,Portal públicoformularios,calendario, integración con API. Solicitudes de citas y materiales (RF-06 y RF-09). |
| 3 | Humberto T. | 1590-20-14103 |Seguridad y gestión financiera:autenticación,roles,gestión de citas,pagos,caja diaria,validaciones.Seguridad, usuarios, validaciones de citas, pagos y caja diaria (RF-02 y RF-13). También documenta el README y las credenciales de demostración. |

## Consideraciones finales

SIGCA busca mantener una estructura organizada que facilite el desarrollo colaborativo, las pruebas y el mantenimiento del sistema.

El backend de SIGCA incluye los módulos de pacientes, responsables, servicios, citas, autenticación, pagos y caja diaria. La integración de los nuevos endpoints con el frontend se coordina con el equipo.
