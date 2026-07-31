import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import api from '../../services/api';
import CustomAlert from '../../components/common/CustomAlert';

export default function LoginScreen({ navigation }: any) {
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

        console.log('✅ Login exitoso');
        console.log('👤 Usuario:', user);
        console.log('🔑 Token:', token.substring(0, 20) + '...');
        console.log('📌 Remember me:', rememberMe);

        // Guardar token siempre
        await storage.setItem('token', token);

        // Guardar usuario solo si "Recordar sesión" está activado
        if (rememberMe) {
          console.log('💾 Guardando usuario en storage');
          await storage.setItem('user', JSON.stringify(user));
        } else {
          console.log('🗑️ Eliminando usuario guardado');
          await storage.removeItem('user');
        }

        showAlert('Éxito', 'Login exitoso');
        setTimeout(() => {
          navigation.replace('Home');
        }, 1500);
      } else {
        showAlert('Error', response.data.message || 'Credenciales incorrectas');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      let message = 'Error al conectar con el servidor';
      
      if (error && error.response) {
        const status = error.response.status;
        
        if (status === 401) {
          message = '❌ Email o contraseña incorrectos';
        } else if (status === 404) {
          message = '❌ Usuario no encontrado';
        } else if (status === 500) {
          message = '❌ Error interno del servidor';
        } else {
          message = error.response.data?.message || 'Error al iniciar sesión';
        }
      } else if (error && error.request) {
        message = '❌ No se pudo conectar con el servidor';
      } else {
        message = error?.message || 'Error desconocido';
      }
      
      showAlert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Toy</Text>
      <Text style={styles.subtitle}>Iniciar Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color="#7F8C8D"
          />
        </TouchableOpacity>
      </View>

      {/* Checkbox "Recordar sesión" */}
      <View style={styles.rememberContainer}>
        <TouchableOpacity
          style={styles.rememberCheckbox}
          onPress={() => setRememberMe(!rememberMe)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={styles.rememberText}>Recordar sesión</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>

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
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4A90D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#4A90D9',
  },
  rememberText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    color: '#3498db',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});