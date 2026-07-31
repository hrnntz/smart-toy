import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Toy } from "../models/Toy";
import { Child } from "../models/Child";
import { AuthRequest } from "../middleware/auth";

const toyRepository = AppDataSource.getRepository(Toy);
const childRepository = AppDataSource.getRepository(Child);

export const toyStatus = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: "Toy API funcionando"
  });
};

// Obtener todos los juguetes del usuario autenticado
export const getToys = async (
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

    const toys = await toyRepository.find({
      where: { child: { user: { id: userId } } },
      relations: ["child"]
    });

    res.status(200).json({
      success: true,
      data: toys
    });
  } catch (error) {
    console.error("Error al obtener juguetes:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Crear un nuevo juguete
export const createToy = async (
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

    const { name, serialNumber, childId } = req.body;

    if (!name || !serialNumber) {
      res.status(400).json({
        success: false,
        message: "Nombre y número de serie son obligatorios"
      });
      return;
    }

    // Verificar que el niño existe y pertenece al usuario
    let child = null;
    if (childId) {
      child = await childRepository.findOne({
        where: { id: childId, user: { id: userId } }
      });

      if (!child) {
        res.status(404).json({
          success: false,
          message: "Niño no encontrado"
        });
        return;
      }
    }

    // Verificar que el número de serie no esté duplicado
    const existingToy = await toyRepository.findOne({
      where: { serialNumber }
    });

    if (existingToy) {
      res.status(409).json({
        success: false,
        message: "El número de serie ya está registrado"
      });
      return;
    }

    const toy = toyRepository.create({
      name,
      serialNumber,
      child: child || null,
      isConnected: false
    });

    const savedToy = await toyRepository.save(toy);

    res.status(201).json({
      success: true,
      message: "Juguete creado correctamente",
      data: savedToy
    });
  } catch (error) {
    console.error("Error al crear juguete:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Actualizar un juguete
export const updateToy = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const toyId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
      return;
    }

    const { name, serialNumber, childId, isConnected } = req.body;

    const toy = await toyRepository.findOne({
      where: { id: toyId, child: { user: { id: userId } } },
      relations: ["child"]
    });

    if (!toy) {
      res.status(404).json({
        success: false,
        message: "Juguete no encontrado"
      });
      return;
    }

    if (name) toy.name = name;
    if (serialNumber) toy.serialNumber = serialNumber;
    if (isConnected !== undefined) toy.isConnected = isConnected;

    if (childId !== undefined) {
      if (childId === null) {
        toy.child = null;
      } else {
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

        toy.child = child;
      }
    }

    const updatedToy = await toyRepository.save(toy);

    res.status(200).json({
      success: true,
      message: "Juguete actualizado correctamente",
      data: updatedToy
    });
  } catch (error) {
    console.error("Error al actualizar juguete:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Eliminar un juguete
export const deleteToy = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const toyId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
      return;
    }

    const toy = await toyRepository.findOne({
      where: { id: toyId, child: { user: { id: userId } } }
    });

    if (!toy) {
      res.status(404).json({
        success: false,
        message: "Juguete no encontrado"
      });
      return;
    }

    await toyRepository.remove(toy);

    res.status(200).json({
      success: true,
      message: "Juguete eliminado correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar juguete:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Conectar/desconectar juguete
export const toggleToyConnection = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const toyId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
      return;
    }

    const toy = await toyRepository.findOne({
      where: { id: toyId, child: { user: { id: userId } } }
    });

    if (!toy) {
      res.status(404).json({
        success: false,
        message: "Juguete no encontrado"
      });
      return;
    }

    toy.isConnected = !toy.isConnected;
    const updatedToy = await toyRepository.save(toy);

    res.status(200).json({
      success: true,
      message: toy.isConnected ? "Juguete conectado" : "Juguete desconectado",
      data: updatedToy
    });
  } catch (error) {
    console.error("Error al conectar/desconectar juguete:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};