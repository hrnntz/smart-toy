import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { rutinaService } from '../../services/api';
import { sendNotification } from '../../services/notificationService';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
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
  const { colors, typography, isDark } = useTheme();

  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: colors.text }]}>Rutinas del Niño</Text>
        <IconButton
          icon="add"
          variant="solid"
          color={colors.primary}
          onPress={() => navigation.navigate('RutinaForm')}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Diarias & Programadas</Text>

        {rutinas.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No tienes rutinas creadas</Text>
            <Button
              title="Agregar rutina"
              onPress={() => navigation.navigate('RutinaForm')}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          rutinas.map((rutina) => (
            <Card key={rutina.id} variant="elevated" style={styles.card}>
              <View style={styles.cardContent}>
                <View style={[styles.cardIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="time-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{rutina.nombre}</Text>
                  <Text style={[styles.cardTime, { color: colors.textSecondary }]}>
                    🕐 {formatHora(rutina.hora)}
                    {rutina.repetir && ' 🔁 Diario'}
                  </Text>
                  {rutina.mensaje && (
                    <Text style={[styles.cardMessage, { color: colors.success }]}>💬 {rutina.mensaje}</Text>
                  )}
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('RutinaForm', { rutina })}
                  style={styles.actionButton}
                >
                  <Ionicons name="pencil" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteRutina(rutina.id, rutina.nombre)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  card: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardTime: {
    fontSize: 13,
    marginTop: 2,
  },
  cardMessage: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
});