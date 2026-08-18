// backend/src/controllers/englishController.ts
import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Child } from "../models/Child";
import { EnglishProgress } from "../models/EnglishProgress";
import { EnglishThemeContent } from "../models/EnglishThemeContent";
import { AuthRequest } from "../middleware/auth";
import { generateEnglishThemeWords, transcribeAudioWithWhisper } from "../services/aiService";
import { generateSpeechFromText } from "../services/elevenlabsService";
import fs from "fs";

const childRepository = AppDataSource.getRepository(Child);
const progressRepository = AppDataSource.getRepository(EnglishProgress);
const themeContentRepository = AppDataSource.getRepository(EnglishThemeContent);

// Secuencia fija de temas, estilo Duolingo: cada uno se desbloquea al terminar el anterior.
export const ENGLISH_THEMES = [
  { key: "colores", label: "Colores", emoji: "🎨" },
  { key: "animales", label: "Animales", emoji: "🐶" },
  { key: "casa", label: "La casa y sus partes", emoji: "🏠" },
  { key: "dia_a_dia", label: "Vocabulario y frases del día", emoji: "☀️" },
  { key: "colegio", label: "Colegio", emoji: "🎒" },
];

const NIVELES = [
  "A1 - Principiante",
  "A1 - Básico",
  "A2 - Elemental",
  "A2 - Intermedio bajo",
  "B1 - Intermedio",
];

const nivelPorPalabras = (palabras: number): string => {
  const idx = Math.min(Math.floor(palabras / 15), NIVELES.length - 1);
  return NIVELES[idx];
};

// Genera la URL de una ilustración simple para la palabra (Pollinations.ai, gratis y sin API key,
// igual que las imágenes de las historias).
const buildWordImageUrl = (englishWord: string): string => {
  const prompt = encodeURIComponent(
    `${englishWord}, simple cute flashcard illustration for children, colorful, white background, no text`
  );
  return `https://image.pollinations.ai/prompt/${prompt}?width=400&height=400&seed=${encodeURIComponent(
    englishWord
  )}`;
};

// Busca el niño a usar: el childId indicado, o si no, el primer niño del usuario autenticado.
const resolveChild = async (userId: number, childIdParam?: string | number): Promise<Child | null> => {
  const childId = childIdParam ? Number(childIdParam) : undefined;
  const where: any = { user: { id: userId } };
  if (childId) where.id = childId;
  return childRepository.findOne({ where });
};

const getOrCreateProgress = async (child: Child): Promise<EnglishProgress> => {
  let progress = await progressRepository.findOne({ where: { child: { id: child.id } } });
  if (!progress) {
    progress = progressRepository.create({ child });
    progress = await progressRepository.save(progress);
  }
  return progress;
};

// GET /api/english/themes?childId=
export const getThemes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado" });
      return;
    }

    const child = await resolveChild(userId, req.query.childId as string);
    if (!child) {
      res.status(404).json({ success: false, message: "No se encontró un niño para este usuario. Crea un perfil de niño primero." });
      return;
    }

    const progress = await getOrCreateProgress(child);

    const themes = ENGLISH_THEMES.map((theme, index) => ({
      ...theme,
      order: index,
      unlocked: index <= progress.currentThemeIndex,
      completed: index < progress.currentThemeIndex,
    }));

    res.status(200).json({
      success: true,
      data: {
        childId: child.id,
        themes,
        progress: {
          nivel: progress.nivel,
          palabrasAprendidas: progress.palabrasAprendidas,
          racha: progress.racha,
          planDiarioMin: progress.planDiarioMin,
          currentThemeIndex: progress.currentThemeIndex,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener temas de inglés:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// GET /api/english/theme/:themeKey/content?childId=
export const getThemeContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado" });
      return;
    }

    // Express 5 tipa los params como `string | string[]` (por rutas con parámetros repetidos).
    // En nuestra ruta siempre es un solo string, así que lo normalizamos aquí.
    const themeKeyParam = req.params.themeKey;
    const themeKey = Array.isArray(themeKeyParam) ? themeKeyParam[0] : themeKeyParam;
    const themeIndex = ENGLISH_THEMES.findIndex((t) => t.key === themeKey);
    const theme = ENGLISH_THEMES[themeIndex];
    if (!theme) {
      res.status(404).json({ success: false, message: "Tema no encontrado" });
      return;
    }

    const child = await resolveChild(userId, req.query.childId as string);
    if (!child) {
      res.status(404).json({ success: false, message: "No se encontró un niño para este usuario" });
      return;
    }

    const progress = await getOrCreateProgress(child);
    if (themeIndex > progress.currentThemeIndex) {
      res.status(403).json({ success: false, message: "Este tema todavía está bloqueado" });
      return;
    }

    // ✅ Revisar caché primero — así no gastamos IA de nuevo en el mismo tema
    let cached = await themeContentRepository.findOne({ where: { themeKey } });
    let words: { english: string; spanish: string }[];

    if (cached) {
      words = JSON.parse(cached.contentJson);
    } else {
      words = await generateEnglishThemeWords(theme.label, 6);
      cached = themeContentRepository.create({ themeKey, contentJson: JSON.stringify(words) });
      await themeContentRepository.save(cached);
    }

    const wordsWithImages = words.map((w, i) => ({
      id: i,
      english: w.english,
      spanish: w.spanish,
      imageUrl: buildWordImageUrl(w.english),
    }));

    res.status(200).json({
      success: true,
      data: { theme, words: wordsWithImages },
    });
  } catch (error) {
    console.error("Error al obtener contenido del tema:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// POST /api/english/speak  { text, voiceId? }
export const speak = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, voiceId } = req.body;
    if (!text) {
      res.status(400).json({ success: false, message: "Texto requerido" });
      return;
    }
    const audioUrl = await generateSpeechFromText(text, voiceId);
    res.status(200).json({ success: true, data: { audioUrl } });
  } catch (error) {
    console.error("Error generando voz de inglés:", error);
    res.status(500).json({ success: false, message: "Error generando el audio" });
  }
};

// Compara lo que dijo el niño (transcrito por Whisper) contra la palabra objetivo,
// tolerando variaciones pequeñas (mayúsculas, puntuación, "the dog" vs "dog").
const normalize = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");

const isPronunciationCorrect = (target: string, said: string): boolean => {
  const t = normalize(target);
  const s = normalize(said);
  if (!s) return false;
  if (s === t) return true;
  if (s.includes(t) || t.includes(s)) return true;
  const tWords = t.split(" ").filter(Boolean);
  const sWords = new Set(s.split(" ").filter(Boolean));
  if (tWords.length === 0) return false;
  const matched = tWords.filter((w) => sWords.has(w)).length;
  return matched / tWords.length >= 0.7;
};

// POST /api/english/check-pronunciation  (multipart: audio, targetText)
export const checkPronunciation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetText } = req.body;
    if (!targetText) {
      res.status(400).json({ success: false, message: "targetText requerido" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: "Audio requerido" });
      return;
    }

    const transcribed = await transcribeAudioWithWhisper(req.file.path);
    try {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch (err) {}

    const correct = isPronunciationCorrect(targetText, transcribed);

    const feedbackText = correct
      ? "¡Muy bien! 🎉"
      : `Casi, escúchame de nuevo: ${targetText}`;
    const feedbackAudioUrl = await generateSpeechFromText(feedbackText);

    res.status(200).json({
      success: true,
      data: { correct, transcribed, feedbackText, feedbackAudioUrl },
    });
  } catch (error) {
    console.error("Error verificando pronunciación:", error);
    res.status(500).json({ success: false, message: "Error verificando la pronunciación" });
  }
};

// POST /api/english/complete-theme  { themeKey, correctCount, totalCount, childId? }
export const completeTheme = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Usuario no autenticado" });
      return;
    }

    const { themeKey, correctCount, totalCount, childId } = req.body;
    const themeIndex = ENGLISH_THEMES.findIndex((t) => t.key === themeKey);
    if (themeIndex === -1) {
      res.status(404).json({ success: false, message: "Tema no encontrado" });
      return;
    }

    const child = await resolveChild(userId, childId);
    if (!child) {
      res.status(404).json({ success: false, message: "No se encontró un niño para este usuario" });
      return;
    }

    const progress = await getOrCreateProgress(child);

    const today = new Date().toISOString().slice(0, 10);
    if (progress.ultimaLeccionFecha !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      progress.racha = progress.ultimaLeccionFecha === yesterday ? progress.racha + 1 : 1;
      progress.ultimaLeccionFecha = today;
    }

    progress.palabrasAprendidas += Number(correctCount) || 0;
    progress.nivel = nivelPorPalabras(progress.palabrasAprendidas);

    const ratio = totalCount ? Number(correctCount) / Number(totalCount) : 0;
    if (ratio >= 0.6 && themeIndex === progress.currentThemeIndex) {
      progress.currentThemeIndex = Math.min(themeIndex + 1, ENGLISH_THEMES.length);
    }

    await progressRepository.save(progress);

    res.status(200).json({
      success: true,
      message: "Progreso guardado",
      data: {
        nivel: progress.nivel,
        palabrasAprendidas: progress.palabrasAprendidas,
        racha: progress.racha,
        currentThemeIndex: progress.currentThemeIndex,
        themeUnlocked: ratio >= 0.6 && themeIndex === progress.currentThemeIndex - 1,
      },
    });
  } catch (error) {
    console.error("Error guardando progreso de inglés:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};
