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
          <View className="items-center mt-20">
            <View className="w-24 h-24 rounded-full bg-surface-secondary items-center justify-center mb-5">
              <Ionicons name="chatbubbles-outline" size={48} color={muted} />
            </View>
            <Label className="text-lg font-bold text-foreground mb-2">
              Sin juguetes vinculados
            </Label>
            <Label className="text-sm text-muted text-center px-8 mb-6">
              Registra tu juguete Panda para comenzar a chatear con IA.
            </Label>
            <Button
              variant="primary"
              feedbackVariant="scale-ripple"
              onPress={() => navigation.navigate('ToyList')}
            >
              <Button.Label>Agregar juguete</Button.Label>
            </Button>
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

                      {/* Chat Action */}
                      <View
                        className="w-11 h-11 rounded-full items-center justify-center"
                        style={{ backgroundColor: accent + '18' }}
                      >
                        <Ionicons name="chatbubble-ellipses" size={20} color={accent} />
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