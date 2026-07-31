import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { configService } from '../../services/api';

interface DeviceConfig {
  id: number;
  deviceName: string;
  volume: number;
  eyeLights: boolean;
  vibration: boolean;
  nightMode: boolean;
  wifi: string | null;
}

export default function ConfiguracionScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DeviceConfig>({
    id: 0,
    deviceName: 'Panda',
    volume: 50,
    eyeLights: true,
    vibration: true,
    nightMode: false,
    wifi: null,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await configService.getConfig();
      if (res.data.success && res.data.data) {
        setConfig(res.data.data);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await configService.updateConfig({
        deviceName: config.deviceName,
        volume: config.volume,
        eyeLights: config.eyeLights,
        vibration: config.vibration,
        nightMode: config.nightMode,
        wifi: config.wifi || undefined,
      });
      if (res.data.success) {
        Alert.alert('Éxito', 'Configuración guardada');
      } else {
        Alert.alert('Error', res.data.message || 'No se pudo guardar');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const adjustVolume = (delta: number) => {
    setConfig((c) => ({
      ...c,
      volume: Math.min(100, Math.max(0, c.volume + delta)),
    }));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.title}>Configuración del dispositivo</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Nombre del dispositivo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dispositivo</Text>
        <Text style={styles.label}>Nombre del Panda</Text>
        <TextInput
          style={styles.input}
          value={config.deviceName}
          onChangeText={(text) => setConfig({ ...config, deviceName: text })}
          placeholder="Nombre del dispositivo"
        />
      </View>

      {/* Volumen */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Volumen</Text>
        <View style={styles.volumeRow}>
          <TouchableOpacity onPress={() => adjustVolume(-10)} style={styles.volumeButton}>
            <Ionicons name="remove" size={24} color="#4A90D9" />
          </TouchableOpacity>
          <Ionicons name="volume-medium" size={24} color="#4A90D9" />
          <Text style={styles.volumeText}>{config.volume}%</Text>
          <TouchableOpacity onPress={() => adjustVolume(10)} style={styles.volumeButton}>
            <Ionicons name="add" size={24} color="#4A90D9" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Preferencias */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferencias</Text>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="eye" size={22} color="#4A90D9" />
            <Text style={styles.switchText}>Luces de los ojos</Text>
          </View>
          <Switch
            value={config.eyeLights}
            onValueChange={(value) => setConfig({ ...config, eyeLights: value })}
            trackColor={{ false: '#CCC', true: '#4A90D9' }}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="phone-portrait" size={22} color="#E67E22" />
            <Text style={styles.switchText}>Vibración</Text>
          </View>
          <Switch
            value={config.vibration}
            onValueChange={(value) => setConfig({ ...config, vibration: value })}
            trackColor={{ false: '#CCC', true: '#4A90D9' }}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Ionicons name="moon" size={22} color="#2C3E50" />
            <Text style={styles.switchText}>Modo noche</Text>
          </View>
          <Switch
            value={config.nightMode}
            onValueChange={(value) => setConfig({ ...config, nightMode: value })}
            trackColor={{ false: '#CCC', true: '#4A90D9' }}
          />
        </View>
      </View>

      {/* WiFi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Red WiFi</Text>
        <TextInput
          style={styles.input}
          value={config.wifi || ''}
          onChangeText={(text) => setConfig({ ...config, wifi: text })}
          placeholder="Nombre de la red WiFi"
        />
      </View>

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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
    textAlign: 'center',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  volumeButton: {
    backgroundColor: '#EBF5FB',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    minWidth: 50,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchText: {
    fontSize: 15,
    color: '#34495E',
  },
  saveButton: {
    backgroundColor: '#4A90D9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});