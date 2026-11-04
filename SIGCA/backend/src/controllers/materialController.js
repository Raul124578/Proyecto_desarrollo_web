const mongoose = require('mongoose');
const Material = require('../models/Material');

const manejarError = (res, error) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Error de validación en el material',
      errores: Object.values(error.errors).map(e => e.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      mensaje: 'Dato o identificador inválido'
    });
  }

  console.error('Error en controlador de materiales:', error);

  return res.status(500).json({
    mensaje: 'Error interno del servidor al procesar el material'
  });
};

// 1. Crear nuevo material
const crearMaterial = async (req, res) => {
  try {
    const { nombre, descripcion, cantidad, categoria, estado } = req.body;

    if (!nombre || !descripcion || cantidad === undefined || !categoria) {
      return res.status(400).json({
        mensaje: 'Los campos nombre, descripción, cantidad y categoría son obligatorios'
      });
    }

    const cantidadNum = Number(cantidad);
    if (!Number.isInteger(cantidadNum) || cantidadNum < 0) {
      return res.status(400).json({
        mensaje: 'La cantidad debe ser un número entero mayor o igual a 0'
      });
    }

    const material = await Material.create({
      nombre,
      descripcion,
      cantidad: cantidadNum,
      categoria,
      estado: estado || (cantidadNum === 0 ? 'AGOTADO' : 'DISPONIBLE')
    });

    return res.status(201).json({
      mensaje: 'Material registrado correctamente',
      material
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

// 2. Obtener lista de materiales (con filtros por estado, categoría y búsqueda)
const obtenerMateriales = async (req, res) => {
  try {
    const { categoria, estado, buscar } = req.query;
    const filtro = {};

    if (categoria) {
      filtro.categoria = categoria;
    }

    if (estado) {
      filtro.estado = estado;
    }

    if (buscar) {
      const regex = new RegExp(String(buscar).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filtro.$or = [
        { nombre: regex },
        { descripcion: regex }
      ];
    }

    const materiales = await Material.find(filtro).sort({ createdAt: -1 });

    return res.status(200).json(materiales);
  } catch (error) {
    return manejarError(res, error);
  }
};

// 3. Obtener un material por ID
const obtenerMaterialPorId = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de material inválido' });
    }

    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ mensaje: 'Material no encontrado' });
    }

    return res.status(200).json(material);
  } catch (error) {
    return manejarError(res, error);
  }
};

// 4. Actualizar material
const actualizarMaterial = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de material inválido' });
    }

    const camposPermitidos = ['nombre', 'descripcion', 'cantidad', 'categoria', 'estado'];
    const datos = {};

    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) {
        datos[campo] = req.body[campo];
      }
    }

    if (datos.cantidad !== undefined) {
      const cantidadNum = Number(datos.cantidad);
      if (!Number.isInteger(cantidadNum) || cantidadNum < 0) {
        return res.status(400).json({
          mensaje: 'La cantidad debe ser un entero mayor o igual a 0'
        });
      }
      datos.cantidad = cantidadNum;
      // Auto-actualizar estado a AGOTADO si cantidad es 0 y estaba DISPONIBLE
      if (cantidadNum === 0 && (!datos.estado || datos.estado === 'DISPONIBLE')) {
        datos.estado = 'AGOTADO';
      }
    }

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { $set: datos },
      { new: true, runValidators: true }
    );

    if (!material) {
      return res.status(404).json({ mensaje: 'Material no encontrado' });
    }

    return res.status(200).json({
      mensaje: 'Material actualizado correctamente',
      material
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

// 5. Cambiar únicamente el estado del material
const cambiarEstadoMaterial = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de material inválido' });
    }

    const { estado } = req.body;
    const estadosValidos = ['DISPONIBLE', 'EN_USO', 'AGOTADO', 'MANTENIMIENTO'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        mensaje: `Estado inválido. Opciones: ${estadosValidos.join(', ')}`
      });
    }

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { $set: { estado } },
      { new: true, runValidators: true }
    );

    if (!material) {
      return res.status(404).json({ mensaje: 'Material no encontrado' });
    }

    return res.status(200).json({
      mensaje: 'Estado del material actualizado correctamente',
      material
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

// 6. Eliminar material
const eliminarMaterial = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de material inválido' });
    }

    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) {
      return res.status(404).json({ mensaje: 'Material no encontrado' });
    }

    return res.status(200).json({
      mensaje: 'Material eliminado correctamente'
    });
  } catch (error) {
    return manejarError(res, error);
  }
};

module.exports = {
  crearMaterial,
  obtenerMateriales,
  obtenerMaterialPorId,
  actualizarMaterial,
  cambiarEstadoMaterial,
  eliminarMaterial
};

