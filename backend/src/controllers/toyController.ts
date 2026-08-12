// backend/src/controllers/toyController.ts
import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Toy } from "../models/Toy";
import { Child } from "../models/Child";
import { Message } from "../models/Message";
import { AuthRequest } from "../middleware/auth";
import { getAIResponse, transcribeAudioWithWhisper, ChatHistoryMessage } from "../services/aiService";
import { generateSpeechFromText } from "../services/elevenlabsService";

const toyRepository = AppDataSource.getRepository(Toy);
const childRepository = AppDataSource.getRepository(Child);
const messageRepository = AppDataSource.getRepository(Message);

// ✅ Generar avatar con Pollinations.ai (gratuito, sin clave)
const generateAvatar = (toyName: string): string => {
  const prompt = encodeURIComponent(`${toyName} toy cute cartoon character, colorful, friendly face, kawaii style`);
  return `https://image.pollinations.ai/prompt/${prompt}?width=300&height=300&seed=${encodeURIComponent(toyName)}`;
};

export const toyStatus = (_req: Request, res: Response): void => {
  res.json({ success: true, message: "Toy API funcionando" });
};

export const getToys = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado" });
      return;
    }
    const toys = await toyRepository.find({
      where: { user: { id: userId } },
      relations: ["child"],
    });
    res.status(200).json({ success: true, data: toys });
  } catch (error) {
    console.error("Error al obtener juguetes:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

export const createToy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado" });
      return;
    }

    const { name, serialNumber, childId, personality, context } = req.body;
    if (!name || !serialNumber) {
      res.status(400).json({ success: false, message: "Nombre y número de serie son obligatorios" });
      return;
    }

    let child = null;
    if (childId) {
      child = await childRepository.findOne({ where: { id: childId, user: { id: userId } } });
      if (!child) {
        res.status(404).json({ success: false, message: "Niño no encontrado" });
        return;
      }
    }

    const existingToy = await toyRepository.findOne({ where: { serialNumber } });
    if (existingToy) {
      res.status(409).json({ success: false, message: "El número de serie ya está registrado" });
      return;
    }

    // ✅ Generar avatar con Pollinations
    const avatarUrl = generateAvatar(name);

    const toy = toyRepository.create({
      name,
      serialNumber,
      child: child || null,
      user: { id: userId },
      personality: personality || null,
      context: context || null,
      avatarUrl,
      isConnected: false,
    });

    const savedToy = await toyRepository.save(toy);
    res.status(201).json({ success: true, message: "Juguete creado correctamente", data: savedToy });
  } catch (error) {
    console.error("Error al crear juguete:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

export const updateToy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const toyId = Number(req.params.id);
    if (!userId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado" });
      return;
    }

    const { name, serialNumber, childId, isConnected, personality, context } = req.body;
    const toy = await toyRepository.findOne({
      where: { id: toyId, user: { id: userId } },
      relations: ["child"],
    });

    if (!toy) {
      res.status(404).json({ success: false, message: "Juguete no encontrado" });
      return;
    }

    if (name) {
      toy.name = name;
      toy.avatarUrl = generateAvatar(name); // ✅ Actualizar avatar si cambia el nombre
    }
    if (serialNumber) toy.serialNumber = serialNumber;
    if (isConnected !== undefined) toy.isConnected = isConnected;
    if (personality !== undefined) toy.personality = personality;
    if (context !== undefined) toy.context = context;

    if (childId !== undefined) {
      if (childId === null) {
        toy.child = null;
      } else {
        const child = await childRepository.findOne({ where: { id: childId, user: { id: userId } } });
        if (!child) {
          res.status(404).json({ success: false, message: "Niño no encontrado" });
          return;
        }
        toy.child = child;
      }
    }

    const updatedToy = await toyRepository.save(toy);
    res.status(200).json({ success: true, message: "Juguete actualizado correctamente", data: updatedToy });
  } catch (error) {
    console.error("Error al actualizar juguete:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

export const deleteToy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const toyId = Number(req.params.id);
    if (!userId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado" });
      return;
    }

    const toy = await toyRepository.findOne({ where: { id: toyId, user: { id: userId } } });
    if (!toy) {
      res.status(404).json({ success: false, message: "Juguete no encontrado" });
      return;
    }

    await toyRepository.remove(toy);
    res.status(200).json({ success: true, message: "Juguete eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar juguete:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

export const toggleToyConnection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const toyId = Number(req.params.id);
    if (!userId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado" });
      return;
    }

    const toy = await toyRepository.findOne({ where: { id: toyId, user: { id: userId } } });
    if (!toy) {
      res.status(404).json({ success: false, message: "Juguete no encontrado" });
      return;
    }

    toy.isConnected = !toy.isConnected;
    const updatedToy = await toyRepository.save(toy);
    res.status(200).json({
      success: true,
      message: toy.isConnected ? "Juguete conectado" : "Juguete desconectado",
      data: updatedToy,
    });
  } catch (error) {
    console.error("Error al conectar/desconectar juguete:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

export const chatWithToy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const toyId = Number(req.params.id);
    if (!userId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado" });
      return;
    }

    const { message } = req.body;
    if (!message) {
      res.status(400).json({ success: false, message: "Mensaje requerido" });
      return;
    }

    const toy = await toyRepository.findOne({ where: { id: toyId, user: { id: userId } } });
    if (!toy) {
      res.status(404).json({ success: false, message: "Juguete no encontrado" });
      return;
    }

    // Obtener los últimos 15 mensajes para proporcionar contexto a la IA
    const pastMessages = await messageRepository.find({
      where: { toy: { id: toyId } },
      order: { createdAt: "DESC" },
      take: 15,
    });

    const history: ChatHistoryMessage[] = pastMessages
      .reverse()
      .map((msg) => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content,
      }));

    const reply = await getAIResponse(message, toy.name, toy.personality, toy.context, history);
    res.status(200).json({ success: true, data: { reply } });
  } catch (error) {
    console.error("Error en chat:", error);
    res.status(500).json({ success: false, message: "Error al procesar el mensaje" });
  }
};

// Interacción por voz con ElevenLabs TTS y Groq Whisper STT
export const voiceChatWithToy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const toyId = Number(req.params.id);
    const { voiceId } = req.body;
    let message = req.body.message;

    if (!userId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado" });
      return;
    }

    // Si el usuario grabó audio desde el micrófono, transcribirlo con Groq Whisper
    if (req.file) {
      // VULN-006 fix: usando import estático en lugar de require() dinámico
      const transcribedText = await transcribeAudioWithWhisper(req.file.path);
      if (transcribedText) {
        message = transcribedText;
      }
      try {
        const fs = await import("fs");
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (err) {}
    }

    if (!message) {
      message = "¡Hola Panda!";
    }

    const toy = await toyRepository.findOne({ where: { id: toyId, user: { id: userId } } });
    if (!toy) {
      res.status(404).json({ success: false, message: "Juguete no encontrado" });
      return;
    }

    // Historial para contexto
    const pastMessages = await messageRepository.find({
      where: { toy: { id: toyId } },
      order: { createdAt: "DESC" },
      take: 15,
    });

    const history: ChatHistoryMessage[] = pastMessages
      .reverse()
      .map((msg) => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content,
      }));

    const replyText = await getAIResponse(message, toy.name, toy.personality, toy.context, history);
    
    // Convertir respuesta de texto a voz con ElevenLabs
    // VULN-006 fix: usando import estático en lugar de require() dinámico
    const audioDataUrl = await generateSpeechFromText(replyText, voiceId);

    // Guardar historial en la base de datos
    const userMsg = messageRepository.create({ toy, content: message, isUser: true });
    const botMsg = messageRepository.create({ toy, content: replyText, isUser: false });
    await messageRepository.save([userMsg, botMsg]);

    res.status(200).json({
      success: true,
      data: {
        userText: message,
        replyText,
        audioUrl: audioDataUrl,
      },
    });
  } catch (error) {
    console.error("Error en voiceChatWithToy:", error);
    res.status(500).json({ success: false, message: "Error procesando voz con IA" });
  }
};  