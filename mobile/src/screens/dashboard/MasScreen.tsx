import React from 'react';
import { ScrollView, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { Card, Label, Button, useThemeColor } from 'heroui-native';

export default function MasScreen({ navigation }: any) {
  const [accent, muted] = useThemeColor(['accent', 'muted']);

  const handleLogout = async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
    navigation.replace('Welcome');
  };

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-14" showsVerticalScrollIndicator={false}>
      <Label className="text-2xl font-extrabold text-foreground mb-5">Ajustes & Más</Label>

      {/* Dispositivo Panda */}
      <Card variant="default" className="mb-4">
        <Card.Body className="gap-0">
          <Label className="text-base font-bold text-foreground mb-3">Dispositivo Panda</Label>
          <Pressable
            className="flex-row items-center py-3.5 gap-3 border-b border-separator"
            onPress={() => navigation.navigate('Configuracion')}
          >
            <Ionicons name="settings-outline" size={20} color={accent} />
            <Label className="flex-1 text-sm font-semibold text-foreground">Configuración del dispositivo</Label>
            <Ionicons name="chevron-forward" size={18} color={muted} />
          </Pressable>
          <Pressable
            className="flex-row items-center py-3.5 gap-3"
            onPress={() => navigation.navigate('ToyList')}
          >
            <Ionicons name="game-controller-outline" size={20} color="#F59E0B" />
            <Label className="flex-1 text-sm font-semibold text-foreground">Gestionar dispositivos</Label>
            <Ionicons name="chevron-forward" size={18} color={muted} />
          </Pressable>
        </Card.Body>
      </Card>

      {/* Familia y Niños */}
      <Card variant="default" className="mb-4">
        <Card.Body className="gap-0">
          <Label className="text-base font-bold text-foreground mb-3">Familia y Niños</Label>
          <Pressable
            className="flex-row items-center py-3.5 gap-3 border-b border-separator"
            onPress={() => navigation.navigate('ChildList')}
          >
            <Ionicons name="people-outline" size={20} color="#F59E0B" />
            <Label className="flex-1 text-sm font-semibold text-foreground">Gestionar perfiles de niños</Label>
            <Ionicons name="chevron-forward" size={18} color={muted} />
          </Pressable>
          <Pressable
            className="flex-row items-center py-3.5 gap-3"
            onPress={() => navigation.navigate('Ingles')}
          >
            <Ionicons name="language-outline" size={20} color="#10B981" />
            <Label className="flex-1 text-sm font-semibold text-foreground">Módulo de Inglés</Label>
            <Ionicons name="chevron-forward" size={18} color={muted} />
          </Pressable>
        </Card.Body>
      </Card>

      {/* Información */}
      <Card variant="default" className="mb-4">
        <Card.Body className="gap-0">
          <Label className="text-base font-bold text-foreground mb-3">Información</Label>
          <View className="flex-row items-center py-3.5 gap-3 border-b border-separator">
            <Ionicons name="information-circle-outline" size={20} color={muted} />
            <Label className="flex-1 text-sm text-muted">Versión de la app: 1.0.0</Label>
          </View>
          <Pressable className="flex-row items-center py-3.5 gap-3">
            <Ionicons name="help-circle-outline" size={20} color={muted} />
            <Label className="flex-1 text-sm font-semibold text-foreground">Soporte técnico</Label>
            <Ionicons name="chevron-forward" size={18} color={muted} />
          </Pressable>
        </Card.Body>
      </Card>

      {/* Botón cerrar sesión */}
      <Button
        variant="primary"
        color="danger"
        onPress={handleLogout}
        className="w-full my-6"
      >
        <Button.Label>Cerrar sesión</Button.Label>
      </Button>
    </ScrollView>
  );
}