import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Input,
  Label,
  TextField,
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

  const muted = useThemeColor('muted');

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
        showAlert('Éxito', 'Usuario registrado correctamente', 'success');
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
      {/* Título */}
      <Label className="text-2xl font-bold text-center text-foreground mb-5">
        Crear Cuenta
      </Label>

      <View className="w-full gap-1">
        {/* Campo Nombre */}
        <TextField className="w-full">
          <Input
            placeholder="Nombre"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </TextField>

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

        {/* Botón principal */}
        <Button
          variant="primary"
          isDisabled={loading}
          onPress={handleRegister}
          className="w-full mt-4"
        >
          {loading ? (
            <Button.Label>Creando cuenta...</Button.Label>
          ) : (
            <Button.Label>Registrarse</Button.Label>
          )}
        </Button>

        {/* Link a login */}
        {!onAuthSuccess && (
          <Button
            variant="ghost"
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