import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { authService } from '../../services/auth';
import { rutinaService, toyService, configService } from '../../services/api';
import { Button, Card, Chip, Label, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

export default function HomeScreen({ navigation }: any) {
  const primary = useThemeColor('accent');
  const secondary = useThemeColor('accent-soft');
  const accent = useThemeColor('accent');
  const danger = useThemeColor('danger');
  const warning = useThemeColor('warning');
  const success = useThemeColor('success');
  const textSecondary = useThemeColor('muted');

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

  return (
    <ScrollView className="flex-1 px-4 pt-12 bg-background" showsVerticalScrollIndicator={false}>
      {/* Top Navigation Bar */}
      <View className="flex-row justify-between items-center mb-5">
        <View className="flex-1">
          <Label className="text-sm font-medium text-foreground-muted">{greeting}</Label>
          <Label className="text-2xl font-extrabold mt-0.5 text-foreground">{user?.name || 'Padre de Familia'} 👋</Label>
        </View>
        <IconButton icon="log-out-outline" color={danger} variant="solid" onPress={handleLogout} />
      </View>

      {/* Widget Card de Estado de Juguete */}
      <Card variant="default" className="mb-4">
        <Card.Body>
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="hardware-chip-outline" size={22} color={primary} />
            <Label className="text-base font-bold text-foreground">Estado de {deviceName}</Label>
          </View>

          <View className="flex-row justify-between mb-4">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="wifi" size={18} color={totalToys > 0 ? success : textSecondary} />
              <Label className="text-sm font-semibold text-foreground">
                {totalToys > 0 ? `${connectedToys}/${totalToys} Online` : 'Sin conectar'}
              </Label>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="shield-checkmark-outline" size={18} color={success} />
              <Label className="text-sm font-semibold text-foreground">Protegido</Label>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="battery-charging" size={18} color={primary} />
              <Label className="text-sm font-semibold text-foreground">85% Batería</Label>
            </View>
          </View>

          <View className="flex-row items-center p-3 rounded-2xl gap-2 bg-surface">
            <Ionicons name="alarm-outline" size={18} color={primary} />
            <Label className="text-sm font-medium flex-1 text-foreground">
              {nextRutina ? `Próxima rutina: ${nextRutina}` : 'No hay rutinas activas para hoy'}
            </Label>
          </View>
        </Card.Body>
      </Card>

      {/* Botón Destacado: Hablar con Panda */}
      <Button
        variant="primary"
        feedbackVariant="scale-ripple"
        onPress={handleTalk}
        className="w-full flex-row my-4 py-4 rounded-3xl"
      >
        <View className="w-11 h-11 rounded-full bg-white/20 justify-center items-center mr-3">
          <Ionicons name="mic" size={22} color="white" />
        </View>
        <View className="flex-1">
          <Button.Label className="text-lg font-extrabold text-left text-white">Hablar con Panda</Button.Label>
          <Button.Label className="text-xs opacity-80 text-left text-white">Voz interactiva en tiempo real</Button.Label>
        </View>
        <Ionicons name="chevron-forward" size={22} color="white" />
      </Button>

      {/* Grid de Accesos Rápidos */}
      <Label className="text-lg font-extrabold mt-2 mb-4 text-foreground">Accesos Rápidos</Label>

      <View className="flex-row flex-wrap gap-3 mb-4">
        <Pressable className="w-[31%] bg-surface rounded-3xl py-5 px-2 items-center mb-3" onPress={() => navigation.navigate('Supervision')}>
          <View className="w-13 h-13 rounded-full justify-center items-center mb-2 bg-accent/10">
            <Ionicons name="videocam" size={26} color={accent} />
          </View>
          <Label className="text-xs font-bold text-foreground text-center">Cámara en Vivo</Label>
        </Pressable>

        <Pressable className="w-[31%] bg-surface rounded-3xl py-5 px-2 items-center mb-3" onPress={() => navigation.navigate('Juegos')}>
          <View className="w-13 h-13 rounded-full justify-center items-center mb-2 bg-danger/10">
            <Ionicons name="game-controller" size={26} color={danger} />
          </View>
          <Label className="text-xs font-bold text-foreground text-center">Minijuegos IA</Label>
        </Pressable>

        <Pressable className="w-[31%] bg-surface rounded-3xl py-5 px-2 items-center mb-3" onPress={() => navigation.navigate('Música')}>
          <View className="w-13 h-13 rounded-full justify-center items-center mb-2 bg-warning/10">
            <Ionicons name="musical-notes" size={26} color={warning} />
          </View>
          <Label className="text-xs font-bold text-foreground text-center">Música & Nanas</Label>
        </Pressable>

        <Pressable className="w-[31%] bg-surface rounded-3xl py-5 px-2 items-center mb-3" onPress={() => navigation.navigate('Conversaciones')}>
          <View className="w-13 h-13 rounded-full justify-center items-center mb-2 bg-success/10">
            <Ionicons name="chatbubbles" size={26} color={success} />
          </View>
          <Label className="text-xs font-bold text-foreground text-center">Historial Chat</Label>
        </Pressable>

        <Pressable className="w-[31%] bg-surface rounded-3xl py-5 px-2 items-center mb-3" onPress={() => navigation.navigate('Rutinas')}>
          <View className="w-13 h-13 rounded-full justify-center items-center mb-2 bg-warning/15">
            <Ionicons name="time" size={26} color={warning} />
          </View>
          <Label className="text-xs font-bold text-foreground text-center">Rutinas</Label>
        </Pressable>

        <Pressable className="w-[31%] bg-surface rounded-3xl py-5 px-2 items-center mb-3" onPress={() => navigation.navigate('Historias')}>
          <View className="w-13 h-13 rounded-full justify-center items-center mb-2 bg-success/15">
            <Ionicons name="book" size={26} color={success} />
          </View>
          <Label className="text-xs font-bold text-foreground text-center">Cuentos IA</Label>
        </Pressable>
      </View>

      {/* Actividad Reciente */}
      <Card variant="secondary" className="mb-8">
        <Card.Body className="gap-2">
          <Label className="text-base font-bold text-foreground mb-1">Actividad Reciente</Label>
          {recentActivity.length > 0 ? recentActivity.map((item, index) => (
            <View key={index} className="flex-row items-center gap-2.5 py-3 border-b border-border">
              <Ionicons name={item.icon} size={18} color={item.color} />
              <Label className="text-sm flex-1 text-foreground">{item.text}</Label>
            </View>
          )) : (
            <View className="flex-row items-center gap-2.5 py-3">
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={textSecondary} />
              <Label className="text-sm text-foreground-muted">Sin interacciones recientes</Label>
            </View>
          )}
        </Card.Body>
      </Card>
      
      <View className="h-8" />
    </ScrollView>
  );
}