import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { configService } from '../../services/api';

export default function ConfiguracionScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    deviceName: 'PandaAI',
    volume: 70,
    eyeLights: true,
    vibration: true,
    nightMode: true,
    wifi: 'MiCasa_5G',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await configService.getConfig();
      if (response.data.success) {
        setConfig(response.data.data);
      }
    } catch (error) {
      console.log('Usando configuración de ejemplo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await configService.updateConfig(config);
      Alert.alert('Éxito', 'Configuración actualizada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => navigation.replace('Login'),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Dispositivo Panda */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dispositivo Panda</Text>

        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>Nombre del dispositivo</Text>
          <TextInput
            style={styles.menuInput}
            value={config.deviceName}
            onChangeText={(text) => setConfig({ ...config, deviceName: text })}
          />
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>Volumen</Text>
          <View style={styles.volumeRow}>
            <TouchableOpacity
              onPress={() => setConfig({ ...config, volume: Math.max(0, config.volume - 10) })}
            >
              <Ionicons name="remove-circle" size={28} color="#4A90D9" />
            </TouchableOpacity>
            <Text style={styles.volumeText}>{config.volume}%</Text>
            <TouchableOpacity
              onPress={() => setConfig({ ...config, volume: Math.min(100, config.volume + 10) })}
            >
              <Ionicons name="add-circle" size={28} color="#4A90D9" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>Luces de ojos</Text>
          <Switch
            value={config.eyeLights}
            onValueChange={(value) => setConfig({ ...config, eyeLights: value })}
            trackColor={{ false: '#ddd', true: '#4A90D9' }}
          />
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>Vibración</Text>
          <Switch
            value={config.vibration}
            onValueChange={(value) => setConfig({ ...config, vibration: value })}
            trackColor={{ false: '#ddd', true: '#4A90D9' }}
          />
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>Modo nocturno (8 PM - 7 AM)</Text>
          <Switch
            value={config.nightMode}
            onValueChange={(value) => setConfig({ ...config, nightMode: value })}
            trackColor={{ false: '#ddd', true: '#4A90D9' }}
          />
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>Conexión WiFi</Text>
          <TextInput
            style={styles.menuInput}
            value={config.wifi}
            onChangeText={(text) => setConfig({ ...config, wifi: text })}
            placeholder="Nombre de la red WiFi"
          />
        </View>
      </View>

      {/* Información */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>

        <View style={styles.menuItem}>
          <Ionicons name="information-circle" size={22} color="#7F8C8D" />
          <Text style={styles.menuText}>Versión de la app: 1.0.0</Text>
        </View>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle" size={22} color="#7F8C8D" />
          <Text style={styles.menuText}>Soporte técnico</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" style={styles.menuArrow} />
        </TouchableOpacity>
      </View>

      {/* Botones */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar configuración</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={24} color="white" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuLabel: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  menuInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
    textAlign: 'right',
    padding: 0,
  },
  menuText: {
    fontSize: 14,
    color: '#2C3E50',
    marginLeft: 10,
    flex: 1,
  },
  menuArrow: {
    marginLeft: 'auto',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  volumeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    width: 40,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4A90D9',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#E74C3C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 30,
  },
  logoutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});