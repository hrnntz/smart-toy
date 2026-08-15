import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { DeviceConfig } from "../models/DeviceConfig";
import { AuthRequest } from "../middleware/auth";

const configRepository = AppDataSource.getRepository(DeviceConfig);

export const configStatus = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: "Config API funcionando"
  });
};

// Obtener la configuración del dispositivo del usuario autenticado
export const getConfig = async (
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

    let config = await configRepository.findOne({
      where: { user: { id: userId } }
    });

    // Si no existe, crear una configuración por defecto
    if (!config) {
      config = configRepository.create({
        user: { id: userId }
      });
      config = await configRepository.save(config);
    }

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Actualizar la configuración del dispositivo
export const updateConfig = async (
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

    let config = await configRepository.findOne({
      where: { user: { id: userId } }
    });

    if (!config) {
      config = configRepository.create({
        user: { id: userId }
      });
    }

    const {
      deviceName,
      volume,
      eyeLights,
      vibration,
      nightMode,
      wifi
    } = req.body;

    if (deviceName !== undefined) config.deviceName = deviceName;
    if (volume !== undefined) config.volume = volume;
    if (eyeLights !== undefined) config.eyeLights = eyeLights;
    if (vibration !== undefined) config.vibration = vibration;
    if (nightMode !== undefined) config.nightMode = nightMode;
    if (wifi !== undefined) config.wifi = wifi;

    const updatedConfig = await configRepository.save(config);

    res.status(200).json({
      success: true,
      message: "Configuración actualizada correctamente",
      data: updatedConfig
    });
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Actualizar push token para notificaciones
export const updatePushToken = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { pushToken } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
      return;
    }

    let config = await configRepository.findOne({
      where: { user: { id: userId } }
    });

    if (!config) {
      config = configRepository.create({
        user: { id: userId }
      });
    }

    // Guardar el pushToken en la configuración
    (config as any).pushToken = pushToken;
    await configRepository.save(config);

    res.status(200).json({
      success: true,
      message: "Push Token registrado correctamente",
      data: { pushToken }
    });
  } catch (error) {
    console.error("Error guardando push token:", error);
    res.status(500).json({
      success: false,
      message: "Error registrando push token"
    });
  }
};