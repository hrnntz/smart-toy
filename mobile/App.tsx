import 'react-native-gesture-handler';
import './global.css';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { HeroUINativeProvider, type HeroUINativeConfig } from 'heroui-native';
import RootNavigator from './src/navigation/RootNavigator';
import { requestPermissions } from './src/services/notificationService';

const heroUIConfig: HeroUINativeConfig = {
  textProps: {
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.5,
  },
  textInputProps: {
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.5,
  },
  toast: {
    defaultProps: {
      variant: 'default',
      placement: 'top',
    },
    insets: {
      top: 0,
      bottom: 6,
      left: 12,
      right: 12,
    },
    maxVisibleToasts: 3,
  },
};

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
        <HeroUINativeProvider config={heroUIConfig}>
          <BottomSheetModalProvider>
            <RootNavigator />
          </BottomSheetModalProvider>
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}