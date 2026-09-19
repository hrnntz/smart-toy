import { Platform } from 'react-native';

/**
 * Configuración central del entorno.
 * Para alternar entre Backend local y Producción (Render):
 * 1. Define EXPO_PUBLIC_API_URL en tu archivo .env
 * 2. O cambia USE_RENDER_BY_DEFAULT a false para desarrollo local (10.0.2.2 o localhost)
 */
const USE_RENDER_BY_DEFAULT = true;
const RENDER_API_URL = 'https://smart-toy.onrender.com/api';

const getDefaultApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (USE_RENDER_BY_DEFAULT && RENDER_API_URL.trim()) {
    return RENDER_API_URL.trim();
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  return 'http://localhost:3000/api';
};

export const API_URL = getDefaultApiUrl();