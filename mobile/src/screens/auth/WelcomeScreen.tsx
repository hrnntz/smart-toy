import React, { useRef } from 'react';
import { View, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Label, useThemeColor } from 'heroui-native';
import { CustomBottomSheet } from '../../components/ui/CustomBottomSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const [accentColor] = useThemeColor(['accent']);

  const loginSheetRef = useRef<BottomSheetModal>(null);
  const registerSheetRef = useRef<BottomSheetModal>(null);

  const openLogin = () => loginSheetRef.current?.present();
  const openRegister = () => registerSheetRef.current?.present();

  const closeModals = () => {
    loginSheetRef.current?.dismiss();
    registerSheetRef.current?.dismiss();
  };

  return (
    <View className="flex-1 bg-background justify-end">
      {/* Top section */}
      <View
        style={{ flex: 1 }}
        className="justify-center items-center"
      >
        {/* Large decorative circle */}
        <View
          style={{
            position: 'absolute',
            width: width * 0.85,
            height: width * 0.85,
            borderRadius: 9999,
            backgroundColor: accentColor + '26',
          }}
        />
        {/* Small decorative circle */}
        <View
          style={{
            position: 'absolute',
            width: width * 0.42,
            height: width * 0.42,
            borderRadius: 9999,
            top: height * 0.06,
            right: -16,
            backgroundColor: accentColor + '26',
          }}
        />

        <Image
          source={require('../../../assets/logo.jpg')}
          style={{ width: 150, height: 150, borderRadius: 32 }}
          resizeMode="contain"
        />
        <View className="items-center mt-6">
          <Label className="text-3xl font-extrabold text-foreground">
            PandaAI
          </Label>
          <Label className="text-sm text-muted mt-1">
            Tu compañero inteligente
          </Label>
        </View>
      </View>

      {/* Bottom card */}
      <View className="bg-surface rounded-t-4xl px-6 pt-8 pb-14 items-center">
        <Label className="text-3xl font-extrabold text-foreground text-center mb-3">
          Aprende y Juega con IA
        </Label>
        <Label className="text-base text-muted text-center mb-8 leading-6">
          Conéctate con tu Smart Toy, crea historias, canta nanas y descubre un mundo de diversión y aprendizaje con IA.
        </Label>

        <View className="w-full gap-3 mb-6">
          <Button
            variant="primary"
            onPress={openRegister}
            className="w-full"
            feedbackVariant="scale-ripple"
          >
            <Button.Label>Crear Cuenta</Button.Label>
          </Button>

          <Button
            variant="tertiary"
            onPress={openLogin}
            className="w-full bg-surface-secondary"
          >
            <Button.Label>Iniciar Sesión</Button.Label>
          </Button>
        </View>

        <Label className="text-xs text-muted text-center opacity-80">
          Al usar la app, aceptas nuestros Términos de Uso y Política de Privacidad.
        </Label>
      </View>

      {/* Auth Bottom Sheets */}
      <CustomBottomSheet ref={loginSheetRef} snapPoints={['65%', '90%']}>
        <LoginScreen
          onAuthSuccess={() => {
            closeModals();
            navigation.replace('Home');
          }}
        />
      </CustomBottomSheet>

      <CustomBottomSheet ref={registerSheetRef} snapPoints={['78%', '92%']}>
        <RegisterScreen
          onAuthSuccess={() => {
            closeModals();
            navigation.replace('Home');
          }}
        />
      </CustomBottomSheet>
    </View>
  );
}
