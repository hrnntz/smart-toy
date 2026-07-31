import { Platform } from 'react-native';

/**
 * Configuración central del entorno.
 * En desarrollo, en un dispositivo físico con Expo Go,
 * se debe usar la IP local de la computadora.
 *
 * Opciones:
 * - EXPO_PUBLIC_API_URL: variable de entorno de Expo
 * - Platform.OS === 'android' usa 10.0.2.2 para el emulador de Android
 */
const getDefaultApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  return 'http://localhost:3000/api';
};

export const API_URL = getDefaultApiUrl();