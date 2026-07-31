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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { rutinaService } from '../../services/api';

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

  const loadRutinas = async () => {
    try {
      console.log('📦 Cargando rutinas...');
      const response = await rutinaService.getAll();
      console.log('✅ Respuesta:', response.data);
      if (response.data.success) {
        setRutinas(response.data.data || []);
      }
    } catch (error: any) {
      console.error('❌ Error loading rutinas:', error);
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

  // ✅ Función de eliminación SIMPLIFICADA (igual que ChildListScreen)
  const deleteRutina = (id: number, nombre: string) => {
    console.log('🔴 Eliminar rutina:', nombre, 'ID:', id);
    
    // Usar confirm nativo del navegador (funciona en web)
    if (!window.confirm(`¿Estás seguro que quieres eliminar "${nombre}"?`)) {
      return;
    }

    // Ejecutar eliminación con fetch directo
    (async () => {
      try {
        console.log('🗑️ Eliminando ID:', id);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://192.168.1.2:3000/api/rutina/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        console.log('✅ Respuesta:', data);
        
        if (data.success) {
          Alert.alert('Éxito', 'Rutina eliminada correctamente');
          await loadRutinas();
        } else {
          Alert.alert('Error', data.message || 'No se pudo eliminar');
        }
      } catch (error: any) {
        console.error('❌ Error:', error);
        Alert.alert('Error', 'No se pudo eliminar la rutina');
      }
    })();
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.title}>Rutinas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('RutinaForm')}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.subtitle}>Diarias</Text>

        {rutinas.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tienes rutinas creadas</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('RutinaForm')}
            >
              <Text style={styles.emptyButtonText}>Agregar rutina</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rutinas.map((rutina) => (
            <View key={rutina.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <Ionicons name="time-outline" size={24} color="#4A90D9" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{rutina.nombre}</Text>
                  <Text style={styles.cardTime}>
                    🕐 {formatHora(rutina.hora)}
                    {rutina.repetir && ' 🔁 Diario'}
                  </Text>
                  {rutina.mensaje && (
                    <Text style={styles.cardMessage}>💬 {rutina.mensaje}</Text>
                  )}
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('RutinaForm', { rutina })}
                  style={styles.actionButton}
                >
                  <Ionicons name="pencil" size={20} color="#3498DB" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    console.log('🟢 Botón eliminar presionado para:', rutina.nombre);
                    deleteRutina(rutina.id, rutina.nombre);
                  }}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash" size={20} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            </View>
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
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4A90D9',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 12,
    marginTop: 8,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: '#4A90D9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    backgroundColor: '#EBF5FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  cardTime: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
  },
  cardMessage: {
    fontSize: 13,
    color: '#27AE60',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
});