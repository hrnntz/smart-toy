import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(1, "La contraseña es requerida"),
  }),
});

export const childProfileSchema = z.object({
  body: z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
    edad: z.number().min(0, "La edad debe ser mayor o igual a 0").max(18, "Edad fuera de rango").optional(),
    intereses: z.array(z.string()).optional(),
  }),
});

export const createRutinaSchema = z.object({
  body: z.object({
    nombre: z.string().min(1, "El nombre de la rutina es requerido"),
    hora: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora debe ser HH:MM"),
    dias: z.array(z.string()).min(1, "Debe seleccionar al menos un día"),
    actividad: z.string().min(1, "La actividad es requerida"),
    activa: z.boolean().optional(),
  }),
});

export const updateConfigSchema = z.object({
  body: z.object({
    volumen: z.number().min(0).max(100).optional(),
    modoSueno: z.boolean().optional(),
    limiteTiempoMinutos: z.number().min(0).optional(),
    idioma: z.string().optional(),
  }),
});

export const pushTokenSchema = z.object({
  body: z.object({
    pushToken: z.string().min(5, "Push token inválido"),
  }),
});
