import React, { useState, useCallback } from 'react';
import { View, ScrollView, Alert, RefreshControl, Pressable, Switch as RNSwitch, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { rutinaService } from '../../services/api';
import { Card, Button, Label, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

interface Rutina {
  id: number;
  nombre: string;
  hora: string;
  repetir: boolean;
  mensaje: string | null;
  isActive: boolean;
}

export default function RutinasScreen({ navigation }: any) {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accent, muted, success, danger, surface, foreground, background] = useThemeColor([
    'accent', 'muted', 'success', 'danger', 'surface', 'foreground', 'background'
  ]);

  const loadRutinas = async () => {
    try {
      const res = await rutinaService.getAll();
      if (res.data.success) setRutinas(res.data.data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { loadRutinas(); }, []));

  const toggleRutina = async (id: number, currentActive: boolean) => {
    try {
      const res = await rutinaService.update(id, { isActive: !currentActive } as any);
      if (res.data.success) {
        setRutinas(rutinas.map(r => r.id === id ? { ...r, isActive: !currentActive } : r));
      }
    } catch (error) { Alert.alert('Error', 'No se pudo cambiar el estado'); }
  };

  const deleteRutina = (id: number, nombre: string) => {
    Alert.alert('Eliminar rutina', `¿Eliminar "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await rutinaService.delete(id);
          loadRutinas();
        } catch (error) { Alert.alert('Error', 'No se pudo eliminar'); }
      }},
    ]);
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

  const activeCount = rutinas.filter(r => r.isActive).length;
  const repeatCount = rutinas.filter(r => r.repetir).length;

  return (
    <View className="flex-1 bg-[#0D0F16] px-4 pt-12">
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-1">
          <Label className="text-2xl font-extrabold text-white">Rutinas</Label>
          <Label className="text-sm text-muted mt-1">Recordatorios diarios de Panda</Label>
        </View>
        <Pressable
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: accent }}
          onPress={() => navigation.navigate('RutinaForm')}
        >
          <Ionicons name="add" size={24} color="white" />
        </Pressable>
      </View>

      <Card variant="default" className="mb-6 rounded-3xl bg-surface border-0">
        <Card.Body className="flex-row py-4 px-2">
          <View className="flex-1 items-center border-r border-white/10">
            <Label className="text-2xl font-bold" style={{ color: '#6366F1' } as any}>{rutinas.length}</Label>
            <Label className="text-xs text-muted mt-1">Total</Label>
          </View>
          <View className="flex-1 items-center border-r border-white/10">
            <Label className="text-2xl font-bold" style={{ color: accent } as any}>{activeCount}</Label>
            <Label className="text-xs text-muted mt-1">Activas</Label>
          </View>
          <View className="flex-1 items-center">
            <Label className="text-2xl font-bold" style={{ color: '#6366F1' } as any}>{repeatCount}</Label>
            <Label className="text-xs text-muted mt-1">Diarias</Label>
          </View>
        </Card.Body>
      </Card>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRutinas(); }} tintColor={accent} />}
      >
        {rutinas.length === 0 ? (
          <View className="items-center mt-16 px-6">
            <Ionicons name="alarm-outline" size={64} color="#6366F1" />
            <Label className="text-lg font-bold text-white mt-4 text-center">No hay rutinas</Label>
            <Label className="text-sm text-muted mt-2 text-center mb-6">Configura recordatorios para que Panda ayude a tu hijo durante el día.</Label>
            <Button variant="primary" feedbackVariant="scale-ripple" onPress={() => navigation.navigate('RutinaForm')}>
              <Button.Label>Crear primera rutina</Button.Label>
            </Button>
          </View>
        ) : (
          rutinas.map((rutina) => (
            <Card key={rutina.id} variant="default" className="mb-3 rounded-[24px] bg-surface border-0">
              <Card.Body className="p-4">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl justify-center items-center mr-4" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
                    <Ionicons name="time" size={24} color="#6366F1" />
                  </View>
                  
                  <View className="flex-1">
                    <Label className="text-base font-bold text-white mb-0.5">{rutina.nombre}</Label>
                    <View className="flex-row items-center gap-2">
                      <Label className="text-2xl font-extrabold" style={{ color: accent } as any}>{formatHora(rutina.hora)}</Label>
                      {rutina.repetir && (
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
                          <Label className="text-[10px] font-bold" style={{ color: '#6366F1' } as any}>Repetir diario</Label>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View className="items-end justify-between h-full py-1">
                    <RNSwitch
                      trackColor={{ false: muted as any, true: '#6366F1' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor={muted}
                      onValueChange={() => toggleRutina(rutina.id, rutina.isActive)}
                      value={rutina.isActive}
                      style={{ marginBottom: 8 }}
                    />
                    <View className="flex-row gap-3">
                      <Pressable onPress={() => navigation.navigate('RutinaForm', { rutina })}>
                        <Ionicons name="pencil" size={18} color={accent} />
                      </Pressable>
                      <Pressable onPress={() => deleteRutina(rutina.id, rutina.nombre)}>
                        <Ionicons name="trash" size={18} color={danger} />
                      </Pressable>
                    </View>
                  </View>
                </View>

                {rutina.mensaje && (
                  <View className="mt-3 flex-row items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                    <Ionicons name="chatbubble-ellipses" size={14} color={muted} />
                    <Text className="text-xs text-muted flex-1" numberOfLines={1} style={{ color: muted }}>{rutina.mensaje}</Text>
                  </View>
                )}
              </Card.Body>
            </Card>
          ))
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}