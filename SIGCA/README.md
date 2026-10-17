# SIGCA – Sistema de Gestión y Control de Atención

## Descripción del proyecto

SIGCA es un sistema web desarrollado para facilitar la administración de pacientes, responsables, servicios, citas y pagos mediante una plataforma centralizada.

El proyecto se desarrolla en equipo y utiliza una arquitectura Full Stack, con un backend encargado de procesar las solicitudes, aplicar las reglas del sistema y comunicarse con la base de datos.

Actualmente se encuentran desarrollados y probados los módulos de pacientes, responsables y servicios. Los módulos de citas, pagos, autenticación y frontend se integrarán conforme avance el proyecto.

## Tecnologías utilizadas

- **Node.js:** entorno de ejecución del backend.
- **Express.js:** framework para desarrollar la API REST.
- **MongoDB:** base de datos NoSQL.
- **Mongoose:** herramienta para definir modelos y consultar MongoDB.
- **Postman:** pruebas de los endpoints.
- **Visual Studio Code:** entorno de desarrollo.
- **Vue.js:** tecnología prevista para el frontend.
- **JWT:** mecanismo previsto para autenticación.

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
│   └── app.js
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
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
MONGO_URI=mongodb://127.0.0.1:27017/sigca
JWT_SECRET=COLOCAR_UNA_CLAVE_SEGURA
```

El archivo `.env` no debe subirse al repositorio, ya que puede contener información privada.

### 4. Iniciar MongoDB

Verificar que el servicio de MongoDB se encuentre funcionando.

La base de datos utilizada es `sigca`.

### 5. Ejecutar el backend

Desde la carpeta `backend`, ejecutar:

```bash
npm run dev
```

### 6. Comprobar el funcionamiento

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

## Validaciones implementadas

Los módulos existentes incluyen validaciones para evitar registros incorrectos, como fechas de nacimiento futuras, duraciones inválidas y precios negativos.

También se prepararon dos middlewares para el módulo de citas:

- `validarPacienteCita.js`: comprueba que el paciente exista, esté activo y, si es menor de edad, tenga un responsable asociado.
- `validarServicioCita.js`: comprueba que el servicio exista y esté activo.

Estos middlewares están creados, pero todavía deben integrarse y probarse con las rutas del módulo de citas.

Ambos esperan recibir `pacienteId` y `servicioId`, respectivamente, en el cuerpo de la solicitud.

## Recomendaciones para integrar los módulos

Para mantener el funcionamiento del sistema, los integrantes deben considerar lo siguiente:

1. Utilizar los modelos existentes y evitar duplicarlos.
2. Mantener una sola conexión a MongoDB.
3. Registrar las nuevas rutas en `src/app.js`.
4. Utilizar los identificadores de MongoDB para relacionar los registros.
5. Validar pacientes y servicios antes de registrar citas.
6. Verificar la disponibilidad de los horarios para evitar reservas duplicadas.
7. Conservar el precio del servicio al momento de crear cada cita, aunque posteriormente cambie.
8. Integrar JWT y los permisos correspondientes antes de publicar el sistema.
9. Evitar subir archivos `.env`, carpetas `node_modules` o credenciales al repositorio.
10. Coordinar cualquier modificación a los modelos compartidos.

## Estado del proyecto

| Módulo | Estado |
|---|---|
| Conexión MongoDB | Funcional |
| Pacientes | Desarrollado y probado |
| Responsables | Desarrollado y probado |
| Servicios | Desarrollado y probado |
| Validaciones para citas | Creadas, pendientes de integración |
| Gestión de citas | Pendiente de integración |
| Pagos | Pendiente de integración |
| Autenticación y permisos | Pendiente de integración |
| Frontend Vue | Pendiente de integración |

## Trabajo colaborativo

El proyecto se desarrolla mediante un repositorio compartido en GitHub.

Cada integrante debe trabajar en el módulo asignado, respetando los modelos, las rutas y las convenciones existentes.

Antes de integrar nuevas funcionalidades, se recomienda comprobar que el servidor inicia correctamente y que los endpoints existentes continúan funcionando.

## Consideraciones finales

SIGCA busca mantener una estructura organizada que facilite el desarrollo colaborativo, las pruebas y el mantenimiento del sistema.

El backend actual constituye la base sobre la cual se integrarán los módulos restantes, procurando reutilizar componentes y mantener la consistencia de la información.
