import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { childService } from '../../services/api';
import { Card, Button, Label, TextField, Input, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

export default function PerfilScreen({ navigation, route }: any) {
  const child = route?.params?.child;
  const isEditing = !!child;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: child?.id || 0,
    name: child?.name || '',
    birthDate: child?.birthDate || '',
    age: '',
    language: 'Español',
    bedtime: '08:30 PM',
    energyLevel: 'Media',
    personality: 'Amigable y divertido',
  });

  const [accent, danger, muted, surfaceSecondary] = useThemeColor([
    'accent',
    'danger',
    'muted',
    'surface-secondary',
  ]);

  useEffect(() => {
    if (child) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [child]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const response = await childService.update(formData.id, {
        name: formData.name,
        birthDate: formData.birthDate || undefined,
      });

      if (response.data.success) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data.message || 'No se pudo actualizar');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Spinner size="lg" color="primary" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View className="flex-row items-center gap-2 px-4 pt-14 pb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="flex-1 text-2xl font-extrabold text-foreground text-center">
          {isEditing ? 'Editar Perfil' : 'Nuevo Perfil'}
        </Label>
        <View className="w-10" />
      </View>

      <View className="px-4">
        {/* ── Banner ── */}
        <Card variant="default" className="mb-5">
          <Card.Body>
            <View className="items-center py-3">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: accent + '18' }}
              >
                <Label className="text-4xl">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : '👶'}
                </Label>
              </View>
              <Label className="text-lg font-bold text-foreground">
                {formData.name || 'Nuevo perfil'}
              </Label>
              <Label className="text-xs text-muted mt-0.5">
                Perfil de niño · PandaAI
              </Label>
            </View>
          </Card.Body>
        </Card>

        {/* ── Sección: Identidad ── */}
        <Label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">
          Identidad
        </Label>
        <Card variant="default" className="mb-4">
          <Card.Body>
            <View className="gap-4">
              <View>
                <Label className="text-sm font-semibold text-foreground mb-1.5">
                  Nombre del niño *
                </Label>
                <TextField className="w-full">
                  <Input
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Nombre del niño"
                    autoCapitalize="words"
                  />
                </TextField>
              </View>

              <View>
                <Label className="text-sm font-semibold text-foreground mb-1.5">
                  Fecha de nacimiento
                </Label>
                <TextField className="w-full">
                  <Input
                    value={formData.birthDate}
                    onChangeText={(text) => setFormData({ ...formData, birthDate: text })}
                    placeholder="YYYY-MM-DD (ej: 2020-05-15)"
                    keyboardType="numeric"
                  />
                </TextField>
              </View>

              <View>
                <Label className="text-sm font-semibold text-foreground mb-1.5">
                  Idioma
                </Label>
                <TextField className="w-full">
                  <Input
                    value={formData.language}
                    onChangeText={(text) => setFormData({ ...formData, language: text })}
                    placeholder="Idioma"
                  />
                </TextField>
              </View>

              <View>
                <Label className="text-sm font-semibold text-foreground mb-1.5">
                  Hora de dormir
                </Label>
                <TextField className="w-full">
                  <Input
                    value={formData.bedtime}
                    onChangeText={(text) => setFormData({ ...formData, bedtime: text })}
                    placeholder="Ej: 08:30 PM"
                  />
                </TextField>
              </View>
            </View>
          </Card.Body>
        </Card>

        {/* ── Sección: Nivel de Energía ── */}
        <Label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">
          Nivel de Energía
        </Label>
        <Card variant="default" className="mb-4">
          <Card.Body>
            <View className="flex-row gap-2">
              {['Baja', 'Media', 'Alta'].map((level) => {
                const isActive = formData.energyLevel === level;
                const levelColors: Record<string, string> = {
                  'Baja': '#10B981',
                  'Media': '#F59E0B',
                  'Alta': '#EF4444',
                };
                const c = levelColors[level];
                return (
                  <Pressable
                    key={level}
                    className="flex-1 py-3 rounded-2xl items-center"
                    style={{
                      backgroundColor: isActive ? c + '18' : surfaceSecondary,
                      borderWidth: isActive ? 1.5 : 0,
                      borderColor: isActive ? c : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, energyLevel: level })}
                  >
                    <Label
                      className="text-sm font-bold"
                      style={{ color: isActive ? c : muted } as any}
                    >
                      {level}
                    </Label>
                  </Pressable>
                );
              })}
            </View>
          </Card.Body>
        </Card>

        {/* ── Sección: Personalidad ── */}
        <Label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">
          Personalidad de Panda
        </Label>
        <Card variant="default" className="mb-5">
          <Card.Body>
            <View className="gap-2">
              {['Amigable y divertido', 'Tranquilo', 'Educativo'].map((type) => {
                const isActive = formData.personality === type;
                return (
                  <Pressable
                    key={type}
                    className="flex-row items-center px-4 py-3 rounded-2xl"
                    style={{
                      backgroundColor: isActive ? accent + '12' : surfaceSecondary,
                      borderWidth: isActive ? 1.5 : 0,
                      borderColor: isActive ? accent : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, personality: type })}
                  >
                    <View
                      className="w-6 h-6 rounded-full items-center justify-center mr-3"
                      style={{
                        borderWidth: isActive ? 0 : 1.5,
                        borderColor: muted,
                        backgroundColor: isActive ? accent : 'transparent',
                      }}
                    >
                      {isActive && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                    <Label
                      className="text-sm font-semibold"
                      style={{ color: isActive ? accent : undefined } as any}
                    >
                      {type}
                    </Label>
                  </Pressable>
                );
              })}
            </View>
          </Card.Body>
        </Card>

        {/* ── Actions ── */}
        <Button
          variant="primary"
          onPress={handleSave}
          isDisabled={saving}
          feedbackVariant="scale-ripple"
          className="w-full mb-3"
        >
          {saving ? (
            <Spinner size="sm" color="default" />
          ) : (
            <Button.Label>Guardar perfil</Button.Label>
          )}
        </Button>

        {isEditing && (
          <Button
            variant="tertiary"
            onPress={() => {
              Alert.alert(
                'Eliminar perfil',
                `¿Estás seguro de eliminar a ${formData.name}?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await childService.delete(formData.id);
                        Alert.alert('Éxito', 'Perfil eliminado');
                        navigation.goBack();
                      } catch (error) {
                        Alert.alert('Error', 'No se pudo eliminar');
                      }
                    },
                  },
                ]
              );
            }}
            className="w-full"
          >
            <Button.Label style={{ color: danger }}>Eliminar perfil</Button.Label>
          </Button>
        )}

        <View className="h-10" />
      </View>
    </ScrollView>
  );
}