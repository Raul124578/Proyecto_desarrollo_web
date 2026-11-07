
require('dotenv').config();

const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');

const Usuario = require('./models/Usuario');
const Responsable = require('./models/Responsable');
const Paciente = require('./models/Paciente');
const Servicio = require('./models/Servicio');
const Horario = require('./models/Horario');
const Cita = require('./models/Cita');
const Caja = require('./models/Caja');
const Pago = require('./models/Pago');
const ContenidoInstitucional = require('./models/ContenidoInstitucional');

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sigca';

const CLAVE_DEMO = 'Password123*';

async function cargarDatos() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB');

    const db = mongoose.connection.db;

    // ==================================================
    // 1. LIMPIEZA DE DATOS DE DEMOSTRACIÓN
    // ==================================================
    // ATENCIÓN:
    // Se eliminan los datos de prueba anteriores.
    // NO se elimina el contenido institucional.

    console.log('Reiniciando datos de demostración...');

    await Pago.deleteMany({});
    await Caja.deleteMany({});
    await Cita.deleteMany({});
    await Horario.deleteMany({});
    await Paciente.deleteMany({});
    await Responsable.deleteMany({});
    await Servicio.deleteMany({});
    await Usuario.deleteMany({});

    await db.collection('materiales').deleteMany({});
    await db.collection('solicitudes_citas').deleteMany({});

    // NO ejecutar:
    // await db.collection('contenido_institucional').deleteMany({});

    // ==================================================
    // 2. USUARIOS
    // 1 administrador, 2 recepcionistas, 3 profesionales
    // ==================================================

    console.log('Creando usuarios...');

    const configuracionUsuarios = [
      ['Admin General SIGCA', 'admin@sigca.test', 'ADMINISTRADOR'],
      ['Recepcionista Mañana', 'recepcion1@sigca.test', 'RECEPCIONISTA'],
      ['Recepcionista Tarde', 'recepcion2@sigca.test', 'RECEPCIONISTA'],
      ['Dr. Carlos Mendoza', 'profesional1@sigca.test', 'PROFESIONAL'],
      ['Dra. Ana Lucía Morales', 'profesional2@sigca.test', 'PROFESIONAL'],
      ['Lic. Roberto Gómez', 'profesional3@sigca.test', 'PROFESIONAL']
    ];

    const usuarios = [];

    for (const [nombre, correo, rol] of configuracionUsuarios) {
      const usuario = new Usuario({
        nombre,
        correo,
        password: CLAVE_DEMO,
        rol,
        estado: 'ACTIVO'
      });

      await usuario.save();
      usuarios.push(usuario);
    }

    const [
      admin,
      recep1,
      recep2,
      prof1,
      prof2,
      prof3
    ] = usuarios;

    // ==================================================
    // 3. HORARIOS DE ATENCIÓN
    // ==================================================

    console.log('Creando horarios...');

    const horarios = [];

    for (let dia = 0; dia <= 6; dia++) {
      if (dia === 0) {
        horarios.push({
          diaSemana: dia,
          activo: false,
          tramos: []
        });
      } else if (dia === 6) {
        horarios.push({
          diaSemana: dia,
          activo: true,
          tramos: [
            { inicioMinuto: 480, finMinuto: 720 }
          ]
        });
      } else {
        horarios.push({
          diaSemana: dia,
          activo: true,
          tramos: [
            { inicioMinuto: 480, finMinuto: 720 },
            { inicioMinuto: 780, finMinuto: 1020 }
          ]
        });
      }
    }

    await Horario.insertMany(horarios);

    // ==================================================
    // 4. SERVICIOS
    // Se utilizan los íconos SVG del frontend.
    // No se asignan fotografías externas.
    // ==================================================

    console.log('Creando servicios...');

    const servicios = await Servicio.insertMany([
      {
        nombre: 'Atención Psicológica Individual',
        descripcion: 'Evaluación y acompañamiento psicológico personalizado.',
        duracionMinutos: 45,
        precioCentavos: 25000,
        imagen: '',
        icono: 'seguimiento',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Estimulación Auditiva Verbal',
        descripcion: 'Terapia para desarrollar habilidades auditivas y del habla.',
        duracionMinutos: 60,
        precioCentavos: 30000,
        imagen: '',
        icono: 'auditiva',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Terapia de Lenguaje y Comunicación',
        descripcion: 'Apoyo para mejorar pronunciación y comunicación.',
        duracionMinutos: 45,
        precioCentavos: 20000,
        imagen: '',
        icono: 'lenguaje',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Escuela para Padres y Orientación Familiar',
        descripcion: 'Orientación y acompañamiento para las familias.',
        duracionMinutos: 60,
        precioCentavos: 17500,
        imagen: '',
        icono: 'familia',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Evaluación Psicológica y Diagnóstico',
        descripcion: 'Evaluación integral con pruebas e informe.',
        duracionMinutos: 90,
        precioCentavos: 45000,
        imagen: '',
        icono: 'seguimiento',
        estado: 'ACTIVO'
      }
    ]);

    // ==================================================
    // 5. RESPONSABLES
    // ==================================================

    console.log('Creando responsables...');

    const responsables = await Responsable.insertMany([
      {
        nombres: 'María Elena',
        apellidos: 'López Morales',
        parentesco: 'MADRE',
        telefono: '55443322',
        correo: 'maria.lopez@correo.test',
        direccion: 'Zona 1, Guatemala'
      },
      {
        nombres: 'Juan José',
        apellidos: 'García Pérez',
        parentesco: 'PADRE',
        telefono: '44332211',
        correo: 'juan.garcia@correo.test',
        direccion: 'Zona 7, Mixco'
      },
      {
        nombres: 'Silvia Lorena',
        apellidos: 'Castillo Ramos',
        parentesco: 'MADRE',
        telefono: '55667788',
        correo: 'silvia.castillo@correo.test',
        direccion: 'Zona 11, Guatemala'
      },
      {
        nombres: 'Héctor Rolando',
        apellidos: 'Méndez Aguilar',
        parentesco: 'TUTOR',
        telefono: '44556677',
        correo: 'hector.mendez@correo.test',
        direccion: 'Santa Catarina Pinula'
      },
      {
        nombres: 'Claudia Patricia',
        apellidos: 'Flores Estrada',
        parentesco: 'MADRE',
        telefono: '55112233',
        correo: 'claudia.flores@correo.test',
        direccion: 'Villa Nueva'
      }
    ]);

    // ==================================================
    // 6. PACIENTES
    // 6 menores y 4 adultos
    // ==================================================

    console.log('Creando pacientes...');

    const datosPacientes = [
      ['Mateo Alejandro', 'López Morales', '2018-05-14', 'MASCULINO', 0],
      ['Sofía Valentina', 'López Morales', '2020-09-20', 'FEMENINO', 0],
      ['Lucas Daniel', 'García Pérez', '2017-02-11', 'MASCULINO', 1],
      ['Camila Renée', 'Castillo Ramos', '2019-11-03', 'FEMENINO', 2],
      ['Diego Fernando', 'Méndez Aguilar', '2016-07-25', 'MASCULINO', 3],
      ['Andrea Nicole', 'Flores Estrada', '2021-04-18', 'FEMENINO', 4],
      ['Esteban Andrés', 'Vásquez Quiñónez', '1998-03-12', 'MASCULINO', null],
      ['Valeria Beatriz', 'Navarro Cifuentes', '1995-10-30', 'FEMENINO', null],
      ['Rodrigo Javier', 'Salazar Fuentes', '1990-08-15', 'MASCULINO', null],
      ['Mariana Isabel', 'Ortiz Herrera', '1992-12-05', 'FEMENINO', null]
    ];

    const pacientes = await Paciente.insertMany(
      datosPacientes.map((p, indice) => ({
        nombres: p[0],
        apellidos: p[1],
        fechaNacimiento: new Date(`${p[2]}T00:00:00.000Z`),
        sexo: p[3],
        telefono: p[4] !== null
          ? responsables[p[4]].telefono
          : `4400000${indice}`,
        direccion: p[4] !== null
          ? responsables[p[4]].direccion
          : 'Ciudad de Guatemala',
        observaciones: 'Paciente de demostración SIGCA.',
        estado: 'ACTIVO',
        responsables: p[4] !== null
          ? [responsables[p[4]]._id]
          : []
      }))
    );

    for (let i = 0; i < responsables.length; i++) {
      const relacionados = pacientes.filter(p =>
        p.responsables.some(id =>
          id.toString() === responsables[i]._id.toString()
        )
      );

      await Responsable.findByIdAndUpdate(
        responsables[i]._id,
        {
          $set: {
            pacientes: relacionados.map(p => p._id)
          }
        }
      );
    }

    // ==================================================
    // 7. CITAS
    // 15 citas para los tres profesionales
    // ==================================================

    console.log('Creando citas...');

    function fechaRelativa(dias, hora, minuto = 0) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + dias);
      fecha.setHours(hora, minuto, 0, 0);
      return fecha;
    }

    // paciente, servicio, profesional, día, hora,
    // minuto, estado
    const configuracionCitas = [
      [0, 0, 0, -3, 9, 0, 'COMPLETADA'],
      [1, 0, 0, -2, 10, 0, 'COMPLETADA'],
      [6, 4, 0, -1, 8, 30, 'COMPLETADA'],
      [7, 0, 0, 1, 14, 0, 'CONFIRMADA'],
      [8, 3, 0, 2, 15, 0, 'PENDIENTE'],

      [2, 2, 1, -3, 10, 0, 'COMPLETADA'],
      [3, 2, 1, -1, 11, 0, 'CANCELADA'],
      [4, 2, 1, 1, 9, 0, 'CONFIRMADA'],
      [5, 2, 1, 1, 10, 30, 'CONFIRMADA'],
      [9, 2, 1, 3, 14, 0, 'PENDIENTE'],

      [0, 1, 2, -2, 14, 0, 'COMPLETADA'],
      [2, 1, 2, -1, 15, 30, 'CANCELADA'],
      [3, 1, 2, 1, 11, 0, 'CONFIRMADA'],
      [4, 1, 2, 2, 9, 30, 'CONFIRMADA'],
      [5, 3, 2, 2, 11, 0, 'PENDIENTE']
    ];

    const profesionales = [prof1, prof2, prof3];
    const citas = [];

    for (const config of configuracionCitas) {
      const [
        indicePaciente,
        indiceServicio,
        indiceProfesional,
        dias,
        hora,
        minuto,
        estado
      ] = config;

      const servicio = servicios[indiceServicio];
      const inicio = fechaRelativa(dias, hora, minuto);
      const fin = new Date(
        inicio.getTime() + servicio.duracionMinutos * 60000
      );

      const cita = new Cita({
        paciente: pacientes[indicePaciente]._id,
        servicio: servicio._id,
        profesional: profesionales[indiceProfesional]._id,
        fechaInicio: inicio,
        fechaFin: fin,
        duracionMinutos: servicio.duracionMinutos,
        precioCentavos: servicio.precioCentavos,
        estado,
        observaciones: 'Cita de demostración SIGCA.',
        creadoPor: recep1._id,
        actualizadoPor: recep1._id
      });

      await cita.save();
      citas.push(cita);
    }

    // ==================================================
    // 8. CAJAS
    // 2 cerradas y 1 abierta
    // ==================================================

    console.log('Creando cajas...');

    const caja1 = await Caja.create({
      usuario: recep1._id,
      fechaApertura: fechaRelativa(-3, 8),
      fechaCierre: fechaRelativa(-3, 17),
      montoInicialCentavos: 50000,
      montoContadoCentavos: 120000,
      diferenciaCentavos: 0,
      estado: 'CERRADA',
      cerradaPor: recep1._id
    });

    const caja2 = await Caja.create({
      usuario: recep2._id,
      fechaApertura: fechaRelativa(-2, 8),
      fechaCierre: fechaRelativa(-2, 17),
      montoInicialCentavos: 30000,
      montoContadoCentavos: 80000,
      diferenciaCentavos: 0,
      estado: 'CERRADA',
      cerradaPor: recep2._id
    });

    const caja3 = await Caja.create({
      usuario: recep1._id,
      fechaApertura: fechaRelativa(0, 8),
      montoInicialCentavos: 50000,
      estado: 'ABIERTA'
    });

    // ==================================================
    // 9. PAGOS
    // 10 pagos: completos, parciales y anulados
    // ==================================================

    console.log('Creando pagos...');

    // cita, caja, monto, método, estado, usuario
    const configuracionPagos = [
      [0, 0, 25000, 'EFECTIVO', 'REGISTRADO', 0],
      [1, 0, 15000, 'TRANSFERENCIA', 'REGISTRADO', 0],
      [2, 1, 45000, 'TARJETA', 'REGISTRADO', 1],
      [5, 0, 20000, 'EFECTIVO', 'REGISTRADO', 0],
      [10, 1, 15000, 'TRANSFERENCIA', 'REGISTRADO', 1],
      [10, 2, 15000, 'EFECTIVO', 'REGISTRADO', 0],
      [3, 2, 10000, 'TARJETA', 'REGISTRADO', 0],
      [7, 2, 10000, 'EFECTIVO', 'REGISTRADO', 0],
      [0, 0, 25000, 'TARJETA', 'ANULADO', 0],
      [2, 1, 45000, 'TRANSFERENCIA', 'ANULADO', 1]
    ];

    const cajas = [caja1, caja2, caja3];
    const recepcionistas = [recep1, recep2];

    const pagos = configuracionPagos.map(config => {
      const [
        indiceCita,
        indiceCaja,
        monto,
        metodo,
        estado,
        indiceUsuario
      ] = config;

      const usuario = recepcionistas[indiceUsuario];

      return {
        cita: citas[indiceCita]._id,
        paciente: citas[indiceCita].paciente,
        caja: cajas[indiceCaja]._id,
        registradoPor: usuario._id,
        montoCentavos: monto,
        metodo,
        numeroRecibo: `SIGCA-${randomUUID()}`,
        estado,
        ...(estado === 'ANULADO'
          ? {
              anuladoPor: admin._id,
              fechaAnulacion: new Date(),
              motivoAnulacion: 'Anulación de demostración.'
            }
          : {})
      };
    });

    await Pago.insertMany(pagos);

    // ==================================================
    // 10. MATERIALES
    // ==================================================

    console.log('Creando materiales...');

    await db.collection('materiales').insertMany([
      {
        nombre: 'Tarjetas Fonéticas',
        descripcion: 'Material para terapia de lenguaje.',
        cantidad: 15,
        categoria: 'Fonoaudiología',
        estado: 'DISPONIBLE'
      },
      {
        nombre: 'Kit Sensorial',
        descripcion: 'Juegos para estimulación sensorial.',
        cantidad: 8,
        categoria: 'Terapia Ocupacional',
        estado: 'DISPONIBLE'
      },
      {
        nombre: 'Pruebas Neuropsicológicas',
        descripcion: 'Instrumentos de evaluación psicológica.',
        cantidad: 3,
        categoria: 'Diagnóstico Clínico',
        estado: 'EN_USO'
      },
      {
        nombre: 'Manuales para Padres',
        descripcion: 'Material de orientación familiar.',
        cantidad: 50,
        categoria: 'Orientación Familiar',
        estado: 'DISPONIBLE'
      },
      {
        nombre: 'Instrumentos Auditivos',
        descripcion: 'Material de estimulación auditiva.',
        cantidad: 5,
        categoria: 'Audiología',
        estado: 'DISPONIBLE'
      }
    ]);

    // ==================================================
    // 11. SOLICITUDES DE CITA DESDE EL PORTAL
    // ==================================================

    console.log('Creando solicitudes de cita...');

    const solicitudesConfig = [
      ['Karla Morales', 'karla@correo.test', 0, 'PENDIENTE'],
      ['Fernando Castro', 'fernando@correo.test', 1, 'CONTACTADO'],
      ['Gabriela Soto', 'gabriela@correo.test', 2, 'PENDIENTE'],
      ['David Ruiz', 'david@correo.test', 3, 'PENDIENTE'],
      ['Lucía Méndez', 'lucia@correo.test', 4, 'PENDIENTE']
    ];

    await db.collection('solicitudes_citas').insertMany(
      solicitudesConfig.map((s, i) => ({
        nombre: s[0],
        correo: s[1],
        telefono: `5500000${i}`,
        servicioId: servicios[s[2]]._id,
        fechaPreferida: fechaRelativa(i + 3, 9),
        horarioPreferido: 'Mañana',
        motivo: 'Solicitud de atención desde el portal.',
        estado: s[3],
        createdAt: new Date()
      }))
    );

    // ==================================================
    // 12. PORTAL INSTITUCIONAL
    // CREAR SI NO EXISTE, SIN REEMPLAZAR EL EXISTENTE
    // ==================================================

    console.log('Verificando portal institucional...');

    const contenidoExistente =
      await ContenidoInstitucional.findOne({
        clave: 'principal'
      });

    if (contenidoExistente) {
      console.log(
        'El portal ya existe. Se conservará sin cambios.'
      );
    } else {
      const contenidoAnterior =
        await ContenidoInstitucional.findOne({});

      if (contenidoAnterior) {
        // Conservar el documento antiguo, sin borrar
        // sus textos ni las referencias a fotografías.
        if (!contenidoAnterior.clave) {
          contenidoAnterior.clave = 'principal';
          await contenidoAnterior.save();
        }

        console.log(
          'Se conserva el contenido institucional anterior.'
        );
      } else {
        // Instalación completamente nueva.
        // Crear el contenido del portal.

        await ContenidoInstitucional.create({
          clave: 'principal',

          institucion:
            "Centro Psicológico y de Desarrollo Humano K'aslemal",

          lema:
            'Acompañando procesos, transformando vidas',

          mision:
            'Brindar atención psicológica, fonoaudiológica ' +
            'y de estimulación con calidez, profesionalismo ' +
            'y compromiso familiar.',

          vision:
            'Ser un centro de referencia en desarrollo ' +
            'humano integral, salud mental y terapias ' +
            'especializadas.',

          valores: [
            'Empatía',
            'Ética profesional',
            'Compromiso familiar',
            'Excelencia terapéutica'
          ],

          actividades: [
            {
              titulo: 'Atención especializada',
              descripcion:
                'Evaluación y acompañamiento del ' +
                'desarrollo integral.'
            },
            {
              titulo: 'Actividades terapéuticas',
              descripcion:
                'Actividades para fortalecer habilidades ' +
                'y bienestar.'
            },
            {
              titulo: 'Orientación familiar',
              descripcion:
                'Acompañamiento para padres y responsables.'
            }
          ],

          horarios: [
            {
              dia: 'Lunes a viernes',
              horario: '08:00 a 17:00'
            },
            {
              dia: 'Sábado',
              horario: '08:00 a 12:00'
            }
          ],

          contacto: {
            telefono: '22334455',
            correo: 'contacto@kaslemal.edu.gt',
            direccion: 'Ciudad de Guatemala',
            horarioAtencion:
              'Lunes a viernes de 08:00 a 17:00 ' +
              'y sábados de 08:00 a 12:00'
          },

          carrusel: [
            {
              imagen: '/imagenes/bienvenida.jpg',
              titulo: 'Bienvenidos a K’aslemal',
              descripcion:
                'Un espacio para crecer y desarrollarse.'
            },
            {
              imagen: '/imagenes/actividades.jpg',
              titulo: 'Nuestras actividades',
              descripcion:
                'Actividades para el desarrollo integral.'
            },
            {
              imagen: '/imagenes/terapias.jpg',
              titulo: 'Nuestros servicios',
              descripcion:
                'Atención y acompañamiento profesional.'
            }
          ],

          publicado: true
        });

        console.log(
          'Portal institucional creado correctamente.'
        );
      }
    }

    // ==================================================
    // 13. RESUMEN
    // ==================================================

    console.log('\n====================================');
    console.log('SEED SIGCA FINALIZADO');
    console.log('====================================');

    console.log('Usuarios: 6');
    console.log('Horarios: 7');
    console.log('Servicios: 5');
    console.log('Responsables: 5');
    console.log('Pacientes: 10');
    console.log('Citas: 15');
    console.log('Cajas: 3');
    console.log('Pagos: 10');
    console.log('Materiales: 5');
    console.log('Solicitudes de cita: 5');
    console.log('Portal institucional: conservado o creado');

    console.log('\nCREDENCIALES DE DEMOSTRACIÓN');
    console.log('Administrador: admin@sigca.test');
    console.log('Recepción 1: recepcion1@sigca.test');
    console.log('Recepción 2: recepcion2@sigca.test');
    console.log('Profesional 1: profesional1@sigca.test');
    console.log('Profesional 2: profesional2@sigca.test');
    console.log('Profesional 3: profesional3@sigca.test');
    console.log('Contraseña: Password123*');

    console.log('\nProceso completado.');

  } catch (error) {
    console.error('Error al ejecutar seed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

cargarDatos();
