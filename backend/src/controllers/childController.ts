import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Child } from "../models/Child";
import { AuthRequest } from "../middleware/auth";

const childRepository = AppDataSource.getRepository(Child);

export const childStatus = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: "Child API funcionando"
  });
};

// Obtener todos los niños del usuario autenticado
export const getChildren = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
      return;
    }

    const children = await childRepository.find({
      where: { user: { id: userId } },
      relations: ["toy"]
    });

    res.status(200).json({
      success: true,
      data: children
    });
  } catch (error) {
    console.error("Error al obtener niños:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Crear un nuevo niño
export const createChild = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
      return;
    }

    const { name, birthDate } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: "El nombre es obligatorio"
      });
      return;
    }

    const child = childRepository.create({
      name,
      birthDate: birthDate || null,
      user: { id: userId }
    });

    const savedChild = await childRepository.save(child);

    res.status(201).json({
      success: true,
      message: "Niño creado correctamente",
      data: savedChild
    });
  } catch (error) {
    console.error("Error al crear niño:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Actualizar un niño
export const updateChild = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const childId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
      return;
    }

    const { name, birthDate } = req.body;

    const child = await childRepository.findOne({
      where: { id: childId, user: { id: userId } }
    });

    if (!child) {
      res.status(404).json({
        success: false,
        message: "Niño no encontrado"
      });
      return;
    }

    if (name) child.name = name;
    if (birthDate !== undefined) child.birthDate = birthDate;

    const updatedChild = await childRepository.save(child);

    res.status(200).json({
      success: true,
      message: "Niño actualizado correctamente",
      data: updatedChild
    });
  } catch (error) {
    console.error("Error al actualizar niño:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Eliminar un niño
export const deleteChild = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const childId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
      return;
    }

    const child = await childRepository.findOne({
      where: { id: childId, user: { id: userId } }
    });

    if (!child) {
      res.status(404).json({
        success: false,
        message: "Niño no encontrado"
      });
      return;
    }

    await childRepository.remove(child);

    res.status(200).json({
      success: true,
      message: "Niño eliminado correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar niño:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};