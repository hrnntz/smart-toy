import { Platform } from 'react-native';

/**
 * Configuración central del entorno.
 * Si pruebas en tu teléfono físico conectado a Render,
 * coloca tu URL de Render en RENDER_API_URL (ej: 'https://tu-app.onrender.com/api')
 * o usa la variable de entorno EXPO_PUBLIC_API_URL.
 */
const RENDER_API_URL = ''; // 👈 Escribe tu URL de Render aquí si no usas variables de entorno

const getDefaultApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  if (RENDER_API_URL.trim()) return RENDER_API_URL.trim();

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  return 'http://localhost:3000/api';
};

export const API_URL = getDefaultApiUrl();