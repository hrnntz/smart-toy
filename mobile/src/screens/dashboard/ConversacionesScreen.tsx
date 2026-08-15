import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { toyService } from '../../services/api';
import { Card, Label, Spinner, useThemeColor } from 'heroui-native';
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

  const [primary, muted, success, danger] = useThemeColor([
    'accent',
    'muted',
    'success',
    'danger',
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
    <View className="flex-1 bg-background px-4 pt-12">
      <View className="flex-row items-center mb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View className="flex-1 ml-2">
          <Label className="text-2xl font-extrabold text-foreground">Conversaciones</Label>
          <Label className="text-[13px] text-muted mt-0.5">Supervisión de chats del juguete</Label>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {toys.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="chatbubbles-outline" size={64} color={muted} />
            <Label className="text-base font-bold text-foreground mt-4">No hay juguetes vinculados para chatear</Label>
            <Label className="text-[13px] text-muted mt-1">Registra un juguete desde "Mis Juguetes"</Label>
          </View>
        ) : (
          toys.map((toy) => (
            <Card key={toy.id} variant="default" className="mb-3">
              <Pressable className="flex-row items-center p-4" onPress={() => openChat(toy)}>
                <Image
                  source={{ uri: toy.avatarUrl || 'https://image.pollinations.ai/prompt/cute%20panda%20toy?width=100&height=100' }}
                  className="w-13 h-13 rounded-full mr-3.5"
                />
                <View className="flex-1">
                  <Label className="text-base font-bold text-foreground">{toy.name}</Label>
                  <Label className="text-xs text-muted mt-0.5">🔑 S/N: {toy.serialNumber}</Label>
                  <Label
                    className={`text-xs font-semibold mt-1 ${toy.isConnected ? 'text-success' : 'text-danger'}`}
                  >
                    {toy.isConnected ? '🟢 En línea • Listo para hablar' : '🔴 Desconectado'}
                  </Label>
                </View>
                <View className="w-11 h-11 rounded-full bg-primary/15 justify-center items-center">
                  <Ionicons name="chatbubble-ellipses" size={22} color={primary} />
                </View>
              </Pressable>
            </Card>
          ))
        )}
        <View className="h-5" />
      </ScrollView>
    </View>
  );
}