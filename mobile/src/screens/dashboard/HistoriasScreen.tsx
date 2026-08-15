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
import { storyService } from '../../services/api';
import { Card, Button, Label, Spinner, useThemeColor } from 'heroui-native';

interface Historia {
  id: number;
  titulo: string;
  contenido: string;
  imagen: string | null;
  duracion: string;
  createdAt: string;
}

export default function HistoriasScreen({ navigation }: any) {
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'mis' | 'ia' | 'favoritas'>('mis');

  const [primary, secondary, danger, muted, surface] = useThemeColor([
    'accent',
    'accent-soft',
    'danger',
    'muted',
    'surface',
  ]);

  const loadHistorias = async () => {
    try {
      const response = await storyService.getAll();
      if (response.data.success) {
        setHistorias(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando historias:', error);
      Alert.alert('Error', 'No se pudieron cargar las historias');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistorias();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistorias();
  }, []);

  const handleDelete = (id: number, titulo: string) => {
    Alert.alert(
      'Eliminar historia',
      `¿Eliminar "${titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await storyService.delete(id);
              Alert.alert('Éxito', 'Historia eliminada');
              loadHistorias();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const openStoryDetail = (historia: Historia) => {
    navigation.navigate('HistoriaDetalle', { historia });
  };

  const goToGenerate = () => {
    navigation.navigate('GenerarHistoria');
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
      className="flex-1 bg-background px-4 pt-12"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
      }
    >
      <View className="flex-row justify-between items-center mb-4">
        <Label className="text-2xl font-extrabold text-foreground">Cuentos e Historias</Label>
        <Pressable
          className="flex-row bg-secondary px-3.5 py-2 rounded-full items-center gap-1.5"
          onPress={goToGenerate}
        >
          <Ionicons name="sparkles" size={16} color="white" />
          <Label className="text-white text-xs font-bold">Crear</Label>
        </Pressable>
      </View>

      <View className="flex-row mb-5 gap-2">
        {(['mis', 'ia', 'favoritas'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={{ backgroundColor: activeTab === tab ? primary : surface }}
            className="px-4 py-2 rounded-full"
            onPress={() => setActiveTab(tab)}
          >
            <Label
              className={`text-sm ${activeTab === tab ? 'font-bold text-white' : 'font-medium text-muted'}`}
            >
              {tab === 'mis' ? 'Mis historias' : tab === 'ia' ? 'IA Cuentos' : 'Favoritas'}
            </Label>
          </Pressable>
        ))}
      </View>

      {historias.length === 0 ? (
        <View className="items-center mt-16">
          <Ionicons name="book-outline" size={64} color={muted} />
          <Label className="text-base font-bold text-foreground mt-4">No tienes historias guardadas</Label>
          <Label className="text-sm text-muted mt-1">Genera una nueva cuento mágico con IA</Label>
        </View>
      ) : (
        historias.map((story) => (
          <Card key={story.id} variant="default" className="mb-3">
            <Pressable
              className="flex-row items-center p-4"
              onPress={() => openStoryDetail(story)}
            >
              {story.imagen ? (
                <Image source={{ uri: story.imagen }} className="w-12 h-12 rounded-full mr-3" />
              ) : (
                <View className="w-12 h-12 rounded-full bg-secondary/15 justify-center items-center mr-3">
                  <Ionicons name="book" size={24} color={secondary} />
                </View>
              )}
              <View className="flex-1 mr-2">
                <Label className="text-base font-bold text-foreground">
                  {story.titulo}
                </Label>
                <Label className="text-sm text-muted mt-0.5">⏱ {story.duracion}</Label>
              </View>
              <View className="flex-row gap-1.5">
                <Pressable
                  onPress={() => openStoryDetail(story)}
                  className="p-1.5"
                >
                  <Ionicons name="eye" size={20} color={primary} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(story.id, story.titulo)}
                  className="p-1.5"
                >
                  <Ionicons name="trash" size={20} color={danger} />
                </Pressable>
              </View>
            </Pressable>
          </Card>
        ))
      )}

      <Button
        variant="secondary"
        onPress={goToGenerate}
        className="w-full my-5"
      >
        <Button.Label>Generar historia con IA</Button.Label>
      </Button>
      <View className="h-5" />
    </ScrollView>
  );
}