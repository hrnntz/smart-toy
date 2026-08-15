import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Alert,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { rutinaService } from '../../services/api';
import { sendNotification } from '../../services/notificationService';
import { Card, Button, Label, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

interface Rutina {
  id: number;
  nombre: string;
  hora: string;
  repetir: boolean;
  mensaje: string | null;
  createdAt: string;
}

export default function RutinasScreen({ navigation }: any) {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [primary, success, danger, muted] = useThemeColor([
    'accent',
    'success',
    'danger',
    'muted',
  ]);

  const loadRutinas = async () => {
    try {
      const response = await rutinaService.getAll();
      if (response.data.success) {
        setRutinas(response.data.data || []);
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las rutinas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRutinas();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRutinas();
  }, []);

  const deleteRutina = (id: number, nombre: string) => {
    Alert.alert(
      'Eliminar rutina',
      `¿Estás seguro que quieres eliminar "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await rutinaService.delete(id);
              if (response.data.success) {
                Alert.alert('Éxito', 'Rutina eliminada correctamente');
                await loadRutinas();
                await sendNotification(
                  'Rutina eliminada',
                  `Se ha eliminado la rutina "${nombre}"`
                );
              } else {
                Alert.alert('Error', response.data.message || 'No se pudo eliminar');
              }
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo eliminar la rutina');
            }
          },
        },
      ]
    );
  };

  const formatHora = (hora: string) => {
    if (!hora) return 'Sin hora';
    const [h, m] = hora.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
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
      <View className="flex-row justify-between items-center mb-4">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-2xl font-extrabold text-foreground">Rutinas del Niño</Label>
        <IconButton
          icon="add"
          variant="solid"
          color={primary}
          onPress={() => navigation.navigate('RutinaForm')}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
      >
        <Label className="text-sm font-semibold text-muted mb-4">Diarias & Programadas</Label>

        {rutinas.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="calendar-outline" size={64} color={muted} />
            <Label className="text-base font-bold text-foreground mt-4 mb-4">No tienes rutinas creadas</Label>
            <Button
              variant="primary"
              onPress={() => navigation.navigate('RutinaForm')}
            >
              <Button.Label>Agregar rutina</Button.Label>
            </Button>
          </View>
        ) : (
          rutinas.map((rutina) => (
            <Card key={rutina.id} variant="default" className="mb-3">
              <Card.Body className="flex-row items-center justify-between py-4">
                <View className="flex-row items-center flex-1">
                  <View className="w-11 h-11 rounded-full bg-primary/15 justify-center items-center mr-3">
                    <Ionicons name="time-outline" size={24} color={primary} />
                  </View>
                  <View className="flex-1">
                    <Label className="text-base font-bold text-foreground">{rutina.nombre}</Label>
                    <Label className="text-sm text-muted mt-0.5">
                      🕐 {formatHora(rutina.hora)}
                      {rutina.repetir && ' 🔁 Diario'}
                    </Label>
                    {rutina.mensaje && (
                      <Label className="text-sm text-success font-medium mt-0.5">💬 {rutina.mensaje}</Label>
                    )}
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => navigation.navigate('RutinaForm', { rutina })}
                    className="p-1.5"
                  >
                    <Ionicons name="pencil" size={20} color={primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => deleteRutina(rutina.id, rutina.nombre)}
                    className="p-1.5"
                  >
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