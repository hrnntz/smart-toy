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

  const [primary, danger, surface, background] = useThemeColor([
    'accent',
    'danger',
    'surface',
    'background',
  ]);

  useEffect(() => {
    if (child) {
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
    <ScrollView className="flex-1 bg-background px-4 pt-12" showsVerticalScrollIndicator={false}>
      <View className="flex-row justify-between items-center mb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-2xl font-extrabold text-foreground">Editar Perfil</Label>
        <View className="w-10" />
      </View>

      <Card variant="default" className="p-5 mb-5 border-0 shadow-sm">
        <Card.Body className="p-0">
          <Label className="text-sm font-semibold text-foreground mb-1.5">Nombre *</Label>
          <TextField className="w-full mb-4">
            <Input
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nombre del niño"
            />
          </TextField>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Fecha de nacimiento</Label>
          <TextField className="w-full mb-4">
            <Input
              value={formData.birthDate}
              onChangeText={(text) => setFormData({ ...formData, birthDate: text })}
              placeholder="YYYY-MM-DD (ej: 2020-05-15)"
            />
          </TextField>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Idioma</Label>
          <TextField className="w-full mb-4">
            <Input
              value={formData.language}
              onChangeText={(text) => setFormData({ ...formData, language: text })}
              placeholder="Idioma"
            />
          </TextField>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Hora de dormir</Label>
          <TextField className="w-full mb-4">
            <Input
              value={formData.bedtime}
              onChangeText={(text) => setFormData({ ...formData, bedtime: text })}
              placeholder="Ej: 08:30 PM"
            />
          </TextField>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Nivel de energía</Label>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {['Baja', 'Media', 'Alta'].map((level) => (
              <Pressable
                key={level}
                className="px-4 py-2 rounded-full border-2"
                style={{
                  backgroundColor: formData.energyLevel === level ? 'rgba(74, 144, 217, 0.1)' : surface,
                  borderColor: formData.energyLevel === level ? primary : 'transparent'
                }}
                onPress={() => setFormData({ ...formData, energyLevel: level })}
              >
                <Label className={`text-sm ${formData.energyLevel === level ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {level}
                </Label>
              </Pressable>
            ))}
          </View>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Personalidad de Panda</Label>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {['Amigable y divertido', 'Tranquilo', 'Educativo'].map((type) => (
              <Pressable
                key={type}
                className="px-4 py-2 rounded-full border-2"
                style={{
                  backgroundColor: formData.personality === type ? 'rgba(74, 144, 217, 0.1)' : surface,
                  borderColor: formData.personality === type ? primary : 'transparent'
                }}
                onPress={() => setFormData({ ...formData, personality: type })}
              >
                <Label className={`text-sm ${formData.personality === type ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {type}
                </Label>
              </Pressable>
            ))}
          </View>

          <Button
            variant="primary"
            onPress={handleSave}
            isDisabled={saving}
            className="w-full"
          >
            {saving ? <Spinner size="sm" color="default" /> : <Button.Label>Guardar perfil</Button.Label>}
          </Button>

          <Button
            variant="flat"
            onPress={() => {
              Alert.alert('Eliminar perfil', `¿Estás seguro de eliminar a ${formData.name}?`, [
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
              ]);
            }}
            className="w-full mt-3"
          >
            <Button.Label className="text-danger font-semibold">Eliminar perfil</Button.Label>
          </Button>
        </Card.Body>
      </Card>
      <View className="h-10" />
    </ScrollView>
  );
}