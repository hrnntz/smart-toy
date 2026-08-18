import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Checkbox,
  Input,
  Label,
  TextField,
  Spinner,
  useThemeColor,
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

  const [accent, muted] = useThemeColor(['accent', 'muted']);

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
      {/* ── Title ── */}
      <View className="items-center mb-6">
        <View className="w-16 h-16 rounded-3xl bg-accent/12 items-center justify-center mb-3">
          <Ionicons name="person-outline" size={30} color={accent} />
        </View>
        <Label className="text-2xl font-extrabold text-foreground">Iniciar Sesión</Label>
        <Label className="text-sm text-muted mt-0.5">Accede a tu cuenta PandaAI</Label>
      </View>

      <View className="w-full gap-2.5">
        {/* Email */}
        <TextField className="w-full">
          <Input
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </TextField>

        {/* Password */}
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

        {/* Remember Me */}
        <Pressable
          className="flex-row items-center gap-2.5 mt-1 mb-2"
          onPress={() => setRememberMe(!rememberMe)}
        >
          <Checkbox isSelected={rememberMe} onSelectedChange={setRememberMe} />
          <Label className="text-sm font-medium text-foreground">Recordar sesión</Label>
        </Pressable>

        {/* Login Button */}
        <Button
          variant="primary"
          isDisabled={loading}
          onPress={handleLogin}
          feedbackVariant="scale-ripple"
          className="w-full"
        >
          {loading ? (
            <Spinner size="sm" color="default" />
          ) : (
            <Button.Label>Iniciar Sesión</Button.Label>
          )}
        </Button>

        {/* Register Link */}
        {!onAuthSuccess && (
          <Button
            variant="tertiary"
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