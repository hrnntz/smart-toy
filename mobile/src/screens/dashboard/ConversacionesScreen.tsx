import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { toyService } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';

interface Toy {
  id: number;
  name: string;
  serialNumber: string;
  isConnected: boolean;
  avatarUrl?: string;
}

export default function ConversacionesScreen({ navigation }: any) {
  const { colors, typography, isDark } = useTheme();

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
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Conversaciones</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Supervisión de chats del juguete</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {toys.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No hay juguetes vinculados para chatear</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Registra un juguete desde "Mis Juguetes"</Text>
          </View>
        ) : (
          toys.map((toy) => (
            <Card key={toy.id} variant="elevated" style={styles.card}>
              <TouchableOpacity style={styles.cardInner} onPress={() => openChat(toy)}>
                <Image
                  source={{ uri: toy.avatarUrl || 'https://image.pollinations.ai/prompt/cute%20panda%20toy?width=100&height=100' }}
                  style={styles.avatar}
                />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{toy.name}</Text>
                  <Text style={[styles.cardSerial, { color: colors.textSecondary }]}>🔑 S/N: {toy.serialNumber}</Text>
                  <Text style={[styles.cardStatus, { color: toy.isConnected ? colors.success : colors.error }]}>
                    {toy.isConnected ? '🟢 En línea • Listo para hablar' : '🔴 Desconectado'}
                  </Text>
                </View>
                <View style={[styles.chatBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="chatbubble-ellipses" size={22} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitleContainer: { flex: 1, marginLeft: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, marginTop: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, marginTop: 4 },
  card: { marginBottom: 12, padding: 0 },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700' },
  cardSerial: { fontSize: 12, marginTop: 2 },
  cardStatus: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  chatBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});