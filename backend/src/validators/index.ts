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

// ── Nuevos schemas (VULN-007 fix) ──────────────────────────────────────────────

/** Validación completa para actualización de config de dispositivo */
export const updateDeviceConfigSchema = z.object({
  body: z.object({
    deviceName: z.string().min(1).max(100).optional(),
    volume: z.number().int().min(0).max(100).optional(),
    eyeLights: z.boolean().optional(),
    vibration: z.boolean().optional(),
    nightMode: z.boolean().optional(),
    wifi: z.boolean().optional(),
  }),
});

/** Push token — validación reforzada (VULN-010 fix) */
export const updatePushTokenSchema = z.object({
  body: z.object({
    pushToken: z
      .string()
      .min(10, "Push token inválido")
      .max(500, "Push token demasiado largo")
      .regex(/^[A-Za-z0-9_:/-]+$/, "Push token contiene caracteres inválidos"),
  }),
});

/** Rutina (valores estrictos) */
export const rutinaSchema = z.object({
  body: z.object({
    nombre: z.string().min(1).max(100),
    hora: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:MM requerido"),
    repetir: z.boolean().optional(),
    mensaje: z.string().max(500).optional().nullable(),
    accionAdicional: z.string().max(200).optional().nullable(),
  }),
});

/** Creación/actualización de niño */
export const childSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    birthDate: z.string().optional().nullable(),
  }),
});

/** Creación de juguete */
export const createToySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    serialNumber: z.string().min(1).max(100),
    childId: z.number().int().positive().optional().nullable(),
    personality: z.string().max(1000).optional().nullable(),
    context: z.string().max(2000).optional().nullable(),
  }),
});

/** Historia con IA */
export const generateStorySchema = z.object({
  body: z.object({
    tema: z.string().min(1).max(200),
    duracion: z.number().int().min(1).max(60).optional(),
    personajes: z.string().max(500).optional(),
    enseñanza: z.string().max(500).optional(),
  }),
});
