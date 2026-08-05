import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import RootNavigator from './src/navigation/RootNavigator';
import { requestPermissions } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Solicitar permisos de notificaciones al iniciar la app
    const setupNotifications = async () => {
      const granted = await requestPermissions();
      if (granted) {
        console.log('📢 Permiso de notificaciones concedido');
      } else {
        console.log('📢 Permiso de notificaciones denegado');
      }
    };
    setupNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <RootNavigator />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}