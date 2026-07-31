    import { storage } from './storage';
    import api from './api';

    export interface User {
    id: number;
    name: string;
    email: string;
    createdAt?: string;
    }

    export const authService = {
    getProfile: async (): Promise<User | null> => {
        try {
        const token = await storage.getItem('token');
        if (!token) {
            console.log('🔑 No hay token guardado');
            return null;
        }

        console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
        
        const response = await api.get('/auth/profile');
        console.log('👤 Respuesta del perfil:', response.data);
        
        if (response.data.success) {
            return response.data.data;
        }
        return null;
        } catch (error: any) {
        console.error('❌ Error obteniendo perfil:', error.response?.data || error.message);
        return null;
        }
    },

    logout: async () => {
        await storage.removeItem('token');
        console.log('🔑 Sesión cerrada');
    },
    };