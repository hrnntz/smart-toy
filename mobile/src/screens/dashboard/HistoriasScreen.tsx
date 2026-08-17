import React, { useState, useCallback } from 'react';
import { View, ScrollView, Image, Pressable, RefreshControl, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { storyService } from '../../services/api';
import { Card, Button, Label, Spinner, useThemeColor } from 'heroui-native';

interface Historia {
  id: number;
  titulo: string;
  contenido: string;
  imagen?: string;
  duracion?: string;
  createdAt: string;
}

export default function HistoriasScreen({ navigation }: any) {
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [accent, muted, surface, background] = useThemeColor([
    'accent', 'muted', 'surface', 'background'
  ]);
  const amber = '#F59E0B';

  const loadHistorias = async () => {
    try {
      const res = await storyService.getAll();
      if (res.data.success) setHistorias(res.data.data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { loadHistorias(); }, []));

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: '#0D0F16' }}>
        <Spinner size="lg" color="primary" />
      </View>
    );
  }

  return (
    <View className="flex-1 px-4 pt-12" style={{ backgroundColor: '#0D0F16' }}>
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-1">
          <Label className="text-2xl font-extrabold text-white">Cuentos IA</Label>
          <Label className="text-sm text-muted mt-1">Historias creadas para ti</Label>
        </View>
        <Pressable
          className="flex-row items-center px-4 py-2 rounded-full gap-1.5"
          style={{ backgroundColor: amber }}
          onPress={() => navigation.navigate('GenerarHistoria')}
        >
          <Ionicons name="sparkles" size={16} color="white" />
          <Label className="text-white text-sm font-bold">Nueva historia</Label>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistorias(); }} tintColor={amber} />}
      >
        {historias.length === 0 ? (
          <View className="items-center mt-20 px-6">
            <Ionicons name="book" size={64} color={amber} />
            <Label className="text-lg font-bold text-white mt-4 text-center">Sin historias aún</Label>
            <Label className="text-sm text-muted mt-2 text-center mb-6">Genera un cuento personalizado para la hora de dormir o para aprender jugando.</Label>
            <Button variant="primary" feedbackVariant="scale-ripple" style={{ backgroundColor: amber }} onPress={() => navigation.navigate('GenerarHistoria')}>
              <Button.Label className="text-white">Crear primera historia</Button.Label>
            </Button>
          </View>
        ) : (
          historias.map((historia) => (
            <Card key={historia.id} variant="default" className="mb-4 rounded-3xl bg-surface border-0 overflow-hidden">
              <Pressable onPress={() => navigation.navigate('HistoriaDetalle', { historia })}>
                {historia.imagen ? (
                  <Image source={{ uri: historia.imagen }} className="w-full h-36 bg-white/5" resizeMode="cover" />
                ) : (
                  <View className="w-full h-36 justify-center items-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                    <Ionicons name="book" size={40} color={amber} />
                  </View>
                )}
                
                <Card.Body className="p-4">
                  <View className="flex-row justify-between items-start mb-2 gap-2">
                    <Text className="text-base font-bold text-white flex-1" numberOfLines={2} style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>{historia.titulo}</Text>
                    {historia.duracion && (
                      <View className="px-2 py-1 rounded-full flex-row items-center gap-1" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                        <Label className="text-[10px] font-bold" style={{ color: amber } as any}>⏱ {historia.duracion}</Label>
                      </View>
                    )}
                  </View>
                  
                  <Text className="text-xs text-muted mb-4" numberOfLines={2} style={{ fontSize: 12, color: muted }}>
                    {historia.contenido.replace(/\n/g, ' ')}
                  </Text>
                  
                  <View className="flex-row justify-between items-center mt-2 pt-3 border-t border-white/5">
                    <Label className="text-xs text-muted">{formatDate(historia.createdAt)}</Label>
                    <Label className="text-xs font-bold" style={{ color: accent } as any}>Leer historia →</Label>
                  </View>
                </Card.Body>
              </Pressable>
            </Card>
          ))
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}