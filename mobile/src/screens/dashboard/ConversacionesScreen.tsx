import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  avatarUrl?: string;
}

export default function ConversacionesScreen({ navigation }: any) {
  const [toys, setToys] = useState<Toy[]>([]);
  const [loading, setLoading] = useState(true);

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#2C3E50" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Conversaciones</Text>
          <Text style={styles.subtitle}>Supervisión de chats del juguete</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {toys.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No hay juguetes vinculados para chatear</Text>
            <Text style={styles.emptySub}>Registra un juguete desde "Mis Juguetes"</Text>
          </View>
        ) : (
          toys.map((toy) => (
            <TouchableOpacity key={toy.id} style={styles.card} onPress={() => openChat(toy)}>
              <Image
                source={{ uri: toy.avatarUrl || 'https://image.pollinations.ai/prompt/cute%20panda%20toy?width=100&height=100' }}
                style={styles.avatar}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{toy.name}</Text>
                <Text style={styles.cardSerial}>🔑 S/N: {toy.serialNumber}</Text>
                <Text style={[styles.cardStatus, { color: toy.isConnected ? '#27AE60' : '#E74C3C' }]}>
                  {toy.isConnected ? '🟢 En línea • Listo para hablar' : '🔴 Desconectado'}
                </Text>
              </View>
              <View style={styles.chatBadge}>
                <Ionicons name="chatbubble-ellipses" size={22} color="#4A90D9" />
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 45 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { padding: 4, marginRight: 8 },
  headerTitleContainer: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 16, fontWeight: 'bold' },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 1,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14, backgroundColor: '#F1F5F9' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  cardSerial: { fontSize: 12, color: '#64748B', marginTop: 2 },
  cardStatus: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  chatBadge: { backgroundColor: '#EBF5FB', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});