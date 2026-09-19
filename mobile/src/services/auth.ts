import { storage } from './storage';
import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
}

export const authService = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  getProfile: () => api.get('/auth/profile'),
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = await storage.getItem('token');
      if (!token) return null;

      const response = await api.get('/auth/profile');
      if (response.data?.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  logout: async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
  },
};