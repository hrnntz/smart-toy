import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Alert,
  RefreshControl,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { toyService } from '../../services/api';
import { Card, Button, Label, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

interface Toy {
  id: number;
  name: string;
  serialNumber: string;
  isConnected: boolean;
  personality?: string;
  context?: string;
  avatarUrl?: string;
  createdAt: string;
  child?: { id: number; name: string };
}

export default function ToyListScreen({ navigation }: any) {
  const [toys, setToys] = useState<Toy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [primary, success, danger, muted, secondary] = useThemeColor([
    'accent',
    'success',
    'danger',
    'muted',
    'secondary',
  ]);

  const loadToys = async () => {
    try {
      const response = await toyService.getAll();
      if (response.data.success) setToys(response.data.data || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los juguetes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadToys(); }, []));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadToys();
  }, []);

  const handleToggle = async (id: number) => {
    try {
      const response = await toyService.toggle(id);
      if (response.data.success) {
        setToys(toys.map(t => t.id === id ? { ...t, isConnected: response.data.data.isConnected } : t));
        Alert.alert('Éxito', response.data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  };

  const deleteToy = (id: number, name: string) => {
    Alert.alert(
      'Eliminar juguete',
      `¿Eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await toyService.delete(id);
              Alert.alert('Éxito', 'Juguete eliminado');
              loadToys();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
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
      <View className="flex-row justify-between items-center mb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-2xl font-extrabold text-foreground">Mis Juguetes</Label>
        <IconButton
          icon="add"
          variant="solid"
          color={primary}
          onPress={() => navigation.navigate('ToyForm')}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        {toys.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="game-controller-outline" size={64} color={muted} />
            <Label className="text-base font-bold text-foreground mt-4 mb-4">No tienes juguetes registrados</Label>
            <Button variant="primary" onPress={() => navigation.navigate('ToyForm')}>
              <Button.Label>Agregar juguete</Button.Label>
            </Button>
          </View>
        ) : (
          toys.map(toy => (
            <Card key={toy.id} variant="default" className="mb-3">
              <Card.Body className="p-4">
                <View className="flex-row items-center mb-3">
                  <Image
                    source={{ uri: toy.avatarUrl || 'https://via.placeholder.com/48' }}
                    className="w-12 h-12 rounded-full mr-3 bg-surface"
                  />
                  <View className="flex-1">
                    <Label className="text-base font-bold text-foreground">{toy.name}</Label>
                    <Label className="text-[13px] text-muted mt-0.5">🔑 {toy.serialNumber}</Label>
                    {toy.child && <Label className="text-[13px] text-success font-medium mt-0.5">👶 {toy.child.name}</Label>}
                  </View>
                </View>
                
                <View className="flex-row items-center gap-2 flex-wrap">
                  <Pressable
                    className="flex-row items-center bg-[#8E44AD] px-2.5 py-1.5 rounded-2xl gap-1.5"
                    onPress={() => navigation.navigate('Chat', {
                      toyId: toy.id,
                      toyName: toy.name,
                      avatarUrl: toy.avatarUrl,
                    })}
                  >
                    <Ionicons name="chatbubble" size={16} color="white" />
                    <Label className="text-white text-[11px] font-bold">Chat</Label>
                  </Pressable>

                  <Pressable
                    className="flex-row items-center px-2.5 py-1.5 rounded-2xl gap-1.5"
                    style={{ backgroundColor: toy.isConnected ? success : muted }}
                    onPress={() => handleToggle(toy.id)}
                  >
                    <Ionicons name={toy.isConnected ? 'bluetooth' : 'bluetooth-outline'} size={16} color="white" />
                    <Label className="text-white text-[11px] font-bold">
                      {toy.isConnected ? 'Conectado' : 'Conectar'}
                    </Label>
                  </Pressable>

                  <View className="flex-1" />

                  <Pressable onPress={() => navigation.navigate('ToyForm', { toy })} className="p-1.5">
                    <Ionicons name="pencil" size={20} color={primary} />
                  </Pressable>
                  <Pressable onPress={() => deleteToy(toy.id, toy.name)} className="p-1.5">
                    <Ionicons name="trash" size={20} color={danger} />
                  </Pressable>
                </View>
              </Card.Body>
            </Card>
          ))
        )}
        <View className="h-5" />
      </ScrollView>
    </View>
  );
}