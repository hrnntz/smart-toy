import { Request, Response } from "express";

export const authStatus = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: "Auth API funcionando"
  });
};