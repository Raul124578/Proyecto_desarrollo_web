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

const serviciosData = [
  {
    nombre: "Atención Psicológica Individual",
    descripcion: "Evaluación y acompañamiento psicoterapéutico personalizado para niños, jóvenes y adultos.",
    duracionMinutos: 45,
    precioCentavos: 25000, // Q250.00
    imagen: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600",
    estado: "ACTIVO"
  },
  {
    nombre: "Estimulación Auditiva Verbal",
    descripcion: "Terapia especializada para el desarrollo de la escucha y habilidades del habla.",
    duracionMinutos: 60,
    precioCentavos: 30000, // Q300.00
    imagen: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600",
    estado: "ACTIVO"
  },
  {
    nombre: "Terapia de Lenguaje y Comunicación",
    descripcion: "Intervención orientada a potenciar la fluidez, articulación y comprensión del lenguaje.",
    duracionMinutos: 45,
    precioCentavos: 20000, // Q200.00
    imagen: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600",
    estado: "ACTIVO"
  },
  {
    nombre: "Escuela para Padres y Orientación Familiar",
    descripcion: "Sesiones de guía y estrategias para padres en el acompañamiento del desarrollo integral de sus hijos.",
    duracionMinutos: 60,
    precioCentavos: 17500, // Q175.00
    imagen: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=600",
    estado: "ACTIVO"
  },
  {
    nombre: "Evaluación Psicológica y Diagnóstico",
    descripcion: "Batería de pruebas psicométricas y diagnóstico clínico integral con informe detallado.",
    duracionMinutos: 90,
    precioCentavos: 45000, // Q450.00
    imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600",
    estado: "ACTIVO"
  }
];

const cargarDatos = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sigca';
    console.log('Conectando a MongoDB en:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✓ Conectado a MongoDB.');

    // 0. Limpiar colecciones existentes para inicialización limpia
    console.log('Limpiando colecciones anteriores...');
    await Pago.deleteMany({});
    await Caja.deleteMany({});
    await Cita.deleteMany({});
    await Horario.deleteMany({});
    await Paciente.deleteMany({});
    await Responsable.deleteMany({});
    await Servicio.deleteMany({});
    await Usuario.deleteMany({});

    const db = mongoose.connection.db;
    try { await db.collection('materiales').deleteMany({}); } catch (_) {}
    try { await db.collection('solicitudes_citas').deleteMany({}); } catch (_) {}
    try { await db.collection('contenido_institucional').deleteMany({}); } catch (_) {}

    // 1. Usuarios: 1 Administrador, 2 Recepcionistas, 3 Profesionales
    console.log('Creando usuarios (1 Administrador, 2 Recepcionistas, 3 Profesionales)...');
    const usuariosConfig = [
      {
        nombre: 'Admin General SIGCA',
        correo: 'admin@sigca.test',
        password: 'Password123*',
        rol: 'ADMINISTRADOR',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Recepcionista Turno Mañana',
        correo: 'recepcion1@sigca.test',
        password: 'Password123*',
        rol: 'RECEPCIONISTA',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Recepcionista Turno Tarde',
        correo: 'recepcion2@sigca.test',
        password: 'Password123*',
        rol: 'RECEPCIONISTA',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Dr. Carlos Mendoza (Psicólogo Clínico)',
        correo: 'profesional1@sigca.test',
        password: 'Password123*',
        rol: 'PROFESIONAL',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Dra. Ana Lucía Morales (Terapeuta de Lenguaje)',
        correo: 'profesional2@sigca.test',
        password: 'Password123*',
        rol: 'PROFESIONAL',
        estado: 'ACTIVO'
      },
      {
        nombre: 'Lic. Roberto Gómez (Especialista en Estimulación)',
        correo: 'profesional3@sigca.test',
        password: 'Password123*',
        rol: 'PROFESIONAL',
        estado: 'ACTIVO'
      }
    ];

    const usuarios = [];
    for (const u of usuariosConfig) {
      const nuevo = new Usuario(u);
      await nuevo.save();
      usuarios.push(nuevo);
    }
    const [admin, recep1, recep2, prof1, prof2, prof3] = usuarios;

    // 2. Horarios configurados para la semana (Lunes a Sábado)
    console.log('Configurando horarios semanales...');
    const horarios = [];
    for (let dia = 0; dia <= 6; dia++) {
      if (dia === 0) {
        // Domingo cerrado
        horarios.push({ diaSemana: 0, activo: false, tramos: [] });
      } else if (dia === 6) {
        // Sábado media jornada (8:00 a 12:00 -> 480 a 720 min)
        horarios.push({
          diaSemana: 6,
          activo: true,
          tramos: [{ inicioMinuto: 480, finMinuto: 720 }]
        });
      } else {
        // Lunes a Viernes jornada completa (8:00-12:00 y 13:00-17:00)
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

    // 3. 5 Servicios de atención
    console.log('Insertando 5 servicios...');
    const servicios = await Servicio.insertMany(serviciosData);

    // 4. 5 Responsables
    console.log('Insertando 5 responsables de familia...');
    const responsablesData = [
      {
        nombres: 'María Elena',
        apellidos: 'López Morales',
        parentesco: 'MADRE',
        telefono: '55443322',
        correo: 'maria.lopez@correo.test',
        direccion: 'Zona 1, Ciudad de Guatemala'
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
        direccion: 'Zona 11, Ciudad de Guatemala'
      },
      {
        nombres: 'Héctor Rolando',
        apellidos: 'Méndez Aguilar',
        parentesco: 'TUTOR',
        telefono: '44556677',
        correo: 'hector.mendez@correo.test',
        direccion: 'Zona 10, Santa Catarina Pinula'
      },
      {
        nombres: 'Claudia Patricia',
        apellidos: 'Flores Estrada',
        parentesco: 'MADRE',
        telefono: '55112233',
        correo: 'claudia.flores@correo.test',
        direccion: 'Zona 12, Villa Nueva'
      }
    ];
    const responsables = await Responsable.insertMany(responsablesData);

    // 5. 10 Pacientes ficticios (menores y adultos)
    console.log('Insertando 10 pacientes ficticios...');
    const pacientesData = [
      {
        nombres: 'Mateo Alejandro',
        apellidos: 'López Morales',
        fechaNacimiento: new Date('2018-05-14T00:00:00.000Z'), // Menor de edad
        sexo: 'MASCULINO',
        telefono: '55443322',
        direccion: 'Zona 1, Ciudad de Guatemala',
        observaciones: 'Presenta dificultades en dicción y fonemas r/rr.',
        responsables: [responsables[0]._id]
      },
      {
        nombres: 'Sofía Valentina',
        apellidos: 'López Morales',
        fechaNacimiento: new Date('2020-09-20T00:00:00.000Z'), // Menor de edad
        sexo: 'FEMENINO',
        telefono: '55443322',
        direccion: 'Zona 1, Ciudad de Guatemala',
        observaciones: 'Evaluación de desarrollo auditivo y del lenguaje.',
        responsables: [responsables[0]._id]
      },
      {
        nombres: 'Lucas Daniel',
        apellidos: 'García Pérez',
        fechaNacimiento: new Date('2017-02-11T00:00:00.000Z'), // Menor de edad
        sexo: 'MASCULINO',
        telefono: '44332211',
        direccion: 'Zona 7, Mixco',
        observaciones: 'Seguimiento por atención dispersa y motricidad fina.',
        responsables: [responsables[1]._id]
      },
      {
        nombres: 'Camila Renée',
        apellidos: 'Castillo Ramos',
        fechaNacimiento: new Date('2019-11-03T00:00:00.000Z'), // Menor de edad
        sexo: 'FEMENINO',
        telefono: '55667788',
        direccion: 'Zona 11, Ciudad de Guatemala',
        observaciones: 'Estimulación temprana en comunicación.',
        responsables: [responsables[2]._id]
      },
      {
        nombres: 'Diego Fernando',
        apellidos: 'Méndez Aguilar',
        fechaNacimiento: new Date('2016-07-25T00:00:00.000Z'), // Menor de edad
        sexo: 'MASCULINO',
        telefono: '44556677',
        direccion: 'Zona 10, Santa Catarina Pinula',
        observaciones: 'Apoyo psicoeducativo y orientación familiar.',
        responsables: [responsables[3]._id]
      },
      {
        nombres: 'Andrea Nicole',
        apellidos: 'Flores Estrada',
        fechaNacimiento: new Date('2021-04-18T00:00:00.000Z'), // Menor de edad
        sexo: 'FEMENINO',
        telefono: '55112233',
        direccion: 'Zona 12, Villa Nueva',
        observaciones: 'Evaluación periódica de habla y escucha.',
        responsables: [responsables[4]._id]
      },
      {
        nombres: 'Esteban Andrés',
        apellidos: 'Vásquez Quiñónez',
        fechaNacimiento: new Date('1998-03-12T00:00:00.000Z'), // Adulto
        sexo: 'MASCULINO',
        telefono: '44998877',
        direccion: 'Zona 4, Ciudad de Guatemala',
        observaciones: 'Consulta individual por manejo de ansiedad laboral.',
        responsables: []
      },
      {
        nombres: 'Valeria Beatriz',
        apellidos: 'Navarro Cifuentes',
        fechaNacimiento: new Date('1995-10-30T00:00:00.000Z'), // Adulto
        sexo: 'FEMENINO',
        telefono: '55331144',
        direccion: 'Zona 14, Ciudad de Guatemala',
        observaciones: 'Sesiones de orientación vocacional y proyecto de vida.',
        responsables: []
      },
      {
        nombres: 'Rodrigo Javier',
        apellidos: 'Salazar Fuentes',
        fechaNacimiento: new Date('1990-08-15T00:00:00.000Z'), // Adulto
        sexo: 'MASCULINO',
        telefono: '44225588',
        direccion: 'Zona 2, Ciudad de Guatemala',
        observaciones: 'Acompañamiento psicoterapéutico general.',
        responsables: []
      },
      {
        nombres: 'Mariana Isabel',
        apellidos: 'Ortiz Herrera',
        fechaNacimiento: new Date('1992-12-05T00:00:00.000Z'), // Adulto
        sexo: 'FEMENINO',
        telefono: '55779911',
        direccion: 'Zona 15, Ciudad de Guatemala',
        observaciones: 'Participación en escuela para padres y consejería.',
        responsables: []
      }
    ];

    const pacientes = await Paciente.insertMany(pacientesData);

    // Asociar bidireccionalmente los pacientes a sus responsables
    await Responsable.findByIdAndUpdate(responsables[0]._id, { $set: { pacientes: [pacientes[0]._id, pacientes[1]._id] } });
    await Responsable.findByIdAndUpdate(responsables[1]._id, { $set: { pacientes: [pacientes[2]._id] } });
    await Responsable.findByIdAndUpdate(responsables[2]._id, { $set: { pacientes: [pacientes[3]._id] } });
    await Responsable.findByIdAndUpdate(responsables[3]._id, { $set: { pacientes: [pacientes[4]._id] } });
    await Responsable.findByIdAndUpdate(responsables[4]._id, { $set: { pacientes: [pacientes[5]._id] } });

    // 6. 15 Citas (distribuidas sin solapes por profesional, con fechas exactas en minutos)
    console.log('Insertando 15 citas...');
    const baseDate = new Date();
    baseDate.setSeconds(0, 0);

    const helperFecha = (diasRelativos, hora, minuto) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + diasRelativos);
      d.setHours(hora, minuto, 0, 0);
      return d;
    };

    const citasConfig = [
      // 5 Citas para Profesional 1 (Psicología)
      {
        paciente: pacientes[0]._id,
        servicio: servicios[0]._id,
        profesional: prof1._id,
        fechaInicio: helperFecha(-3, 9, 0),
        fechaFin: helperFecha(-3, 9, 45),
        duracionMinutos: 45,
        precioCentavos: servicios[0].precioCentavos,
        estado: 'COMPLETADA',
        observaciones: 'Primera sesión realizada con éxito. Pago cancelado.',
        creadoPor: recep1._id,
        actualizadoPor: recep1._id
      },
      {
        paciente: pacientes[1]._id,
        servicio: servicios[0]._id,
        profesional: prof1._id,
        fechaInicio: helperFecha(-2, 10, 0),
        fechaFin: helperFecha(-2, 10, 45),
        duracionMinutos: 45,
        precioCentavos: servicios[0].precioCentavos,
        estado: 'COMPLETADA',
        observaciones: 'Segunda sesión completada. Saldo pendiente de pago parcial.',
        creadoPor: recep1._id,
        actualizadoPor: recep1._id
      },
      {
        paciente: pacientes[6]._id,
        servicio: servicios[4]._id, // Evaluacion (90 min)
        profesional: prof1._id,
        fechaInicio: helperFecha(-1, 8, 30),
        fechaFin: helperFecha(-1, 10, 0),
        duracionMinutos: 90,
        precioCentavos: servicios[4].precioCentavos,
        estado: 'COMPLETADA',
        observaciones: 'Evaluación integral aplicada.',
        creadoPor: recep2._id,
        actualizadoPor: recep2._id
      },
      {
        paciente: pacientes[7]._id,
        servicio: servicios[0]._id,
        profesional: prof1._id,
        fechaInicio: helperFecha(1, 14, 0),
        fechaFin: helperFecha(1, 14, 45),
        duracionMinutos: 45,
        precioCentavos: servicios[0].precioCentavos,
        estado: 'CONFIRMADA',
        observaciones: 'Confirmada telefónicamente.',
        creadoPor: recep1._id,
        actualizadoPor: recep1._id
      },
      {
        paciente: pacientes[8]._id,
        servicio: servicios[3]._id, // Escuela padres (60m)
        profesional: prof1._id,
        fechaInicio: helperFecha(2, 15, 0),
        fechaFin: helperFecha(2, 16, 0),
        duracionMinutos: 60,
        precioCentavos: servicios[3].precioCentavos,
        estado: 'PENDIENTE',
        observaciones: 'Pendiente de confirmación por horario de trabajo.',
        creadoPor: recep2._id,
        actualizadoPor: recep2._id
      },

      // 5 Citas para Profesional 2 (Lenguaje)
      {
        paciente: pacientes[2]._id,
        servicio: servicios[2]._id, // Lenguaje (45 min)
        profesional: prof2._id,
        fechaInicio: helperFecha(-3, 10, 0),
        fechaFin: helperFecha(-3, 10, 45),
        duracionMinutos: 45,
        precioCentavos: servicios[2].precioCentavos,
        estado: 'COMPLETADA',
        observaciones: 'Terapia de lenguaje completada satisfactoriamente.',
        creadoPor: recep1._id,
        actualizadoPor: recep1._id
      },
      {
        paciente: pacientes[3]._id,
        servicio: servicios[2]._id,
        profesional: prof2._id,
        fechaInicio: helperFecha(-1, 11, 0),
        fechaFin: helperFecha(-1, 11, 45),
        duracionMinutos: 45,
        precioCentavos: servicios[2].precioCentavos,
        estado: 'CANCELADA',
        observaciones: 'Cancelada por el responsable por quebrantos de salud.',
        creadoPor: recep2._id,
        actualizadoPor: recep2._id
      },
      {
        paciente: pacientes[4]._id,
        servicio: servicios[2]._id,
        profesional: prof2._id,
        fechaInicio: helperFecha(1, 9, 0),
        fechaFin: helperFecha(1, 9, 45),
        duracionMinutos: 45,
        precioCentavos: servicios[2].precioCentavos,
        estado: 'CONFIRMADA',
        observaciones: 'Cita confirmada para evaluación articulatoria.',
        creadoPor: recep1._id,
        actualizadoPor: recep1._id
      },
      {
        paciente: pacientes[5]._id,
        servicio: servicios[2]._id,
        profesional: prof2._id,
        fechaInicio: helperFecha(1, 10, 30),
        fechaFin: helperFecha(1, 11, 15),
        duracionMinutos: 45,
        precioCentavos: servicios[2].precioCentavos,
        estado: 'CONFIRMADA',
        observaciones: 'Cita en horario matutino confirmada.',
        creadoPor: recep1._id,
        actualizadoPor: recep1._id
      },
      {
        paciente: pacientes[9]._id,
        servicio: servicios[2]._id,
        profesional: prof2._id,
        fechaInicio: helperFecha(3, 14, 0),
        fechaFin: helperFecha(3, 14, 45),
        duracionMinutos: 45,
        precioCentavos: servicios[2].precioCentavos,
        estado: 'PENDIENTE',
        observaciones: 'Solicitud agendada vía web.',
        creadoPor: admin._id,
        actualizadoPor: admin._id
      },

      // 5 Citas para Profesional 3 (Estimulación)
      {
        paciente: pacientes[0]._id,
        servicio: servicios[1]._id, // Estimulacion (60 min)
        profesional: prof3._id,
        fechaInicio: helperFecha(-2, 14, 0),
        fechaFin: helperFecha(-2, 15, 0),
        duracionMinutos: 60,
        precioCentavos: servicios[1].precioCentavos,
        estado: 'COMPLETADA',
        observaciones: 'Estimulación auditiva verbal sesión #1.',
        creadoPor: recep1._id,
        actualizadoPor: recep1._id
      },
      {
        paciente: pacientes[2]._id,
        servicio: servicios[1]._id,
        profesional: prof3._id,
        fechaInicio: helperFecha(-1, 15, 30),
        fechaFin: helperFecha(-1, 16, 30),
        duracionMinutos: 60,
        precioCentavos: servicios[1].precioCentavos,
        estado: 'CANCELADA',
        observaciones: 'Reprogramada para la próxima semana.',
        creadoPor: recep2._id,
        actualizadoPor: recep2._id
      },
      {
        paciente: pacientes[3]._id,
        servicio: servicios[1]._id,
        profesional: prof3._id,
        fechaInicio: helperFecha(1, 11, 0),
        fechaFin: helperFecha(1, 12, 0),
        duracionMinutos: 60,
        precioCentavos: servicios[1].precioCentavos,
        estado: 'CONFIRMADA',
        observaciones: 'Sesión confirmada.',
        creadoPor: recep1._id,
        actualizadoPor: recep1._id
      },
      {
        paciente: pacientes[4]._id,
        servicio: servicios[1]._id,
        profesional: prof3._id,
        fechaInicio: helperFecha(2, 9, 30),
        fechaFin: helperFecha(2, 10, 30),
        duracionMinutos: 60,
        precioCentavos: servicios[1].precioCentavos,
        estado: 'CONFIRMADA',
        observaciones: 'Revisión periódica.',
        creadoPor: recep2._id,
        actualizadoPor: recep2._id
      },
      {
        paciente: pacientes[5]._id,
        servicio: servicios[3]._id, // Escuela padres
        profesional: prof3._id,
        fechaInicio: helperFecha(2, 11, 0),
        fechaFin: helperFecha(2, 12, 0),
        duracionMinutos: 60,
        precioCentavos: servicios[3].precioCentavos,
        estado: 'PENDIENTE',
        observaciones: 'Agendada por solicitud telefónica.',
        creadoPor: recep1._id,
        actualizadoPor: recep1._id
      }
    ];

    const citas = [];
    for (const c of citasConfig) {
      const nueva = new Cita(c);
      await nueva.save();
      citas.push(nueva);
    }

    // 7. 3 Cajas (demostrando historial: 2 cerradas y 1 abierta)
    console.log('Insertando 3 cajas (2 cerradas, 1 abierta)...');
    const caja1Cerrada = new Caja({
      usuario: recep1._id,
      fechaApertura: helperFecha(-3, 8, 0),
      fechaCierre: helperFecha(-3, 17, 0),
      montoInicialCentavos: 50000, // Q500.00
      montoContadoCentavos: 120000, // Q1,200.00
      diferenciaCentavos: 0,
      estado: 'CERRADA',
      cerradaPor: recep1._id
    });
    await caja1Cerrada.save();

    const caja2Cerrada = new Caja({
      usuario: recep2._id,
      fechaApertura: helperFecha(-2, 8, 0),
      fechaCierre: helperFecha(-2, 17, 0),
      montoInicialCentavos: 30000, // Q300.00
      montoContadoCentavos: 80000, // Q800.00
      diferenciaCentavos: 0,
      estado: 'CERRADA',
      cerradaPor: recep2._id
    });
    await caja2Cerrada.save();

    const caja3Abierta = new Caja({
      usuario: recep1._id,
      fechaApertura: helperFecha(0, 8, 0),
      montoInicialCentavos: 50000, // Q500.00
      estado: 'ABIERTA'
    });
    await caja3Abierta.save();

    // 8. 10 Pagos (completos, parciales, saldos pendientes y anulaciones con UUID)
    console.log('Insertando 10 pagos (completos, parciales, anulaciones)...');
    const pagosData = [
      // Pago 1: Completo para cita 0 (Q250.00 = 25000 centavos) en caja 1
      {
        cita: citas[0]._id,
        paciente: citas[0].paciente,
        caja: caja1Cerrada._id,
        registradoPor: recep1._id,
        montoCentavos: 25000,
        metodo: 'EFECTIVO',
        numeroRecibo: `SIGCA-${randomUUID()}`,
        estado: 'REGISTRADO'
      },
      // Pago 2: Parcial para cita 1 (Q150.00 de Q250.00 -> saldo pendiente Q100.00)
      {
        cita: citas[1]._id,
        paciente: citas[1].paciente,
        caja: caja1Cerrada._id,
        registradoPor: recep1._id,
        montoCentavos: 15000,
        metodo: 'TRANSFERENCIA',
        numeroRecibo: `SIGCA-${randomUUID()}`,
        estado: 'REGISTRADO'
      },
      // Pago 3: Completo para cita 2 (Evaluación Q450.00 = 45000 centavos) en caja 2
      {
        cita: citas[2]._id,
        paciente: citas[2].paciente,
        caja: caja2Cerrada._id,
        registradoPor: recep2._id,
        montoCentavos: 45000,
        metodo: 'TARJETA',
        numeroRecibo: `SIGCA-${randomUUID()}`,
        estado: 'REGISTRADO'
      },
      // Pago 4: Completo para cita 5 (Lenguaje Q200.00 = 20000 centavos) en caja 1
      {
        cita: citas[5]._id,
        paciente: citas[5].paciente,
        caja: caja1Cerrada._id,
        registradoPor: recep1._id,
        montoCentavos: 20000,
        metodo: 'EFECTIVO',
        numeroRecibo: `SIGCA-${randomUUID()}`,
        estado: 'REGISTRADO'
      },
      // Pago 5: Parcial para cita 10 (Estimulación Q150.00 de Q300.00 -> saldo Q150.00)
      {
        cita: citas[10]._id,
        paciente: citas[10].paciente,
        caja: caja2Cerrada._id,
        registradoPor: recep2._id,
        montoCentavos: 15000,
        metodo: 'TRANSFERENCIA',
        numeroRecibo: `SIGCA-${randomUUID()}`,
        estado: 'REGISTRADO'
      },
      // Pago 6: Completo para cita 10 (Segundo abono de Q150.00 para saldar la cita 10)
      {
        cita: citas[10]._id,
        paciente: citas[10].paciente,
        caja: caja3Abierta._id,
        registradoPor: recep1._id,
        montoCentavos: 15000,
        metodo: 'EFECTIVO',
        numeroRecibo: `SIGCA-${randomUUID()}`,
        estado: 'REGISTRADO'
      },
      // Pago 7: Parcial anticipado para cita 3 (Q100.00 de Q250.00) en caja abierta
      {
        cita: citas[3]._id,
        paciente: citas[3].paciente,
        caja: caja3Abierta._id,
        registradoPor: recep1._id,
        montoCentavos: 10000,
        metodo: 'TARJETA',
        numeroRecibo: `SIGCA-${randomUUID()}`,
        estado: 'REGISTRADO'
      },
      // Pago 8: Parcial anticipado para cita 7 (Q100.00 de Q200.00) en caja abierta
      {
        cita: citas[7]._id,
        paciente: citas[7].paciente,
        caja: caja3Abierta._id,
        registradoPor: recep1._id,
        montoCentavos: 10000,
        metodo: 'EFECTIVO',
        numeroRecibo: `SIGCA-${randomUUID()}`,
        estado: 'REGISTRADO'
      },
      // Pago 9: Anulado (Error en digitación de tarjeta)
      {
        cita: citas[0]._id,
        paciente: citas[0].paciente,
        caja: caja1Cerrada._id,
        registradoPor: recep1._id,
        montoCentavos: 25000,
        metodo: 'TARJETA',
        numeroRecibo: `SIGCA-${randomUUID()}`,
        estado: 'ANULADO',
        anuladoPor: recep1._id,
        fechaAnulacion: helperFecha(-3, 9, 30),
        motivoAnulacion: 'Error en cargo al POS, se cobró en efectivo posteriormente.'
      },
      // Pago 10: Anulado (Duplicidad en transferencia)
      {
        cita: citas[2]._id,
        paciente: citas[2].paciente,
        caja: caja2Cerrada._id,
        registradoPor: recep2._id,
        montoCentavos: 45000,
        metodo: 'TRANSFERENCIA',
        numeroRecibo: `SIGCA-${randomUUID()}`,
        estado: 'ANULADO',
        anuladoPor: admin._id,
        fechaAnulacion: helperFecha(-2, 11, 0),
        motivoAnulacion: 'Comprobante duplicado por parte del usuario.'
      }
    ];
    await Pago.insertMany(pagosData);

    // 9. 5 Materiales Clínicos y Didácticos
    console.log('Insertando 5 materiales clínicos...');
    const materiales = [
      {
        nombre: 'Set de Tarjetas Fonéticas y Articulatorias',
        descripcion: 'Material didáctico para terapias de habla, articulación y lenguaje infantil.',
        cantidad: 15,
        categoria: 'Fonoaudiología',
        estado: 'DISPONIBLE'
      },
      {
        nombre: 'Kit de Juegos Sensoriales y Motricidad Fina',
        descripcion: 'Rompecabezas táctiles, plastilinas terapéuticas y pinzas de coordinación.',
        cantidad: 8,
        categoria: 'Terapia Ocupacional',
        estado: 'DISPONIBLE'
      },
      {
        nombre: 'Batería de Pruebas Neuropsicológicas WISC-V',
        descripcion: 'Manual de aplicación, cuadernos de estímulos y protocolos de calificación diagnóstica.',
        cantidad: 3,
        categoria: 'Diagnóstico Clínico',
        estado: 'EN_USO'
      },
      {
        nombre: 'Guías y Manuales para Escuela de Padres',
        descripcion: 'Folletería y cuadernillos de ejercicios psicoeducativos para el hogar.',
        cantidad: 50,
        categoria: 'Orientación Familiar',
        estado: 'DISPONIBLE'
      },
      {
        nombre: 'Instrumentos de Estimulación Auditivo-Verbal',
        descripcion: 'Set de campanas sonoras, diapasones y software para entrenamiento auditivo.',
        cantidad: 5,
        categoria: 'Audiología',
        estado: 'DISPONIBLE'
      }
    ];
    await db.collection('materiales').insertMany(materiales);

    // 10. 5 Solicitudes de Cita (desde el portal público)
    console.log('Insertando 5 solicitudes de cita...');
    const solicitudes = [
      {
        nombre: 'Karla Morales',
        correo: 'karla.morales@correo.test',
        telefono: '55661122',
        servicioId: servicios[0]._id,
        fechaPreferida: helperFecha(3, 9, 0),
        horarioPreferido: 'Mañana',
        motivo: 'Solicitud para evaluación psicológica inicial de su hija.',
        estado: 'PENDIENTE',
        createdAt: new Date()
      },
      {
        nombre: 'Fernando Castro',
        correo: 'fernando.castro@correo.test',
        telefono: '44889900',
        servicioId: servicios[1]._id,
        fechaPreferida: helperFecha(4, 10, 0),
        horarioPreferido: 'Mañana',
        motivo: 'Consulta sobre terapia de estimulación auditiva.',
        estado: 'CONTACTADO',
        createdAt: new Date()
      },
      {
        nombre: 'Gabriela Soto',
        correo: 'gabriela.soto@correo.test',
        telefono: '55773344',
        servicioId: servicios[2]._id,
        fechaPreferida: helperFecha(5, 14, 0),
        horarioPreferido: 'Tarde',
        motivo: 'Problemas en pronunciación de letras en edad escolar.',
        estado: 'PENDIENTE',
        createdAt: new Date()
      },
      {
        nombre: 'David Enrique Ruíz',
        correo: 'david.ruiz@correo.test',
        telefono: '44118833',
        servicioId: servicios[3]._id,
        fechaPreferida: helperFecha(5, 15, 30),
        horarioPreferido: 'Tarde',
        motivo: 'Interés en taller de escuela para padres.',
        estado: 'PENDIENTE',
        createdAt: new Date()
      },
      {
        nombre: 'Lucía Méndez',
        correo: 'lucia.mendez@correo.test',
        telefono: '55224466',
        servicioId: servicios[4]._id,
        fechaPreferida: helperFecha(6, 11, 0),
        horarioPreferido: 'Mañana',
        motivo: 'Diagnóstico clínico y orientación de conducta.',
        estado: 'PENDIENTE',
        createdAt: new Date()
      }
    ];
    await db.collection('solicitudes_citas').insertMany(solicitudes);

    // 11. Contenido Institucional
    console.log('Insertando contenido institucional del Centro K\'aslemal...');
    const contenido = {
      institucion: "Centro Psicológico y de Desarrollo Humano K'aslemal",
      lema: "Acompañando procesos, transformando vidas",
      mision: "Brindar atención psicológica, fonoaudiológica y de estimulación con calidez y rigor científico a niños, jóvenes y familias en Guatemala.",
      vision: "Ser el centro de referencia en desarrollo humano integral, salud mental y terapias especializadas a nivel nacional.",
      valores: ["Empatía", "Ética profesional", "Compromiso familiar", "Excelencia terapéutica"],
      contacto: {
        telefono: "22334455",
        correo: "contacto@kaslemal.edu.gt",
        direccion: "Avenida Las Américas, Zona 13, Ciudad de Guatemala",
        horarioAtencion: "Lunes a Viernes de 8:00 a 17:00, Sábados de 8:00 a 12:00"
      },
      actualizadoEn: new Date()
    };
    await db.collection('contenido_institucional').insertOne(contenido);

    console.log('\n======================================================');
    console.log('¡SEED COMPLETADO CON ÉXITO!');
    console.log('======================================================');
    console.log('Resumen de datos cargados en MongoDB:');
    console.log('- Usuarios creados: 6 (1 Admin, 2 Recepcionistas, 3 Profesionales)');
    console.log('- Horarios semanales configurados: 7 días');
    console.log('- Servicios: 5');
    console.log('- Responsables de familia: 5');
    console.log('- Pacientes registrados: 10 (6 menores, 4 adultos)');
    console.log('- Citas registradas: 15 (Completadas, Confirmadas, Pendientes, Canceladas)');
    console.log('- Cajas registradas: 3 (2 Cerradas con corte de caja, 1 Abierta activa)');
    console.log('- Pagos registrados: 10 (Completos, parciales con saldo pendiente y anulados)');
    console.log('- Materiales clínicos: 5');
    console.log('- Solicitudes de cita web: 5');
    console.log('- Contenido institucional: 1');
    console.log('======================================================');
    console.log('Credenciales de prueba generadas (Contraseña para todos: Password123*):');
    console.log('1. Administrador: admin@sigca.test');
    console.log('2. Recepcionista 1: recepcion1@sigca.test');
    console.log('3. Recepcionista 2: recepcion2@sigca.test');
    console.log('4. Profesional 1: profesional1@sigca.test');
    console.log('5. Profesional 2: profesional2@sigca.test');
    console.log('6. Profesional 3: profesional3@sigca.test');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error durante la ejecución del seed:', error);
    process.exit(1);
  }
};

cargarDatos();
