import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { CustomBottomSheet } from '../../components/ui/CustomBottomSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

// Importamos las vistas de Login y Register para renderizarlas dentro del Bottom Sheet
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { colors, typography, spacing, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const loginSheetRef = useRef<BottomSheetModal>(null);
  const registerSheetRef = useRef<BottomSheetModal>(null);

  const openLogin = () => loginSheetRef.current?.present();
  const openRegister = () => registerSheetRef.current?.present();

  const closeModals = () => {
    loginSheetRef.current?.dismiss();
    registerSheetRef.current?.dismiss();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F0F9FF' }]}>
      {/* Área Superior Gráfica (Inspirado en Family) */}
      <View style={styles.topArea}>
        <View style={[styles.circlePlaceholder, { backgroundColor: colors.primary + '20' }]} />
        <View style={[styles.circlePlaceholderSmall, { backgroundColor: colors.secondary + '30' }]} />
        <Image
          source={require('../../../assets/logo.jpg')}
          style={{ width: 150, height: 150, borderRadius: 32 }}
          resizeMode="contain"
        />
      </View>

      {/* Tarjeta Inferior Blanca/Oscura con bordes 4xl */}
      <View style={[styles.bottomCard, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Aprende y Juega</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Conéctate con tu Smart Toy, crea historias, canta nanas y descubre un mundo de diversión y aprendizaje con IA.
        </Text>

        <View style={styles.buttonContainer}>
          <Button title="Crear Cuenta" onPress={openRegister} />
          <Button title="Iniciar Sesión" variant="outline" onPress={openLogin} />
        </View>

        <Text style={[styles.terms, { color: colors.textSecondary }]}>
          Al usar la app, aceptas nuestros Términos de Uso y Política de Privacidad.
        </Text>
      </View>

      {/* Modales de Autenticación con Gorhom Bottom Sheet */}
      <CustomBottomSheet ref={loginSheetRef} snapPoints={['65%', '90%']}>
        {/* Pasamos closeModals si el componente hijo lo necesita para cerrarse */}
        <LoginScreen onAuthSuccess={() => {
            closeModals();
            navigation.replace('Home');
        }} />
      </CustomBottomSheet>

      <CustomBottomSheet ref={registerSheetRef} snapPoints={['75%', '90%']}>
        <RegisterScreen onAuthSuccess={() => {
            closeModals();
            navigation.replace('Home');
        }} />
      </CustomBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end', // Empuja la tarjeta hacia abajo
  },
  topArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circlePlaceholder: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 9999,
  },
  circlePlaceholderSmall: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: 9999,
    top: height * 0.1,
    right: -20,
  },
  bottomCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
});
