import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { configService } from '../../services/api';
import { Card, Button, Label, TextField, Input, Spinner, useThemeColor, TextArea } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

export default function ConfiguracionScreen({ navigation }: any) {
  const [deviceName, setDeviceName] = useState('');
  const [childName, setChildName] = useState('');
  const [personality, setPersonality] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accent, muted, surface, background] = useThemeColor([
    'accent', 'muted', 'surface', 'background'
  ]);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    try {
      const res = await configService.getConfig();
      if (res.data.success && res.data.data) {
        const cfg = res.data.data;
        setDeviceName(cfg.deviceName || '');

        setPersonality(cfg.personality || '');
        setVoiceId(cfg.voiceId || '');
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await configService.updateConfig({ deviceName, personality, voiceId } as any);
      Alert.alert('Éxito', 'Configuración guardada');
    } catch (error) { Alert.alert('Error', 'No se pudo guardar'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0D0F16]">
        <Spinner size="lg" color="primary" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0D0F16] pt-12">
      <View className="flex-row justify-between items-center px-4 pb-4 border-b border-white/10">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-lg font-bold text-white flex-1 text-center mr-8">Configuración</Label>
        <Pressable className="absolute right-4 top-0 h-10 justify-center" onPress={handleSave}>
          <Ionicons name="checkmark" size={24} color={accent} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card variant="default" className="mb-6 rounded-3xl bg-surface border-0 overflow-hidden">
          <Card.Body className="p-6 items-center flex-row gap-4">
            <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(232, 83, 63, 0.15)' }}>
              <Label className="text-3xl">🐼</Label>
            </View>
            <View className="flex-1">
              <Label className="text-lg font-extrabold text-white">Personaliza a tu Panda</Label>
              <Label className="text-xs text-muted mt-1 leading-4">Ajusta cómo interactúa y suena el juguete para tu hijo.</Label>
            </View>
          </Card.Body>
        </Card>

        <View className="mb-6">
          <Label className="text-sm font-bold text-white mb-3 uppercase tracking-wider" style={{ color: accent } as any}>Identidad</Label>
          <View className="gap-4">
            <View>
              <Label className="text-sm font-medium text-white mb-1.5 ml-1">Nombre del dispositivo</Label>
              <TextField className="w-full">
                <Input
                  value={deviceName}
                  onChangeText={setDeviceName}
                  placeholder="Ej: Panda Mágico"
                  className="bg-surface text-white border-0"
                  placeholderTextColor={muted}
                />
              </TextField>
            </View>
            
            <View>
              <Label className="text-sm font-medium text-white mb-1.5 ml-1">Nombre del niño</Label>
              <TextField className="w-full">
                <Input
                  value={childName}
                  onChangeText={setChildName}
                  placeholder="Ej: Leo"
                  className="bg-surface text-white border-0"
                  placeholderTextColor={muted}
                />
              </TextField>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Label className="text-sm font-bold text-white mb-3 uppercase tracking-wider" style={{ color: accent } as any}>Personalidad</Label>
          <View>
            <Label className="text-sm font-medium text-white mb-1.5 ml-1">Personalidad de la IA</Label>
            <TextField className="w-full h-24">
              <Input
                value={personality}
                onChangeText={setPersonality}
                placeholder="Alegre, curioso, amable..."
                className="bg-surface text-white border-0"
                placeholderTextColor={muted}
                multiline
                textAlignVertical="top"
              />
            </TextField>
          </View>
        </View>

        <View className="mb-8">
          <Label className="text-sm font-bold text-white mb-3 uppercase tracking-wider" style={{ color: accent } as any}>Voz</Label>
          <View>
            <Label className="text-sm font-medium text-white mb-1.5 ml-1">ID de Voz (ElevenLabs)</Label>
            <TextField className="w-full">
              <Input
                value={voiceId}
                onChangeText={setVoiceId}
                placeholder="ID de la voz"
                className="bg-surface text-white border-0"
                placeholderTextColor={muted}
              />
            </TextField>
          </View>
        </View>

        <Button
          variant="primary"
          feedbackVariant="scale-ripple"
          onPress={handleSave}
          isDisabled={saving}
          className="w-full rounded-2xl py-4"
          style={{ backgroundColor: accent }}
        >
          {saving ? <Spinner size="sm" color="white" /> : <Button.Label className="text-white font-bold text-base">Guardar configuración</Button.Label>}
        </Button>
      </ScrollView>
    </View>
  );
}