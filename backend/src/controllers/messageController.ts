import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Message } from "../models/Message";
import { Toy } from "../models/Toy";
import { AuthRequest } from "../middleware/auth";

const messageRepository = AppDataSource.getRepository(Message);
const toyRepository = AppDataSource.getRepository(Toy);

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const toyId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({ success: false, message: "No autenticado" });
      return;
    }

    const toy = await toyRepository.findOne({
      where: { id: toyId, user: { id: userId } },
    });
    if (!toy) {
      res.status(404).json({ success: false, message: "Juguete no encontrado" });
      return;
    }

    const messages = await messageRepository.find({
      where: { toy: { id: toyId }, user: { id: userId } },
      order: { createdAt: "ASC" },
    });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
};

export const saveMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const toyId = Number(req.params.id);
    const { content, isUser } = req.body;

    if (!userId || !content) {
      res.status(400).json({ success: false, message: "Datos incompletos" });
      return;
    }

    const toy = await toyRepository.findOne({
      where: { id: toyId, user: { id: userId } },
    });
    if (!toy) {
      res.status(404).json({ success: false, message: "Juguete no encontrado" });
      return;
    }

    const message = messageRepository.create({
      content,
      isUser,
      toy,
      user: { id: userId },
    });

    await messageRepository.save(message);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error("Error al guardar mensaje:", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
};