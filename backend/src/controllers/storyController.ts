import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Story } from '../models/Story';
import { AuthRequest } from '../middleware/auth';
import { generateStoryWithImage } from '../services/aiService';

const storyRepository = AppDataSource.getRepository(Story);

export const generateStory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'No autenticado' });
      return;
    }

    const { tema, duracion, personajes, enseñanza } = req.body;
    if (!tema) {
      res.status(400).json({ success: false, message: 'El tema es obligatorio' });
      return;
    }

    // Generar historia e imagen con IA
    const { titulo, contenido, imagen } = await generateStoryWithImage(
      tema,
      duracion,
      personajes,
      enseñanza
    );

    // Guardar en la base de datos
    const story = storyRepository.create({
      titulo,
      contenido,
      imagen,
      duracion,
      user: { id: userId },
    });

    const savedStory = await storyRepository.save(story);

    res.status(201).json({
      success: true,
      data: {
        id: savedStory.id,
        titulo: savedStory.titulo,
        contenido: savedStory.contenido,
        imagen: savedStory.imagen,
        duracion: savedStory.duracion,
      },
    });
  } catch (error) {
    console.error('Error generando historia:', error);
    res.status(500).json({ success: false, message: 'Error al generar la historia' });
  }
};

export const getStories = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'No autenticado' });
      return;
    }

    const stories = await storyRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    res.status(200).json({ success: true, data: stories });
  } catch (error) {
    console.error('Error al obtener historias:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
};

export const deleteStory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const storyId = Number(req.params.id);
    if (!userId) {
      res.status(401).json({ success: false, message: 'No autenticado' });
      return;
    }

    const story = await storyRepository.findOne({
      where: { id: storyId, user: { id: userId } },
    });
    if (!story) {
      res.status(404).json({ success: false, message: 'Historia no encontrada' });
      return;
    }

    await storyRepository.remove(story);
    res.status(200).json({ success: true, message: 'Historia eliminada' });
  } catch (error) {
    console.error('Error al eliminar historia:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
};