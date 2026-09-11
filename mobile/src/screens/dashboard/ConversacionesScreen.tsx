import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { toyService } from '../../services/api';
import { Avatar, Button, Card, Label, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

interface Toy {
  id: number;
  name: string;
  serialNumber: string;
  isConnected: boolean;
  avatarUrl?: string;
}

export default function ConversacionesScreen({ navigation }: any) {
  const [toys, setToys] = useState<Toy[]>([]);
  const [loading, setLoading] = useState(true);

  const [accent, muted, success, danger, surfaceSecondary] = useThemeColor([
    'accent',
    'muted',
    'success',
    'danger',
    'surface-secondary',
  ]);

  useFocusEffect(
    useCallback(() => {
      loadToys();
    }, [])
  );

  const loadToys = async () => {
    try {
      const res = await toyService.getAll();
      if (res.data.success) setToys(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (toy: Toy) => {
    navigation.navigate('Chat', {
      toyId: toy.id,
      toyName: toy.name,
      avatarUrl: toy.avatarUrl,
      initialMode: 'text',
    });
  };

  const openLiveVoice = (toy: Toy) => {
    navigation.navigate('Chat', {
      toyId: toy.id,
      toyName: toy.name,
      avatarUrl: toy.avatarUrl,
      initialMode: 'voice',
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Spinner size="lg" color="primary" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* ── Header ── */}
      <View className="flex-row items-center gap-2 px-4 pt-14 pb-5">
        <View className="flex-1">
          <Label className="text-2xl font-extrabold text-foreground">Conversaciones</Label>
          <Label className="text-sm text-muted mt-0.5">Selecciona con quién hablar</Label>
        </View>
        <Pressable
          className="w-10 h-10 rounded-full bg-accent/12 items-center justify-center"
          onPress={() => navigation.navigate('ToyList')}
        >
          <Ionicons name="add" size={22} color={accent} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        {toys.length === 0 ? (
          <View className="mt-2">
            {/* Tarjeta de Panda Inteligente por defecto */}
            <Pressable
              onPress={() =>
                openChat({
                  id: 1,
                  name: 'Panda Inteligente',
                  serialNumber: 'PANDA-VIRTUAL',
                  isConnected: true,
                })
              }
            >
              <Card variant="default" className="mb-4 rounded-3xl border border-accent/30 shadow-sm">
                <Card.Body className="p-4">
                  <View className="flex-row items-center gap-3.5">
                    <View className="w-14 h-14 rounded-2xl bg-accent/20 items-center justify-center">
                      <Label className="text-3xl">🐼</Label>
                    </View>

                    <View className="flex-1">
                      <Label className="text-base font-bold text-foreground">
                        Panda Inteligente
                      </Label>
                      <Label className="text-xs text-muted mt-0.5">
                        Tu compañero con IA de voz y texto
                      </Label>
                      <View className="flex-row items-center gap-1.5 mt-1">
                        <View className="w-2 h-2 rounded-full bg-emerald-500" />
                        <Label className="text-xs font-semibold text-emerald-600">
                          En línea · Listo para hablar
                        </Label>
                      </View>
                    </View>

                    <Pressable
                      className="w-11 h-11 rounded-full items-center justify-center bg-accent shadow-sm"
                      onPress={() =>
                        openLiveVoice({
                          id: 1,
                          name: 'Panda Inteligente',
                          serialNumber: 'PANDA-VIRTUAL',
                          isConnected: true,
                        })
                      }
                      accessibilityLabel="Hablar por voz en vivo"
                    >
                      <Ionicons name="mic" size={20} color="white" />
                    </Pressable>
                  </View>

                  <View className="flex-row gap-2 mt-4 pt-3 border-t border-separator/20">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 rounded-xl"
                      onPress={() =>
                        openChat({
                          id: 1,
                          name: 'Panda Inteligente',
                          serialNumber: 'PANDA-VIRTUAL',
                          isConnected: true,
                        })
                      }
                    >
                      <Button.Label className="text-xs">💬 Chatear</Button.Label>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl"
                      onPress={() =>
                        openLiveVoice({
                          id: 1,
                          name: 'Panda Inteligente',
                          serialNumber: 'PANDA-VIRTUAL',
                          isConnected: true,
                        })
                      }
                    >
                      <Button.Label className="text-xs">🎙️ Llamada en Vivo</Button.Label>
                    </Button>
                  </View>
                </Card.Body>
              </Card>
            </Pressable>

            {/* Banner para agregar juguete físico */}
            <Pressable
              onPress={() => navigation.navigate('ToyList')}
              className="p-4 rounded-2xl bg-surface-secondary flex-row items-center justify-between mt-2"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="hardware-chip-outline" size={20} color={muted} />
                <Label className="text-xs text-muted font-medium">¿Tienes un Panda físico? Vincúlalo aquí</Label>
              </View>
              <Ionicons name="chevron-forward" size={16} color={muted} />
            </Pressable>
          </View>
        ) : (
          <>
            {toys.map((toy) => (
              <Pressable key={toy.id} onPress={() => openChat(toy)}>
                <Card variant="default" className="mb-3">
                  <Card.Body>
                    <View className="flex-row items-center gap-3.5">
                      {/* Avatar */}
                      <Avatar size="lg" color={toy.isConnected ? 'success' : 'default'}>
                        {toy.avatarUrl ? (
                          <Avatar.Image
                            source={{ uri: toy.avatarUrl }}
                          />
                        ) : null}
                        <Avatar.Fallback>
                          <Label className="text-lg font-bold text-foreground">
                            {toy.name.charAt(0).toUpperCase()}
                          </Label>
                        </Avatar.Fallback>
                      </Avatar>

                      {/* Info */}
                      <View className="flex-1">
                        <Label className="text-base font-bold text-foreground">
                          {toy.name}
                        </Label>
                        <Label className="text-xs text-muted mt-0.5">
                          S/N: {toy.serialNumber}
                        </Label>
                        <View className="flex-row items-center gap-1.5 mt-1">
                          <View
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: toy.isConnected ? success : danger }}
                          />
                          <Label
                            className="text-xs font-semibold"
                            style={{ color: toy.isConnected ? success : danger } as any}
                          >
                            {toy.isConnected ? 'En línea · Listo para hablar' : 'Desconectado'}
                          </Label>
                        </View>
                      </View>

                      {/* Actions */}
                      <View className="flex-row items-center gap-2">
                        <Pressable
                          className="px-3 py-2 rounded-full flex-row items-center bg-accent"
                          onPress={() => openLiveVoice(toy)}
                          accessibilityLabel="Hablar por voz en vivo"
                        >
                          <Ionicons name="sparkles" size={15} color="white" />
                          <Label className="text-white text-xs font-bold ml-1">Voz</Label>
                        </Pressable>

                        <Pressable
                          className="w-9 h-9 rounded-full items-center justify-center bg-surface-secondary"
                          onPress={() => openChat(toy)}
                          accessibilityLabel="Abrir chat de texto"
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color={accent} />
                        </Pressable>
                      </View>
                    </View>
                  </Card.Body>
                </Card>
              </Pressable>
            ))}
          </>
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}