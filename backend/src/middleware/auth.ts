import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Token de autenticación requerido"
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      success: false,
      message: "JWT_SECRET no está configurado"
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.userId !== "number" ||
      typeof decoded.email !== "string"
    ) {
      res.status(401).json({
        success: false,
        message: "Token inválido"
      });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Token inválido o expirado"
    });
  }
};