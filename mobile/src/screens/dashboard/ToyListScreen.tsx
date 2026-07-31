// src/screens/dashboard/ToyListScreen.tsx
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { toyService } from '../../services/api';

interface Toy {
  id: number;
  name: string;
  serialNumber: string;
  isConnected: boolean;
  personality?: string;
  context?: string;
  avatarUrl?: string; // ✅ Avatar generado
  createdAt: string;
  child?: { id: number; name: string };
}

export default function ToyListScreen({ navigation }: any) {
  const [toys, setToys] = useState<Toy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    if (!window.confirm(`¿Eliminar "${name}"?`)) return;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        await fetch(`http://192.168.1.2:3000/api/toy/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert('Éxito', 'Juguete eliminado');
        loadToys();
      } catch (error) {
        Alert.alert('Error', 'No se pudo eliminar');
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
        <Text style={styles.title}>Mis Juguetes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('ToyForm')}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {toys.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="game-controller-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tienes juguetes registrados</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('ToyForm')}>
              <Text style={styles.emptyButtonText}>Agregar juguete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          toys.map(toy => (
            <View key={toy.id} style={styles.card}>
              <View style={styles.cardContent}>
                {/* ✅ Avatar del juguete */}
                <Image
                  source={{ uri: toy.avatarUrl || 'https://via.placeholder.com/48' }}
                  style={styles.avatar}
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{toy.name}</Text>
                  <Text style={styles.cardSerial}>🔑 {toy.serialNumber}</Text>
                  {toy.child && <Text style={styles.cardChild}>👶 {toy.child.name}</Text>}
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Chat', {
                    toyId: toy.id,
                    toyName: toy.name,
                    avatarUrl: toy.avatarUrl,
                  })}
                  style={styles.chatButton}
                >
                  <Ionicons name="chatbubble" size={16} color="white" />
                  <Text style={styles.chatButtonText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleToggle(toy.id)}
                  style={[styles.connectionButton, toy.isConnected ? styles.connected : styles.disconnected]}
                >
                  <Ionicons name={toy.isConnected ? 'bluetooth' : 'bluetooth-outline'} size={16} color="white" />
                  <Text style={styles.connectionText}>{toy.isConnected ? 'Conectado' : 'Conectar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('ToyForm', { toy })} style={styles.actionButton}>
                  <Ionicons name="pencil" size={20} color="#3498DB" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteToy(toy.id, toy.name)} style={styles.actionButton}>
                  <Ionicons name="trash" size={20} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingHorizontal: 16, paddingTop: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', flex: 1, textAlign: 'center' },
  addButton: { backgroundColor: '#4A90D9', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16 },
  emptyButton: { marginTop: 20, backgroundColor: '#4A90D9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#F0F0F0' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#2C3E50' },
  cardSerial: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  cardChild: { fontSize: 13, color: '#27AE60', marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6, flexWrap: 'wrap' },
  chatButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8E44AD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, gap: 4 },
  chatButtonText: { color: 'white', fontSize: 11, fontWeight: '600' },
  connectionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, gap: 4 },
  connected: { backgroundColor: '#27AE60' },
  disconnected: { backgroundColor: '#7F8C8D' },
  connectionText: { color: 'white', fontSize: 11, fontWeight: '600' },
  actionButton: { padding: 6 },
});