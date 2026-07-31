import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/auth";

const userRepository = AppDataSource.getRepository(User);

export const authStatus = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: "Auth API funcionando"
  });
};

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Nombre, email y contraseña son obligatorios"
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres"
      });
      return;
    }

    const existingUser = await userRepository.findOne({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "El email ya está registrado"
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = userRepository.create({
      name,
      email,
      password: hashedPassword
    });

    const savedUser = await userRepository.save(user);

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({
        success: false,
        message: "JWT_SECRET no está configurado"
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: savedUser.id,
        email: savedUser.email
      },
      secret,
      {
        expiresIn: "7d"
      }
    );

    res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente",
      data: {
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email
        },
        token
      }
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email y contraseña son obligatorios"
      });
      return;
    }

    const user = await userRepository.findOne({
      where: { email }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Email o contraseña incorrectos"
      });
      return;
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValid) {
      res.status(401).json({
        success: false,
        message: "Email o contraseña incorrectos"
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({
        success: false,
        message: "JWT_SECRET no está configurado"
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      secret,
      {
        expiresIn: "7d"
      }
    );

    res.status(200).json({
      success: true,
      message: "Login exitoso",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Obtener perfil del usuario autenticado
export const getProfile = async (
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

    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'createdAt']
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Error en getProfile:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};