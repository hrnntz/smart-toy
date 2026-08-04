import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { authService } from '../../services/auth';
import { rutinaService, toyService, configService } from '../../services/api';

export default function HomeScreen({ navigation }: any) {
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
            color: m.isUser ? '#4A90D9' : '#27AE60',
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
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Superior del Padre */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>{user?.name || 'Padre de Familia'} 👋</Text>
          <Text style={styles.subGreeting}>Panel de Control Smart Toy</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      {/* Tarjeta de Estado del Juguete */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons name="hardware-chip-outline" size={20} color="#4A90D9" />
          <Text style={styles.statusTitle}>Estado del Juguete ({deviceName})</Text>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Ionicons name="wifi" size={18} color={totalToys > 0 ? '#27AE60' : '#95A5A6'} />
            <Text style={styles.statusText}>{totalToys > 0 ? `${connectedToys}/${totalToys} Online` : 'Sin registrar'}</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#27AE60" />
            <Text style={styles.statusText}>Seguro</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="battery-charging" size={18} color="#F39C12" />
            <Text style={styles.statusText}>85% Batería</Text>
          </View>
        </View>

        <View style={styles.reminderBox}>
          <Ionicons name="alarm-outline" size={18} color="#4A90D9" />
          <Text style={styles.reminderText}>
            {nextRutina ? `Próxima rutina: ${nextRutina}` : 'No hay rutinas activas'}
          </Text>
        </View>
      </View>

      {/* Botón Principal: Hablar con Panda con IA */}
      <TouchableOpacity style={styles.talkButton} onPress={handleTalk}>
        <View style={styles.micCircle}>
          <Ionicons name="mic" size={24} color="#4A90D9" />
        </View>
        <View style={styles.talkTextContainer}>
          <Text style={styles.talkButtonTitle}>Hablar con Panda (Voz en Vivo)</Text>
          <Text style={styles.talkButtonSub}>Reconocimiento de Voz + ElevenLabs TTS</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="white" />
      </TouchableOpacity>

      {/* Menú de Funcionalidades */}
      <Text style={styles.sectionHeaderTitle}>Módulos de Control</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Supervision')}>
          <View style={[styles.iconCircle, { backgroundColor: '#E8F8F5' }]}>
            <Ionicons name="videocam" size={26} color="#27AE60" />
          </View>
          <Text style={styles.gridText}>Supervisión en Vivo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Juegos')}>
          <View style={[styles.iconCircle, { backgroundColor: '#FDEDEC' }]}>
            <Ionicons name="game-controller" size={26} color="#E74C3C" />
          </View>
          <Text style={styles.gridText}>Minijuegos IA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Música')}>
          <View style={[styles.iconCircle, { backgroundColor: '#EBF5FB' }]}>
            <Ionicons name="musical-notes" size={26} color="#3498DB" />
          </View>
          <Text style={styles.gridText}>Música IA & Cuna</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Conversaciones')}>
          <View style={[styles.iconCircle, { backgroundColor: '#F5EEF8' }]}>
            <Ionicons name="chatbubbles" size={26} color="#8E44AD" />
          </View>
          <Text style={styles.gridText}>Historial Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Rutinas')}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF9E7' }]}>
            <Ionicons name="time" size={26} color="#F1C40F" />
          </View>
          <Text style={styles.gridText}>Rutinas del Niño</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Historias')}>
          <View style={[styles.iconCircle, { backgroundColor: '#FBEEE6' }]}>
            <Ionicons name="book" size={26} color="#E67E22" />
          </View>
          <Text style={styles.gridText}>Cuentos IA</Text>
        </TouchableOpacity>
      </View>

      {/* Actividad Reciente */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Actividad Reciente del Juguete</Text>
        {recentActivity.length > 0 ? recentActivity.map((item, index) => (
          <View key={index} style={styles.activityItem}>
            <Ionicons name={item.icon} size={18} color={item.color} />
            <Text style={styles.activityText}>{item.text}</Text>
          </View>
        )) : (
          <View style={styles.activityItem}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#4A90D9" />
            <Text style={styles.activityText}>Sin interacciones registradas recientemente</Text>
          </View>
        )}
      </View>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingHorizontal: 16, paddingTop: 45 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 14, color: '#7F8C8D', fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginTop: 2 },
  subGreeting: { fontSize: 13, color: '#95A5A6', marginTop: 2 },
  logoutBtn: { backgroundColor: '#FDEDEC', padding: 10, borderRadius: 20 },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  statusTitle: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 13, color: '#2C3E50', fontWeight: '500' },
  reminderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FB',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  reminderText: { fontSize: 13, color: '#2C3E50', fontWeight: '500' },
  talkButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90D9',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
  },
  micCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  talkTextContainer: { flex: 1 },
  talkButtonTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  talkButtonSub: { color: '#EBF5FB', fontSize: 12, marginTop: 2 },
  sectionHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  gridItem: {
    width: '31%',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridText: { fontSize: 12, color: '#2C3E50', fontWeight: '600', textAlign: 'center' },
  activitySection: { backgroundColor: 'white', borderRadius: 16, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  activityText: { fontSize: 13, color: '#34495E', flex: 1 },
});