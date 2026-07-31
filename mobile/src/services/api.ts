import axios from 'axios';
import { storage } from './storage';

// Cambia esta IP por la de tu computadora
// Ejecuta 'ipconfig' para encontrar tu IP local
const API_URL = 'http://192.168.1.2:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a cada petición
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Servicios de niños
export const childService = {
  getAll: () => api.get('/child/all'),
  create: (data: { name: string; birthDate?: string }) => api.post('/child', data),
  update: (id: number, data: { name?: string; birthDate?: string }) => api.put(`/child/${id}`, data),
  delete: (id: number) => api.delete(`/child/${id}`),
};

// Servicios de juguetes
export const toyService = {
  getAll: () => api.get('/toy/all'),
  create: (data: { name: string; serialNumber: string; childId?: number }) => api.post('/toy', data),
  update: (id: number, data: any) => api.put(`/toy/${id}`, data),
  delete: (id: number) => api.delete(`/toy/${id}`),
  toggle: (id: number) => api.patch(`/toy/${id}/toggle`),
};

// Servicios de perfil del niño
export const profileService = {
  getProfile: () => api.get('/child/profile'),
  updateProfile: (data: { name?: string; age?: number; language?: string; bedtime?: string; energyLevel?: string; personality?: string }) => 
    api.put('/child/profile', data),
};

// Servicios de configuración
export const configService = {
  getConfig: () => api.get('/config'),
  updateConfig: (data: { deviceName?: string; volume?: number; eyeLights?: boolean; vibration?: boolean; nightMode?: boolean; wifi?: string }) => 
    api.put('/config', data),
};

// Servicios de usuario
export const userService = {
  getProfile: () => api.get('/auth/profile'),
};

// ✅ Servicios de rutinas (separado de userService)
export const rutinaService = {
  getAll: () => api.get('/rutina'),
  create: (data: { nombre: string; hora: string; repetir?: boolean; mensaje?: string; accionAdicional?: string }) => 
    api.post('/rutina', data),
  update: (id: number, data: { nombre?: string; hora?: string; repetir?: boolean; mensaje?: string; accionAdicional?: string }) => 
    api.put(`/rutina/${id}`, data),
  delete: (id: number) => api.delete(`/rutina/${id}`),
};

export default api;