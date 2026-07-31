import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { authService } from '../../services/auth';

export default function HomeScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('¡Hola!');

  // Determinar saludo según la hora
  useEffect(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting('🌅 Buenos días');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('☀️ Buenas tardes');
    } else if (hour >= 18 && hour < 22) {
      setGreeting('🌆 Buenas noches');
    } else {
      setGreeting('🌙 Buenas noches');
    }
  }, []);

  // Cargar usuario al montar el componente
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      console.log('📦 Cargando usuario...');
      
      // 1. Intentar obtener el usuario guardado en storage (para "Recordar sesión")
      const savedUser = await storage.getItem('user');
      console.log('👤 Usuario guardado en storage:', savedUser);
      
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          console.log('✅ Usuario cargado desde storage:', userData);
          setUser(userData);
          setLoading(false);
          return;
        } catch (e) {
          console.error('❌ Error parsing saved user:', e);
        }
      }
      
      // 2. Si no hay usuario guardado, intentar obtener del backend con el token
      const token = await storage.getItem('token');
      console.log('🔑 Token en storage:', token ? '✅ Existe' : '❌ No existe');
      
      if (token) {
        console.log('📡 Obteniendo perfil desde el backend...');
        const userData = await authService.getProfile();
        console.log('👤 Perfil desde backend:', userData);
        
        if (userData) {
          setUser(userData);
          // Guardar el usuario para futuras sesiones
          await storage.setItem('user', JSON.stringify(userData));
          console.log('💾 Usuario guardado en storage');
        }
      }
    } catch (error) {
      console.error('❌ Error cargando usuario:', error);
    } finally {
      setLoading(false);
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
      {/* Header con saludo personalizado */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>
            {user?.name || 'Usuario'}! 👋
          </Text>
          <Text style={styles.subGreeting}>
            {user?.email || 'Bienvenido a PandaAI'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      {/* Estado del Panda */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Ionicons name="wifi" size={20} color="#27AE60" />
            <Text style={styles.statusText}>Conectado</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="bluetooth" size={20} color="#27AE60" />
            <Text style={styles.statusText}>Conectado</Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="battery-charging" size={20} color="#F39C12" />
            <Text style={styles.statusText}>78%</Text>
          </View>
        </View>
        <View style={styles.reminderBox}>
          <Ionicons name="time-outline" size={18} color="#4A90D9" />
          <Text style={styles.reminderText}>Próximo recordatorio: 6:00 PM - Dormir</Text>
        </View>
      </View>

      {/* Botón para hablar */}
      <TouchableOpacity style={styles.talkButton}>
        <Ionicons name="mic" size={28} color="white" />
        <Text style={styles.talkButtonText}>Hablar con Panda</Text>
      </TouchableOpacity>

      {/* Grid de funciones rápidas */}
      <View style={styles.grid}>
        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('ChildList')}
        >
          <Ionicons name="people" size={32} color="#4A90D9" />
          <Text style={styles.gridText}>Mis Niños</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('ToyList')}
        >
          <Ionicons name="game-controller" size={32} color="#E67E22" />
          <Text style={styles.gridText}>Mis Juguetes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('Ingles')}
        >
          <Ionicons name="school" size={32} color="#8E44AD" />
          <Text style={styles.gridText}>Aprender inglés</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('Juegos')}
        >
          <Ionicons name="game-controller" size={32} color="#E74C3C" />
          <Text style={styles.gridText}>Juegos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('Conversaciones')}
        >
          <Ionicons name="chatbubbles" size={32} color="#3498DB" />
          <Text style={styles.gridText}>Conversaciones</Text>
        </TouchableOpacity>

        {/* ✅ RUTINAS - Ahora navega a la pantalla de Rutinas */}
        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('Rutinas')}
        >
          <Ionicons name="calendar" size={32} color="#4A90D9" />
          <Text style={styles.gridText}>Rutinas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridItem}>
          <Ionicons name="book" size={32} color="#E67E22" />
          <Text style={styles.gridText}>Historias</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridItem}>
          <Ionicons name="musical-notes" size={32} color="#27AE60" />
          <Text style={styles.gridText}>Música</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridItem}>
          <Ionicons name="camera" size={32} color="#2ECC71" />
          <Text style={styles.gridText}>Supervisión</Text>
        </TouchableOpacity>
      </View>

      {/* Actividad reciente */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        <View style={styles.activityItem}>
          <Ionicons name="chatbubble-ellipses" size={18} color="#4A90D9" />
          <Text style={styles.activityText}>Panda respondió: ¿Qué son los dinosaurios?</Text>
        </View>
        <View style={styles.activityItem}>
          <Ionicons name="musical-note" size={18} color="#27AE60" />
          <Text style={styles.activityText}>Reprodujo canción: Duérmete mi niño</Text>
        </View>
        <View style={styles.activityItem}>
          <Ionicons name="notifications" size={18} color="#F39C12" />
          <Text style={styles.activityText}>Recordatorio: Cepillarse los dientes</Text>
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
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
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    color: '#7F8C8D',
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 2,
  },
  subGreeting: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    color: '#2C3E50',
    fontWeight: '500',
  },
  reminderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FB',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  reminderText: {
    fontSize: 13,
    color: '#2C3E50',
  },
  talkButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90D9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  talkButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridItem: {
    width: '30%',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  gridText: {
    fontSize: 12,
    color: '#2C3E50',
    marginTop: 6,
    textAlign: 'center',
  },
  activitySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityText: {
    fontSize: 13,
    color: '#34495E',
    flex: 1,
  },
});