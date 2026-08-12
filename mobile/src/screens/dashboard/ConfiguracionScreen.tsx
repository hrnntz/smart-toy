import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { configService } from '../../services/api';
import { Card, Button, Label, TextField, Input, Spinner, useThemeColor, Switch } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

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

  const [primary, separator, background, surface, muted] = useThemeColor([
    'accent',
    'separator',
    'background',
    'surface',
    'muted'
  ]);

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
      <View className="flex-1 justify-center items-center bg-background">
        <Spinner size="lg" color="primary" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-12" showsVerticalScrollIndicator={false}>
      <View className="flex-row justify-between items-center mb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-lg font-bold text-foreground">Configuración del dispositivo</Label>
        <View className="w-10" />
      </View>

      <Card variant="default" className="mb-4 border-0 p-4 shadow-sm">
        <Card.Body className="p-0">
          <Label className="text-base font-bold text-foreground mb-4">Dispositivo</Label>
          <Label className="text-sm font-semibold text-muted mb-1.5">Nombre del Panda</Label>
          <TextField className="w-full">
            <Input
              value={config.deviceName}
              onChangeText={(text) => setConfig({ ...config, deviceName: text })}
              placeholder="Nombre del dispositivo"
            />
          </TextField>
        </Card.Body>
      </Card>

      <Card variant="default" className="mb-4 border-0 p-4 shadow-sm">
        <Card.Body className="p-0">
          <Label className="text-base font-bold text-foreground mb-4">Volumen</Label>
          <View className="flex-row items-center justify-center gap-6">
            <Pressable
              onPress={() => adjustVolume(-10)}
              className="w-12 h-12 rounded-full items-center justify-center bg-primary/10"
            >
              <Ionicons name="remove" size={28} color={primary} />
            </Pressable>
            <Ionicons name="volume-medium" size={26} color={primary} />
            <Label className="text-2xl font-bold text-foreground w-16 text-center">{config.volume}%</Label>
            <Pressable
              onPress={() => adjustVolume(10)}
              className="w-12 h-12 rounded-full items-center justify-center bg-primary/10"
            >
              <Ionicons name="add" size={28} color={primary} />
            </Pressable>
          </View>
        </Card.Body>
      </Card>

      <Card variant="default" className="mb-4 border-0 p-4 shadow-sm">
        <Card.Body className="p-0 gap-0">
          <Label className="text-base font-bold text-foreground mb-2">Preferencias</Label>
          
          <View className="flex-row justify-between items-center py-3 border-b border-separator">
            <View className="flex-row items-center gap-3">
              <Ionicons name="eye" size={22} color={primary} />
              <Label className="text-[15px] font-medium text-foreground">Luces de los ojos</Label>
            </View>
            <Switch
              isSelected={config.eyeLights}
              onSelectedChange={(value: boolean) => setConfig({ ...config, eyeLights: value })}
            />
          </View>

          <View className="flex-row justify-between items-center py-3 border-b border-separator">
            <View className="flex-row items-center gap-3">
              <Ionicons name="phone-portrait" size={22} color="#E67E22" />
              <Label className="text-[15px] font-medium text-foreground">Vibración</Label>
            </View>
            <Switch
              isSelected={config.vibration}
              onSelectedChange={(value: boolean) => setConfig({ ...config, vibration: value })}
            />
          </View>

          <View className="flex-row justify-between items-center py-3">
            <View className="flex-row items-center gap-3">
              <Ionicons name="moon" size={22} color="#2C3E50" />
              <Label className="text-[15px] font-medium text-foreground">Modo noche</Label>
            </View>
            <Switch
              isSelected={config.nightMode}
              onSelectedChange={(value: boolean) => setConfig({ ...config, nightMode: value })}
            />
          </View>
        </Card.Body>
      </Card>

      <Card variant="default" className="mb-4 border-0 p-4 shadow-sm">
        <Card.Body className="p-0">
          <Label className="text-base font-bold text-foreground mb-4">Red WiFi</Label>
          <TextField className="w-full">
            <Input
              value={config.wifi || ''}
              onChangeText={(text) => setConfig({ ...config, wifi: text })}
              placeholder="Nombre de la red WiFi"
            />
          </TextField>
        </Card.Body>
      </Card>

      <Button
        variant="primary"
        onPress={handleSave}
        isDisabled={saving}
        className="w-full mb-10"
      >
        {saving ? <Spinner size="sm" color="default" /> : <Button.Label>Guardar configuración</Button.Label>}
      </Button>
    </ScrollView>
  );
}