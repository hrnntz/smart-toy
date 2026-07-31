import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { storage } from './storage';

// ============================================
// 1. CONFIGURACIÓN PARA NOTIFICACIONES EN MÓVIL
// ============================================

// Configurar el comportamiento de las notificaciones en móvil
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // ✅ Agregado para evitar error de tipo
    shouldShowList: true,   // ✅ Agregado para evitar error de tipo
  }),
});

// ============================================
// 2. FUNCIÓN PARA ENVIAR NOTIFICACIONES (web y móvil)
// ============================================

export const sendNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  if (Platform.OS === 'web') {
    // ---------- WEB: usar Notification API o alerta interna ----------
    try {
      // Si el navegador soporta Notification API y tenemos permiso
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico', // Opcional: icono de la app
        });
        return;
      }

      // Si no tenemos permiso, pedirlo
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
          });
          return;
        }
      }

      // Fallback: mostrar un toast/alert visual interno (puedes personalizar)
      console.log(`🔔 [Notificación web] ${title}: ${body}`);
      // Aquí puedes llamar a un sistema de toasts si tienes uno (ej. react-native-toast-message)
      // showToast({ type: 'info', text1: title, text2: body });
    } catch (error) {
      console.warn('Error en notificación web:', error);
    }
  } else {
    // ---------- MÓVIL: usar expo-notifications ----------
    try {
      // Obtener el token de notificación (si necesitas enviar desde backend)
      // const token = await Notifications.getExpoPushTokenAsync();
      // console.log('📱 Expo Push Token:', token);

      // Programar notificación local inmediata (o usar push)
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
          priority: 'high',
        },
        trigger: null, // null = inmediata
      });

      console.log(`📱 Notificación enviada: ${title}`);
    } catch (error) {
      console.error('Error al enviar notificación móvil:', error);
    }
  }
};

// ============================================
// 3. FUNCIÓN PARA PROGRAMAR NOTIFICACIONES (solo móvil)
// ============================================

export const scheduleNotification = async (
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
  data?: any
): Promise<string | undefined> => {
  if (Platform.OS === 'web') {
    console.warn('⏰ Programación de notificaciones no soportada en web.');
    return undefined;
  }

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        priority: 'high',
      },
      trigger,
    });
    console.log(`⏰ Notificación programada con ID: ${identifier}`);
    return identifier;
  } catch (error) {
    console.error('Error al programar notificación:', error);
    return undefined;
  }
};

// ============================================
// 4. CANCELAR NOTIFICACIÓN (solo móvil)
// ============================================

export const cancelNotification = async (identifier: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log(`🗑️ Notificación cancelada: ${identifier}`);
  } catch (error) {
    console.error('Error al cancelar notificación:', error);
  }
};

// ============================================
// 5. LIMPIAR TODAS LAS NOTIFICACIONES
// ============================================

export const clearAllNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    console.warn('🧹 Limpieza de notificaciones no soportada en web.');
    return;
  }
  try {
    await Notifications.dismissAllNotificationsAsync();
    console.log('🧹 Todas las notificaciones limpiadas');
  } catch (error) {
    console.error('Error al limpiar notificaciones:', error);
  }
};

// ============================================
// 6. OBTENER PERMISOS (web y móvil)
// ============================================

export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error al pedir permisos:', error);
    return false;
  }
};

// ============================================
// 7. INICIAR ESCUCHA DE NOTIFICACIONES (solo móvil)
// ============================================

// Para manejar notificaciones cuando la app está en primer plano
export const addNotificationListener = (
  callback: (notification: Notifications.Notification) => void
): void => {
  if (Platform.OS === 'web') return;
  Notifications.addNotificationReceivedListener(callback);
};

// Para manejar cuando el usuario toca una notificación
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
): void => {
  if (Platform.OS === 'web') return;
  Notifications.addNotificationResponseReceivedListener(callback);
};