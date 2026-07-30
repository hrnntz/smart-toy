import { Request, Response } from "express";

export const childStatus = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: "Child API funcionando"
  });
};