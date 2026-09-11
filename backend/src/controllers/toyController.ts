// backend/src/controllers/toyController.ts
import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Toy } from "../models/Toy";
import { Child } from "../models/Child";
import { Message } from "../models/Message";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { getAIResponse, transcribeAudioWithWhisper, ChatHistoryMessage } from "../services/aiService";
import { generateSpeechFromText } from "../services/elevenlabsService";
import { getIO } from "../socket";

const toyRepository = AppDataSource.getRepository(Toy);
const childRepository = AppDataSource.getRepository(Child);
const messageRepository = AppDataSource.getRepository(Message);
const userRepository = AppDataSource.getRepository(User);

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
    let toys = await toyRepository.find({
      where: { user: { id: userId } },
      relations: ["child"],
    });

    // Si el usuario no tiene ningún juguete aún, crear Panda por defecto
    if (toys.length === 0) {
      const user = await userRepository.findOne({ where: { id: userId } });
      if (user) {
        const defaultToy = toyRepository.create({
          name: "Panda",
          serialNumber: `PANDA-${userId}`,
          avatarUrl: "https://image.pollinations.ai/prompt/Panda%20toy%20cute%20cartoon%20character%2C%20colorful%2C%20friendly%20face%2C%20kawaii%20style?width=300&height=300&seed=Panda",
          user: user,
          isConnected: true,
          batteryLevel: 100,
          batteryMah: 6600,
          batteryHours: 41.2,
        });
        await toyRepository.save(defaultToy);
        toys = [defaultToy];
      }
    }

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
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: "Mensaje requerido" });
      return;
    }

    let toyName = "Panda";
    let toyPersonality = "amable, divertido, cariñoso y siempre ayuda a los niños";
    let toyContext = "un adorable oso panda de peluche inteligente";
    let history: ChatHistoryMessage[] = [];
    let toyEntity: any = null;

    if (userId) {
      let toy = await toyRepository.findOne({ where: { id: toyId, user: { id: userId } } });
      if (!toy) {
        toy = await toyRepository.findOne({ where: { user: { id: userId } } });
      }
      if (!toy) {
        const user = await userRepository.findOne({ where: { id: userId } });
        if (user) {
          toy = toyRepository.create({
            name: "Panda",
            serialNumber: `PANDA-${userId}`,
            user: user,
            isConnected: true,
          });
          await toyRepository.save(toy);
        }
      }
      if (toy) {
        toyEntity = toy;
        toyName = toy.name || toyName;
        toyPersonality = toy.personality || toyPersonality;
        toyContext = toy.context || toyContext;

        const pastMessages = await messageRepository.find({
          where: { toy: { id: toy.id } },
          order: { createdAt: "DESC" },
          take: 15,
        });

        history = pastMessages
          .reverse()
          .map((msg) => ({
            role: msg.isUser ? "user" : "assistant",
            content: msg.content,
          }));
      }
    }

    const reply = await getAIResponse(message, toyName, toyPersonality, toyContext, history);

    if (toyEntity) {
      try {
        const userMsg = messageRepository.create({ toy: toyEntity, content: message, isUser: true });
        const botMsg = messageRepository.create({ toy: toyEntity, content: reply, isUser: false });
        await messageRepository.save([userMsg, botMsg]);
      } catch (saveErr) {
        console.warn("No se pudo guardar historial:", saveErr);
      }
    }

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
    let message = req.body?.message;

    // Si el usuario grabó audio desde el micrófono, transcribirlo con Groq Whisper
    if (req.file) {
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

    let toyName = "Panda";
    let toyPersonality = "amable, divertido, cariñoso y siempre ayuda a los niños";
    let toyContext = "un adorable oso panda de peluche inteligente";
    let history: ChatHistoryMessage[] = [];
    let toyEntity: any = null;

    if (userId) {
      let toy = await toyRepository.findOne({ where: { id: toyId, user: { id: userId } } });
      if (!toy) {
        toy = await toyRepository.findOne({ where: { user: { id: userId } } });
      }
      if (!toy) {
        const user = await userRepository.findOne({ where: { id: userId } });
        if (user) {
          toy = toyRepository.create({
            name: "Panda",
            serialNumber: `PANDA-${userId}`,
            user: user,
            isConnected: true,
          });
          await toyRepository.save(toy);
        }
      }
      if (toy) {
        toyEntity = toy;
        toyName = toy.name || toyName;
        toyPersonality = toy.personality || toyPersonality;
        toyContext = toy.context || toyContext;

        const pastMessages = await messageRepository.find({
          where: { toy: { id: toy.id } },
          order: { createdAt: "DESC" },
          take: 15,
        });

        history = pastMessages
          .reverse()
          .map((msg) => ({
            role: msg.isUser ? "user" : "assistant",
            content: msg.content,
          }));
      }
    }

    const replyText = await getAIResponse(message, toyName, toyPersonality, toyContext, history);
    
    // Convertir respuesta de texto a voz con ElevenLabs
    const audioDataUrl = await generateSpeechFromText(replyText, voiceId);

    // Guardar historial en la base de datos si hay juguete asociado
    if (toyEntity) {
      try {
        const userMsg = messageRepository.create({ toy: toyEntity, content: message, isUser: true });
        const botMsg = messageRepository.create({ toy: toyEntity, content: replyText, isUser: false });
        await messageRepository.save([userMsg, botMsg]);
      } catch (saveErr) {
        console.warn("No se pudo guardar historial:", saveErr);
      }
    }

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

// ==========================================
// 📡 NUEVAS FUNCIONES DE TELEMETRÍA Y CONTROL
// ==========================================

// Cola en memoria de comandos pendientes para cada juguete (por serial)
const pendingToyCommands: Record<string, string> = {};

// ✅ 1. Reportar telemetría desde el ESP32 (o simulador)
export const reportTelemetry = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      serialNumber,
      batteryLevel,
      batteryMah,
      batteryHours,
      sensorStatus,
      isHugging,
    } = req.body;

    if (!serialNumber) {
      res.status(400).json({ success: false, message: "serialNumber es requerido" });
      return;
    }

    const cleanSerial = String(serialNumber || "").trim().toLowerCase();

    // Buscar coincidencia de forma 100% segura sin errores de sintaxis SQL
    const allToys = await toyRepository.find({ relations: ["user", "child"] });
    let toy = allToys.find(
      (t) => t.serialNumber && t.serialNumber.trim().toLowerCase() === cleanSerial
    );

    // Si no coincide exactamente, buscar si uno contiene al otro (ej. 'toy-001' con 'toy-001-abc')
    if (!toy) {
      toy = allToys.find(
        (t) =>
          t.serialNumber &&
          (cleanSerial.includes(t.serialNumber.trim().toLowerCase()) ||
           t.serialNumber.trim().toLowerCase().includes(cleanSerial))
      );
    }

    // Fallback: Si no coincide pero existe un juguete en la BD, vincular al primer juguete
    if (!toy && allToys.length > 0) {
      toy = allToys[0];
      toy.serialNumber = serialNumber;
    }

    if (!toy) {
      res.status(404).json({ success: false, message: "No hay juguetes registrados en el sistema" });
      return;
    }

    // Comprobar si hay un comando pendiente para este juguete
    let pendingCommand: string | null = null;
    for (const [key, cmd] of Object.entries(pendingToyCommands)) {
      if (
        key === serialNumber ||
        key.toLowerCase() === cleanSerial ||
        key.toLowerCase() === toy.serialNumber.toLowerCase() ||
        cleanSerial.includes(key.toLowerCase()) ||
        key.toLowerCase().includes(cleanSerial)
      ) {
        pendingCommand = cmd;
        delete pendingToyCommands[key];
        break;
      }
    }

    // Detectar nuevo abrazo iniciado
    const estabaAbrazando = toy.isHugging;
    const ahoraAbraza = Boolean(isHugging);

    if (!estabaAbrazando && ahoraAbraza) {
      toy.hugCount = (toy.hugCount || 0) + 1;
      toy.lastHugAt = new Date();
    }

    toy.isConnected = true;
    if (batteryLevel !== undefined) toy.batteryLevel = Number(batteryLevel);
    if (batteryMah !== undefined) toy.batteryMah = Number(batteryMah);
    if (batteryHours !== undefined) toy.batteryHours = Number(batteryHours);
    if (sensorStatus !== undefined) toy.sensorStatus = String(sensorStatus);
    if (isHugging !== undefined) toy.isHugging = ahoraAbraza;

    await toyRepository.save(toy);

    // Notificar en tiempo real a los clientes conectados (App Móvil del padre)
    try {
      const io = getIO();
      const payload = {
        toyId: toy.id,
        serialNumber: toy.serialNumber,
        name: toy.name,
        isConnected: true,
        batteryLevel: toy.batteryLevel,
        batteryMah: toy.batteryMah,
        batteryHours: toy.batteryHours,
        sensorStatus: toy.sensorStatus,
        isHugging: toy.isHugging,
        hugCount: toy.hugCount,
        lastHugAt: toy.lastHugAt,
      };

      io.to(`toy:${toy.id}`).emit("toy:status_changed", payload);
      if (toy.user?.id) {
        io.to(`parent:${toy.user.id}`).emit("toy:status_changed", payload);
      }
    } catch (socketErr) {
      // Ignorar si socket no está listo
    }

    res.status(200).json({
      success: true,
      command: pendingCommand,
      data: {
        id: toy.id,
        name: toy.name,
        batteryLevel: toy.batteryLevel,
        batteryMah: toy.batteryMah,
        batteryHours: toy.batteryHours,
        sensorStatus: toy.sensorStatus,
        isHugging: toy.isHugging,
        hugCount: toy.hugCount,
        lastHugAt: toy.lastHugAt,
      },
    });
  } catch (error: any) {
    console.error("Error al reportar telemetría:", error);
    res.status(500).json({ success: false, message: error?.message || "Error procesando telemetría" });
  }
};

// ✅ 2. Obtener estado y telemetría de un juguete específico
export const getToyTelemetry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const toy = await toyRepository.findOne({
      where: { id: Number(id), user: { id: userId } },
      relations: ["child"],
    });

    if (!toy) {
      res.status(404).json({ success: false, message: "Juguete no encontrado" });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: toy.id,
        name: toy.name,
        serialNumber: toy.serialNumber,
        isConnected: toy.isConnected,
        batteryLevel: toy.batteryLevel,
        batteryMah: toy.batteryMah,
        batteryHours: toy.batteryHours,
        sensorStatus: toy.sensorStatus,
        isHugging: toy.isHugging,
        hugCount: toy.hugCount,
        lastHugAt: toy.lastHugAt,
        child: toy.child ? { id: toy.child.id, name: toy.child.name } : null,
      },
    });
  } catch (error) {
    console.error("Error obteniendo telemetría:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// ✅ 3. Enviar acción o comando remoto al juguete (ej. abrazo remoto)
export const triggerToyAction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "HUG", "OPEN_ARMS", "RESET_BATTERY"
    const userId = req.user?.userId;

    const toy = await toyRepository.findOne({
      where: { id: Number(id), user: { id: userId } },
    });

    if (!toy) {
      res.status(404).json({ success: false, message: "Juguete no encontrado" });
      return;
    }

    // Si la acción es resetear batería:
    if (action === "RESET_BATTERY") {
      toy.batteryLevel = 100.0;
      toy.batteryMah = 6600.0;
      toy.batteryHours = 41.2;
      await toyRepository.save(toy);
    } else if (action === "HUG") {
      toy.isHugging = true;
      toy.hugCount = (toy.hugCount || 0) + 1;
      toy.lastHugAt = new Date();
      await toyRepository.save(toy);
    }

    // Registrar comando pendiente para que el ESP32 lo recoja en su siguiente petición HTTP
    pendingToyCommands[toy.serialNumber] = action;
    pendingToyCommands[toy.serialNumber.toLowerCase()] = action;
    pendingToyCommands["TOY-001-ABC"] = action;
    pendingToyCommands["toy-001-abc"] = action;
    pendingToyCommands["TOY-001"] = action;
    pendingToyCommands["toy-001"] = action;

    // Emitir comando por WebSockets a los canales del juguete
    try {
      const io = getIO();
      io.to(`toy:${toy.id}`).emit("toy:command", { action, timestamp: Date.now() });
      io.to(`parent:${userId}`).emit("toy:status_changed", {
        toyId: toy.id,
        isHugging: toy.isHugging,
        hugCount: toy.hugCount,
        lastHugAt: toy.lastHugAt,
        batteryLevel: toy.batteryLevel,
      });
    } catch (socketErr) {
      // Ignorar si socket no está listo
    }

    res.status(200).json({
      success: true,
      message: `Acción '${action}' transmitida exitosamente`,
      data: { action, isHugging: toy.isHugging, hugCount: toy.hugCount },
    });
  } catch (error) {
    console.error("Error ejecutando acción de juguete:", error);
    res.status(500).json({ success: false, message: "Error ejecutando acción" });
  }
};
  