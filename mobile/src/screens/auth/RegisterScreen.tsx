import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import CustomAlert from '../../components/common/CustomAlert';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface RegisterScreenProps {
  onAuthSuccess?: () => void;
  navigation?: any;
}

export default function RegisterScreen({ onAuthSuccess, navigation }: RegisterScreenProps) {
  const { colors, typography } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
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
        showAlert('Éxito', 'Usuario registrado correctamente');
        setTimeout(() => {
          if (navigation) {
            navigation.navigate('Login');
          } else {
            showAlert('Aviso', 'Por favor inicia sesión con tu nueva cuenta');
          }
        }, 1500);
      } else {
        showAlert('Error', response.data.message || 'Error al registrar');
      }
    } catch (error: any) {
      let message = 'Error al conectar con el servidor';
      if (error?.response?.status === 409) message = '❌ Este email ya está registrado. Por favor, usa otro email.';
      else if (error?.response?.status === 400) message = '❌ Datos inválidos. Revisa los campos.';
      showAlert('Error al registrar', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text, fontSize: typography.size.xl }]}>
        Crear Cuenta
      </Text>

      <View style={styles.formContainer}>
        <Input
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
        />

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.passwordContainer}>
          <Input
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={{ paddingRight: 50 }}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Button
          title="Registrarse"
          onPress={handleRegister}
          isLoading={loading}
          style={styles.submitBtn}
        />

        {!onAuthSuccess && (
          <Button
            title="¿Ya tienes cuenta? Inicia sesión"
            variant="ghost"
            onPress={() => navigation?.navigate('Login')}
          />
        )}
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  title: {
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 22,
    zIndex: 10,
  },
  submitBtn: {
    marginTop: 24,
  },
});