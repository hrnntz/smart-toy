import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { authService } from '../../services/auth';
import { rutinaService, toyService, configService } from '../../services/api';
import { Button, Card, Chip, Label, Spinner, Avatar, useThemeColor } from 'heroui-native';

export default function HomeScreen({ navigation }: any) {
  const primary = useThemeColor('accent');
  const secondary = useThemeColor('accent-soft');
  const accent = useThemeColor('accent');
  const danger = useThemeColor('danger');
  const warning = useThemeColor('warning');
  const success = useThemeColor('success');
  const textSecondary = useThemeColor('muted');
  const foreground = useThemeColor('foreground');

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
            color: m.isUser ? primary : secondary,
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
          initialMode: 'voice',
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
      <View className="flex-1 justify-center items-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  const shortcuts = [
    { id: 'cam', title: 'Cámara en Vivo', icon: 'camera', color: '#3B82F6', route: 'Supervision' },
    { id: 'games', title: 'Minijuegos', icon: 'game-controller', color: '#7C3AED', route: 'Juegos' },
    { id: 'music', title: 'Música & Nanas', icon: 'musical-notes', color: '#10B981', route: 'Musica' },
    { id: 'chat', title: 'Historial', icon: 'chatbubbles', color: accent, route: 'Conversaciones' },
    { id: 'routines', title: 'Rutinas', icon: 'calendar', color: '#6366F1', route: 'Rutinas' },
    { id: 'stories', title: 'Cuentos IA', icon: 'book', color: '#F59E0B', route: 'Historias' },
    { id: 'english', title: 'Aprender Inglés', icon: 'language', color: '#EF4444', route: 'Ingles' },
    { id: 'settings', title: 'Configuración', icon: 'settings', color: '#6B7280', route: 'Configuracion' },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between pt-14 pb-4">
          <View>
            <Label className="text-muted text-sm">{greeting}</Label>
            <Label className="text-foreground text-2xl font-bold">{user?.name || 'Usuario'} 👋</Label>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="w-10 h-10 rounded-full bg-surface items-center justify-center">
              <Ionicons name="notifications-outline" size={22} color={textSecondary} />
            </Pressable>
            <Avatar className="w-10 h-10">
              <Avatar.Fallback className="bg-accent/20">
                <Label className="text-accent font-bold text-lg">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Label>
              </Avatar.Fallback>
            </Avatar>
          </View>
        </View>

        {/* Panda Status Card */}
        <Card variant="default" className="rounded-3xl mb-6">
          <Card.Body>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-14 h-14 rounded-full bg-accent/10 items-center justify-center mr-4">
                  <Label className="text-3xl">🐼</Label>
                </View>
                <View>
                  <Label className="text-foreground font-bold text-lg">{deviceName}</Label>
                  <View className="flex-row items-center mt-1">
                    <View className={`w-2 h-2 rounded-full mr-2 ${connectedToys > 0 ? 'bg-success' : 'bg-danger'}`} />
                    <Label className="text-muted text-sm">
                      {totalToys > 0 ? `Online ${connectedToys}/${totalToys}` : 'Sin conectar'}
                    </Label>
                  </View>
                </View>
              </View>
              <Chip variant="soft" color={connectedToys > 0 ? 'success' : 'danger'}>
                <Chip.Label>{connectedToys > 0 ? 'Online' : 'Offline'}</Chip.Label>
              </Chip>
            </View>
            {nextRutina && (
              <View className="mt-4 flex-row items-center bg-surface-secondary py-2 px-3 rounded-full self-start">
                <Ionicons name="alarm-outline" size={16} color={textSecondary} className="mr-2" />
                <Label className="text-muted text-xs ml-1 font-medium">{nextRutina}</Label>
              </View>
            )}
          </Card.Body>
        </Card>

        {/* Hero CTA */}
        <Pressable 
          className="w-full bg-accent rounded-3xl p-6 mb-8 shadow-md"
          onPress={handleTalk}
        >
          <View className="flex-row items-center justify-between w-full">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
                <Ionicons name="mic" size={24} color="white" />
              </View>
              <View>
                <Label className="text-white text-xl font-bold">Hablar con Panda</Label>
                <Label className="text-white/70 text-xs mt-0.5">Voz interactiva • ElevenLabs IA</Label>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </View>
        </Pressable>

        {/* Accesos Rápidos */}
        <Label className="text-foreground text-lg font-bold mb-4">Accesos Rápidos</Label>
        <View className="flex-row flex-wrap justify-between">
          {shortcuts.map((item) => (
            <View key={item.id} className="w-[48%] mb-4">
              <Pressable 
                className="w-full"
                onPress={() => item.route && navigation.navigate(item.route)}
              >
                <Card variant="default" className="rounded-3xl py-5 items-center">
                  <Card.Body className="items-center p-0">
                    <View 
                      className="w-12 h-12 rounded-full items-center justify-center mb-2"
                      style={{ backgroundColor: `${item.color}1E` }} // 12% opacity approx
                    >
                      <Ionicons name={item.icon as any} size={24} color={item.color} />
                    </View>
                    <Label className="text-foreground text-xs font-bold text-center mt-2">
                      {item.title}
                    </Label>
                  </Card.Body>
                </Card>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Actividad Reciente */}
        <Card variant="secondary" className="mt-4 rounded-3xl">
          <Card.Body>
            <View className="flex-row items-center mb-3">
              <Ionicons name="time-outline" size={18} color={textSecondary} className="mr-2" />
              <Label className="text-foreground font-bold">Actividad Reciente</Label>
            </View>
            
            {recentActivity.length > 0 ? (
              <View className="gap-3 mt-2">
                {recentActivity.map((activity, index) => (
                  <View key={index} className="flex-row items-start">
                    <Ionicons name={activity.icon} size={16} color={activity.color} className="mr-3 mt-1" />
                    <Label className="text-muted text-sm flex-1">{activity.text}</Label>
                  </View>
                ))}
              </View>
            ) : (
              <Label className="text-muted text-sm mt-2">
                No hay actividad reciente.
              </Label>
            )}
          </Card.Body>
        </Card>
        
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}