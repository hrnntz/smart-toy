import { Request, Response } from "express";
import { generateGameQuestions } from "../services/aiService";

export const generateQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameName, category, difficulty, count } = req.body;

    if (!gameName || !category) {
      res.status(400).json({
        success: false,
        message: "gameName y category son requeridos",
      });
      return;
    }

    const questionCount = Number(count) || 10;
    const diffLevel = difficulty || "Medio";
    const questions = await generateGameQuestions(gameName, category, diffLevel, questionCount);

    res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    console.error("Error generando preguntas del juego:", error);
    res.status(500).json({
      success: false,
      message: "Error generando preguntas con IA",
    });
  }
};
