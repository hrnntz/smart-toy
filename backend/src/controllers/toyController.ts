import { Request, Response } from "express";

export const toyStatus = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: "Toy API funcionando"
  });
};  