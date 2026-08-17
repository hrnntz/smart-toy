import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Input,
  Label,
  TextField,
  Spinner,
  useThemeColor,
} from 'heroui-native';
import api from '../../services/api';
import CustomAlert from '../../components/common/CustomAlert';

interface RegisterScreenProps {
  onAuthSuccess?: () => void;
  navigation?: any;
}

export default function RegisterScreen({ onAuthSuccess, navigation }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'error' | 'success'>('error');

  const [accent, muted] = useThemeColor(['accent', 'muted']);

  const showAlert = (
    title: string,
    message: string,
    type: 'info' | 'error' | 'success' = 'error'
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      showAlert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      showAlert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', { name, email, password });

      if (response.data.success) {
        showAlert('¡Listo!', 'Cuenta creada correctamente. Bienvenido a PandaAI 🐼', 'success');
        setTimeout(() => {
          if (navigation) {
            navigation.navigate('Login');
          } else {
            showAlert('Aviso', 'Por favor inicia sesión con tu nueva cuenta', 'info');
          }
        }, 1500);
      } else {
        showAlert('Error', response.data.message || 'Error al registrar');
      }
    } catch (error: any) {
      let message = 'Error al conectar con el servidor';
      if (error?.response?.status === 409)
        message = 'Este email ya está registrado. Por favor, usa otro email.';
      else if (error?.response?.status === 400)
        message = 'Datos inválidos. Revisa los campos.';
      showAlert('Error al registrar', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="pb-5">
      {/* ── Title ── */}
      <View className="items-center mb-6">
        <View className="w-16 h-16 rounded-3xl bg-accent/12 items-center justify-center mb-3">
          <Ionicons name="person-add-outline" size={30} color={accent} />
        </View>
        <Label className="text-2xl font-extrabold text-foreground">Crear Cuenta</Label>
        <Label className="text-sm text-muted mt-0.5">Únete a la familia PandaAI</Label>
      </View>

      <View className="w-full gap-2.5">
        {/* Name */}
        <TextField className="w-full">
          <Input
            placeholder="Nombre completo"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </TextField>

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
              placeholder="Contraseña (mín. 6 caracteres)"
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

        {/* Terms note */}
        <Label className="text-xs text-muted text-center px-4 mb-1">
          Al registrarte aceptas nuestros términos de uso y política de privacidad.
        </Label>

        {/* Register Button */}
        <Button
          variant="primary"
          isDisabled={loading}
          onPress={handleRegister}
          feedbackVariant="scale-ripple"
          className="w-full"
        >
          {loading ? (
            <Spinner size="sm" color="default" />
          ) : (
            <Button.Label>Crear cuenta 🐼</Button.Label>
          )}
        </Button>

        {/* Login Link */}
        {!onAuthSuccess && (
          <Button
            variant="tertiary"
            onPress={() => navigation?.navigate('Login')}
            className="w-full"
          >
            <Button.Label>¿Ya tienes cuenta? Inicia sesión</Button.Label>
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