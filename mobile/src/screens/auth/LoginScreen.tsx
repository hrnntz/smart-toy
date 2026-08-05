import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import api from '../../services/api';
import CustomAlert from '../../components/common/CustomAlert';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface LoginScreenProps {
  onAuthSuccess?: () => void;
  navigation?: any; // Mantenemos para compatibilidad con stack antiguo
}

export default function LoginScreen({ onAuthSuccess, navigation }: LoginScreenProps) {
  const { colors, typography } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
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
      if (error?.response?.status === 401) message = '❌ Email o contraseña incorrectos';
      else if (error?.response?.status === 404) message = '❌ Usuario no encontrado';
      showAlert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text, fontSize: typography.size.xl }]}>
        Iniciar Sesión
      </Text>

      <View style={styles.formContainer}>
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

        <TouchableOpacity
          style={styles.rememberContainer}
          onPress={() => setRememberMe(!rememberMe)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, { borderColor: colors.primary }, rememberMe && { backgroundColor: colors.primary }]}>
            {rememberMe && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={[styles.rememberText, { color: colors.text }]}>Recordar sesión</Text>
        </TouchableOpacity>

        <Button
          title="Continuar"
          onPress={handleLogin}
          isLoading={loading}
          style={styles.submitBtn}
        />
        
        {!onAuthSuccess && (
          <Button
            title="¿No tienes cuenta? Regístrate"
            variant="ghost"
            onPress={() => navigation?.navigate('Register')}
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
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rememberText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 16,
  },
});