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
import { childService } from '../../services/api';

interface Child {
  id: number;
  name: string;
  birthDate: string;
  gender?: string;
  createdAt: string;
  toy?: any;
}

export default function ChildListScreen({ navigation }: any) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChildren = async () => {
    try {
      console.log('📦 Cargando niños...');
      const response = await childService.getAll();
      console.log('✅ Respuesta:', response.data);
      if (response.data.success) {
        setChildren(response.data.data || []);
      }
    } catch (error: any) {
      console.error('❌ Error loading children:', error);
      Alert.alert('Error', 'No se pudieron cargar los niños');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChildren();
  }, []);

  // ✅ Función de eliminación SIMPLIFICADA (usa window.confirm)
  const deleteChild = (id: number, name: string) => {
    console.log('🔴 Eliminar:', name, 'ID:', id);
    
    // Usar confirm nativo del navegador (funciona en web)
    if (!window.confirm(`¿Estás seguro que quieres eliminar a ${name}?`)) {
      return;
    }

    // Ejecutar eliminación
    (async () => {
      try {
        console.log('🗑️ Eliminando ID:', id);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://192.168.1.2:3000/api/child/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        console.log('✅ Respuesta:', data);
        
        if (data.success) {
          Alert.alert('Éxito', 'Niño eliminado correctamente');
          await loadChildren();
        } else {
          Alert.alert('Error', data.message || 'No se pudo eliminar');
        }
      } catch (error: any) {
        console.error('❌ Error:', error);
        Alert.alert('Error', 'No se pudo eliminar el niño');
      }
    })();
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
        <Text style={styles.title}>Mis Niños</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('ChildForm')}
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
        {children.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tienes niños registrados</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('ChildForm')}
            >
              <Text style={styles.emptyButtonText}>Agregar niño</Text>
            </TouchableOpacity>
          </View>
        ) : (
          children.map((child) => (
            <View key={child.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <Ionicons name="person" size={28} color="#4A90D9" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{child.name}</Text>
                  <Text style={styles.cardDate}>
                    {child.birthDate ? `📅 ${child.birthDate}` : 'Sin fecha'}
                  </Text>
                  {child.gender && (
                    <Text style={styles.cardGender}>⚧ {child.gender}</Text>
                  )}
                  {child.toy && (
                    <Text style={styles.cardToy}>
                      🧸 Juguete: {child.toy.name}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ChildForm', { child })}
                  style={styles.actionButton}
                >
                  <Ionicons name="pencil" size={20} color="#3498DB" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteChild(child.id, child.name)}
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
  cardDate: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
  },
  cardGender: {
    fontSize: 13,
    color: '#8E44AD',
    marginTop: 2,
  },
  cardToy: {
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