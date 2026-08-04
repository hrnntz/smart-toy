import { Request, Response } from "express";
import { generateAIMusicTrack } from "../services/aiService";

export const generateMusic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ success: false, message: "Prompt de música requerido" });
      return;
    }

    const track = await generateAIMusicTrack(prompt);
    res.status(200).json({
      success: true,
      data: track,
    });
  } catch (error) {
    console.error("Error generando música con IA:", error);
    res.status(500).json({ success: false, message: "Error al generar la música" });
  }
};
