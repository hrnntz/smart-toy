import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { authService } from '../../services/auth';
import { rutinaService, toyService, configService } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';

export default function HomeScreen({ navigation }: any) {
  const { colors, typography, isDark } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('¡Hola!');
  const [nextRutina, setNextRutina] = useState<string | null>(null);
  const [connectedToys, setConnectedToys] = useState(0);
  const [totalToys, setTotalToys] = useState(0);
  const [deviceName, setDeviceName] = useState('Panda');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('🌅 Buenos días');
    else if (hour >= 12 && hour < 18) setGreeting('☀️ Buenas tardes');
    else if (hour >= 18 && hour < 22) setGreeting('🌆 Buenas noches');
    else setGreeting('🌙 Buenas noches');
  }, []);

  useEffect(() => {
    loadUser();
    loadNextRutina();
    loadDeviceStatus();
    loadRecentActivity();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await storage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setLoading(false);
        return;
      }
      const token = await storage.getItem('token');
      if (token) {
        const userData = await authService.getProfile();
        if (userData) {
          setUser(userData);
          await storage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadNextRutina = async () => {
    try {
      const res = await rutinaService.getAll();
      if (res.data.success && res.data.data.length > 0) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        let next = null;
        let minDiff = Infinity;
        for (const r of res.data.data) {
          const [h, m] = r.hora.split(':').map(Number);
          const diff = (h * 60 + m) - currentTime;
          if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            next = r;
          }
        }
        if (next) {
          setNextRutina(`${next.nombre} - ${next.hora}`);
        } else if (res.data.data.length > 0) {
          const first = res.data.data[0];
          setNextRutina(`${first.nombre} - ${first.hora}`);
        }
      }
    } catch (error) {
      console.error('Error cargando rutinas:', error);
    }
  };

  const loadDeviceStatus = async () => {
    try {
      const toysRes = await toyService.getAll();
      if (toysRes.data.success) {
        const toys = toysRes.data.data || [];
        setTotalToys(toys.length);
        setConnectedToys(toys.filter((t: any) => t.isConnected).length);
      }
      const configRes = await configService.getConfig();
      if (configRes.data.success) {
        setDeviceName(configRes.data.data?.deviceName || 'Panda');
      }
    } catch (error) {
      console.error('Error cargando estado del dispositivo:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const res = await toyService.getAll();
      if (res.data.success && res.data.data.length > 0) {
        const firstToy = res.data.data[0];
        const msgs = await toyService.getMessages(firstToy.id);
        if (msgs.data.success && msgs.data.data.length > 0) {
          const lastMsgs = msgs.data.data.slice(-2);
          setRecentActivity(lastMsgs.map((m: any) => ({
            icon: m.isUser ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
            color: m.isUser ? colors.primary : colors.secondary,
            text: m.isUser ? `Preguntaste: ${m.content.slice(0, 40)}${m.content.length > 40 ? '...' : ''}` : `Panda respondió: ${m.content.slice(0, 40)}${m.content.length > 40 ? '...' : ''}`,
          })));
        }
      }
    } catch (error) {
      console.error('Error cargando actividad:', error);
    }
  };

  const handleTalk = async () => {
    try {
      const res = await toyService.getAll();
      if (res.data.success && res.data.data.length > 0) {
        const toy = res.data.data[0];
        navigation.navigate('Chat', {
          toyId: toy.id,
          toyName: toy.name,
          avatarUrl: toy.avatarUrl,
        });
      } else {
        Alert.alert('Sin juguetes', 'Primero agrega un juguete para poder hablar con Panda.');
        navigation.navigate('ToyList');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con los juguetes');
    }
  };

  const handleLogout = async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
    navigation.replace('Welcome');
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Top Navigation Bar estilo Klarna */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Padre de Familia'} 👋</Text>
        </View>
        <IconButton icon="log-out-outline" color={colors.error} variant="solid" onPress={handleLogout} />
      </View>

      {/* Widget Card de Estado de Juguete (Tesla Vibe en Dark Mode, Klarna Vibe en Light Mode) */}
      <Card variant="elevated">
        <View style={styles.statusHeader}>
          <Ionicons name="hardware-chip-outline" size={22} color={colors.primary} />
          <Text style={[styles.statusTitle, { color: colors.text }]}>Estado de {deviceName}</Text>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Ionicons name="wifi" size={18} color={totalToys > 0 ? colors.success : colors.textSecondary} />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {totalToys > 0 ? `${connectedToys}/${totalToys} Online` : 'Sin conectar'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.text }]}>Protegido</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="battery-charging" size={18} color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.text }]}>85% Batería</Text>
          </View>
        </View>

        <View style={[styles.reminderBox, { backgroundColor: colors.surface }]}>
          <Ionicons name="alarm-outline" size={18} color={colors.primary} />
          <Text style={[styles.reminderText, { color: colors.text }]}>
            {nextRutina ? `Próxima rutina: ${nextRutina}` : 'No hay rutinas activas para hoy'}
          </Text>
        </View>
      </Card>

      {/* Botón Destacado: Hablar con Panda */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.talkButton, { backgroundColor: colors.primary }]}
        onPress={handleTalk}
      >
        <View style={styles.micCircle}>
          <Ionicons name="mic" size={24} color={colors.primary} />
        </View>
        <View style={styles.talkTextContainer}>
          <Text style={styles.talkButtonTitle}>Hablar con Panda</Text>
          <Text style={styles.talkButtonSub}>Voz interactiva en tiempo real</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Grid de Accesos Rápidos estilo Klarna */}
      <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>Accesos Rápidos</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Supervision')}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="videocam" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.gridText, { color: colors.text }]}>Cámara en Vivo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Juegos')}>
          <View style={[styles.iconCircle, { backgroundColor: '#EF444415' }]}>
            <Ionicons name="game-controller" size={26} color="#EF4444" />
          </View>
          <Text style={[styles.gridText, { color: colors.text }]}>Minijuegos IA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Música')}>
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary + '15' }]}>
            <Ionicons name="musical-notes" size={26} color={colors.secondary} />
          </View>
          <Text style={[styles.gridText, { color: colors.text }]}>Música & Nanas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Conversaciones')}>
          <View style={[styles.iconCircle, { backgroundColor: '#3B82F615' }]}>
            <Ionicons name="chatbubbles" size={26} color="#3B82F6" />
          </View>
          <Text style={[styles.gridText, { color: colors.text }]}>Historial Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Rutinas')}>
          <View style={[styles.iconCircle, { backgroundColor: '#F59E0B15' }]}>
            <Ionicons name="time" size={26} color="#F59E0B" />
          </View>
          <Text style={[styles.gridText, { color: colors.text }]}>Rutinas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Historias')}>
          <View style={[styles.iconCircle, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="book" size={26} color="#10B981" />
          </View>
          <Text style={[styles.gridText, { color: colors.text }]}>Cuentos IA</Text>
        </TouchableOpacity>
      </View>

      {/* Actividad Reciente */}
      <Card variant="flat" style={{ marginBottom: 32 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Actividad Reciente</Text>
        {recentActivity.length > 0 ? recentActivity.map((item, index) => (
          <View key={index} style={[styles.activityItem, { borderBottomColor: colors.border }]}>
            <Ionicons name={item.icon} size={18} color={item.color} />
            <Text style={[styles.activityText, { color: colors.text }]}>{item.text}</Text>
          </View>
        )) : (
          <View style={styles.activityItem}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.activityText, { color: colors.textSecondary }]}>Sin interacciones recientes</Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 14, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  statusTitle: { fontSize: 16, fontWeight: '700' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 13, fontWeight: '600' },
  reminderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 8,
  },
  reminderText: { fontSize: 13, fontWeight: '500', flex: 1 },
  talkButton: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 24,
    alignItems: 'center',
    marginVertical: 16,
  },
  micCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  talkTextContainer: { flex: 1 },
  talkButtonTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  talkButtonSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  sectionHeaderTitle: { fontSize: 18, fontWeight: '800', marginTop: 8, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  gridItem: {
    width: '31%',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  activityText: { fontSize: 13, flex: 1 },
});