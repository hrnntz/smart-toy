import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Checkbox,
  Input,
  Label,
  TextField,
  useThemeColor,
  cn,
} from 'heroui-native';
import { storage } from '../../services/storage';
import api from '../../services/api';
import CustomAlert from '../../components/common/CustomAlert';

interface LoginScreenProps {
  onAuthSuccess?: () => void;
  navigation?: any;
}

export default function LoginScreen({ onAuthSuccess, navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'error'>('info');

  const muted = useThemeColor('muted');

  const showAlert = (title: string, message: string, type: 'info' | 'error' = 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const token = response.data.data.token;
        const user = response.data.data.user;

        await storage.setItem('token', token);
        if (rememberMe) {
          await storage.setItem('user', JSON.stringify(user));
        } else {
          await storage.removeItem('user');
        }

        if (onAuthSuccess) {
          onAuthSuccess();
        } else if (navigation) {
          navigation.replace('Home');
        }
      } else {
        showAlert('Error', response.data.message || 'Credenciales incorrectas');
      }
    } catch (error: any) {
      let message = 'Error al conectar con el servidor';
      if (error?.response?.status === 401) message = 'Email o contraseña incorrectos';
      else if (error?.response?.status === 404) message = 'Usuario no encontrado';
      showAlert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="pb-5">
      {/* Título */}
      <Label className="text-2xl font-bold text-center text-foreground mb-5">
        Iniciar Sesión
      </Label>

      <View className="w-full gap-1">
        {/* Campo Email */}
        <TextField className="w-full">
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </TextField>

        {/* Campo Contraseña */}
        <TextField className="w-full">
          <View className="w-full flex-row items-center">
            <Input
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              className="flex-1 pr-12"
            />
            <Pressable
              className="absolute right-4 z-10"
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={8}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={muted}
              />
            </Pressable>
          </View>
        </TextField>

        {/* Recordar sesión */}
        <Pressable
          className="flex-row items-center gap-2.5 my-3"
          onPress={() => setRememberMe(!rememberMe)}
        >
          <Checkbox
            isSelected={rememberMe}
            onSelectedChange={setRememberMe}
          />
          <Label className="text-sm font-medium text-foreground">
            Recordar sesión
          </Label>
        </Pressable>

        {/* Botón principal */}
        <Button
          variant="primary"
          isDisabled={loading}
          onPress={handleLogin}
          className="w-full mt-2"
        >
          {loading ? (
            <Button.Label>Cargando...</Button.Label>
          ) : (
            <Button.Label>Continuar</Button.Label>
          )}
        </Button>

        {/* Link a registro */}
        {!onAuthSuccess && (
          <Button
            variant="ghost"
            onPress={() => navigation?.navigate('Register')}
            className="w-full"
          >
            <Button.Label>¿No tienes cuenta? Regístrate</Button.Label>
          </Button>
        )}
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}