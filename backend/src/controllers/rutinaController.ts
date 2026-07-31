import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Rutina } from "../models/Rutina";
import { AuthRequest } from "../middleware/auth";

const rutinaRepository = AppDataSource.getRepository(Rutina);

// Obtener todas las rutinas del usuario
export const getRutinas = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
      return;
    }

    const rutinas = await rutinaRepository.find({
      where: { user: { id: userId } },
      order: { hora: "ASC" },
    });

    res.status(200).json({
      success: true,
      data: rutinas,
    });
  } catch (error) {
    console.error("Error al obtener rutinas:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Crear una nueva rutina
export const createRutina = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
      return;
    }

    const { nombre, hora, repetir, mensaje, accionAdicional } = req.body;

    if (!nombre || !hora) {
      res.status(400).json({
        success: false,
        message: "Nombre y hora son obligatorios",
      });
      return;
    }

    const rutina = rutinaRepository.create({
      nombre,
      hora,
      repetir: repetir || false,
      mensaje: mensaje || null,
      accionAdicional: accionAdicional || null,
      user: { id: userId },
    });

    const savedRutina = await rutinaRepository.save(rutina);

    res.status(201).json({
      success: true,
      message: "Rutina creada correctamente",
      data: savedRutina,
    });
  } catch (error) {
    console.error("Error al crear rutina:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Actualizar una rutina
export const updateRutina = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const rutinaId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
      return;
    }

    const rutina = await rutinaRepository.findOne({
      where: { id: rutinaId, user: { id: userId } },
    });

    if (!rutina) {
      res.status(404).json({
        success: false,
       message: "Rutina no encontrada",
      });
      return;
    }

    const { nombre, hora, repetir, mensaje, accionAdicional } = req.body;

    if (nombre) rutina.nombre = nombre;
    if (hora) rutina.hora = hora;
    if (repetir !== undefined) rutina.repetir = repetir;
    if (mensaje !== undefined) rutina.mensaje = mensaje;
    if (accionAdicional !== undefined) rutina.accionAdicional = accionAdicional;

    const updatedRutina = await rutinaRepository.save(rutina);

    res.status(200).json({
      success: true,
      message: "Rutina actualizada correctamente",
      data: updatedRutina,
    });
  } catch (error) {
    console.error("Error al actualizar rutina:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Eliminar una rutina
export const deleteRutina = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const rutinaId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
      return;
    }

    const rutina = await rutinaRepository.findOne({
      where: { id: rutinaId, user: { id: userId } },
    });

    if (!rutina) {
      res.status(404).json({
        success: false,
        message: "Rutina no encontrada",
      });
      return;
    }

    await rutinaRepository.remove(rutina);

    res.status(200).json({
      success: true,
      message: "Rutina eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar rutina:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};