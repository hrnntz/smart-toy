import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { childService, userService, profileService } from '../../services/api';
import { storage } from '../../services/storage';
import { Card, Button, Label, TextField, Input, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

export default function PerfilScreen({ navigation, route }: any) {
  const child = route?.params?.child;
  const isChildMode = Boolean(child);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Datos para modo Usuario Padre
  const [parentUser, setParentUser] = useState<any>(null);

  // Datos para modo Niño
  const [formData, setFormData] = useState({
    id: child?.id || 0,
    name: child?.name || '',
    birthDate: child?.birthDate || '',
    age: child?.age ? String(child.age) : '',
    language: child?.language || 'Español',
    bedtime: child?.bedtime || '08:30 PM',
    energyLevel: child?.energyLevel || 'Media',
    personality: child?.personality || 'Amigable y divertido',
  });

  const [accent, danger, muted, surfaceSecondary, success, background] = useThemeColor([
    'accent',
    'danger',
    'muted',
    'surface-secondary',
    'success',
    'background',
  ]);

  useEffect(() => {
    if (isChildMode) {
      setLoading(false);
    } else {
      loadParentProfile();
    }
  }, [child]);

  const loadParentProfile = async () => {
    try {
      setLoading(true);
      const res = await userService.getProfile();
      if (res.data?.success && res.data?.data) {
        setParentUser(res.data.data);
      } else {
        const saved = await storage.getItem('user');
        if (saved) setParentUser(JSON.parse(saved));
      }
    } catch (e) {
      const saved = await storage.getItem('user');
      if (saved) setParentUser(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChild = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        birthDate: formData.birthDate || undefined,
        language: formData.language,
        bedtime: formData.bedtime,
        energyLevel: formData.energyLevel,
        personality: formData.personality,
      };
      if (formData.age) payload.age = Number(formData.age);

      let response;
      if (formData.id) {
        response = await profileService.updateProfile(payload);
      } else {
        response = await childService.create({ name: payload.name, birthDate: payload.birthDate });
      }

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
        <Spinner size="lg" color="default" />
      </View>
    );
  }

  // ── VISTA 1: Perfil de la Cuenta de Padre ─────────────────────────
  if (!isChildMode) {
    const formattedDate = parentUser?.createdAt
      ? new Date(parentUser.createdAt).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Miembro activo';

    return (
      <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center gap-2 px-4 pt-14 pb-5">
          <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
          <Label className="flex-1 text-2xl font-extrabold text-foreground text-center">
            Mi Perfil
          </Label>
          <View className="w-10" />
        </View>

        <View className="px-4">
          {/* Card Avatar */}
          <Card variant="default" className="mb-5 rounded-3xl">
            <Card.Body>
              <View className="items-center py-4">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: accent + '18' }}
                >
                  <Ionicons name="person" size={38} color={accent} />
                </View>
                <Label className="text-xl font-bold text-foreground">
                  {parentUser?.name || 'Padre / Tutor'}
                </Label>
                <Label className="text-sm text-muted mt-0.5">
                  {parentUser?.email || 'cuenta@smarttoy.app'}
                </Label>
                <View className="flex-row items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-success/15">
                  <View className="w-2 h-2 rounded-full bg-success" />
                  <Label className="text-xs font-semibold text-success">Cuenta Verificada</Label>
                </View>
              </View>
            </Card.Body>
          </Card>

          {/* Detalles de la Cuenta */}
          <Label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">
            Detalles de la Cuenta
          </Label>
          <Card variant="default" className="mb-4 rounded-2xl">
            <Card.Body className="gap-3.5">
              <View className="flex-row items-center justify-between py-1">
                <View className="flex-row items-center gap-3">
                  <Ionicons name="key-outline" size={20} color={muted} />
                  <Label className="text-sm text-muted">ID Familiar</Label>
                </View>
                <Label className="text-sm font-bold text-foreground">
                  #{parentUser?.id || '1'}
                </Label>
              </View>

              <View className="h-px bg-separator/40" />

              <View className="flex-row items-center justify-between py-1">
                <View className="flex-row items-center gap-3">
                  <Ionicons name="calendar-outline" size={20} color={muted} />
                  <Label className="text-sm text-muted">Miembro desde</Label>
                </View>
                <Label className="text-sm font-semibold text-foreground">
                  {formattedDate}
                </Label>
              </View>

              <View className="h-px bg-separator/40" />

              <View className="flex-row items-center justify-between py-1">
                <View className="flex-row items-center gap-3">
                  <Ionicons name="shield-checkmark-outline" size={20} color={muted} />
                  <Label className="text-sm text-muted">Protección parental</Label>
                </View>
                <Label className="text-sm font-semibold text-success">
                  Activa (JWT HS256)
                </Label>
              </View>
            </Card.Body>
          </Card>

          {/* Accesos rápidos */}
          <Label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">
            Accesos de Gestión
          </Label>
          <View className="gap-2.5 mb-8">
            <Pressable
              onPress={() => navigation.navigate('ChildList')}
              className="p-4 rounded-2xl bg-surface flex-row items-center justify-between border border-separator/30"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="people-outline" size={20} color={accent} />
                <Label className="text-sm font-semibold text-foreground">Administrar niños</Label>
              </View>
              <Ionicons name="chevron-forward" size={18} color={muted} />
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('ToyList')}
              className="p-4 rounded-2xl bg-surface flex-row items-center justify-between border border-separator/30"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="game-controller-outline" size={20} color={accent} />
                <Label className="text-sm font-semibold text-foreground">Administrar juguetes</Label>
              </View>
              <Ionicons name="chevron-forward" size={18} color={muted} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── VISTA 2: Editor de Perfil del Niño (con parámetros) ──────────
  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="flex-row items-center gap-2 px-4 pt-14 pb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="flex-1 text-2xl font-extrabold text-foreground text-center">
          Editar Perfil del Niño
        </Label>
        <View className="w-10" />
      </View>

      <View className="px-4">
        <Card variant="default" className="mb-5 rounded-3xl">
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
                {formData.name || 'Perfil de niño'}
              </Label>
              <Label className="text-xs text-muted mt-0.5">
                PandaAI · Acompañamiento
              </Label>
            </View>
          </Card.Body>
        </Card>

        {/* Identidad */}
        <Label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">
          Identidad
        </Label>
        <Card variant="default" className="mb-4 rounded-2xl">
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
                    placeholder="YYYY-MM-DD"
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

        {/* Nivel de Energía */}
        <Label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">
          Nivel de Energía
        </Label>
        <Card variant="default" className="mb-4 rounded-2xl">
          <Card.Body>
            <View className="flex-row gap-2">
              {['Baja', 'Media', 'Alta'].map((level) => {
                const isActive = formData.energyLevel === level;
                return (
                  <Pressable
                    key={level}
                    className="flex-1 py-3 rounded-2xl items-center"
                    style={{
                      backgroundColor: isActive ? accent + '18' : surfaceSecondary,
                      borderWidth: isActive ? 1.5 : 0,
                      borderColor: isActive ? accent : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, energyLevel: level })}
                  >
                    <Label
                      className="text-sm font-bold"
                      style={{ color: isActive ? accent : muted } as any}
                    >
                      {level}
                    </Label>
                  </Pressable>
                );
              })}
            </View>
          </Card.Body>
        </Card>

        <Button
          variant="primary"
          onPress={handleSaveChild}
          isDisabled={saving}
          feedbackVariant="scale-ripple"
          className="w-full mb-8"
        >
          {saving ? <Spinner size="sm" color="default" /> : <Button.Label>Guardar cambios</Button.Label>}
        </Button>
      </View>
    </ScrollView>
  );
}