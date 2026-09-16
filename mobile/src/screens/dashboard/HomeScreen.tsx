import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { authService } from '../../services/auth';
import { rutinaService, toyService, configService } from '../../services/api';
import { Button, Card, Chip, Label, Spinner, Avatar, useThemeColor } from 'heroui-native';
import io, { Socket } from 'socket.io-client';
import { API_URL } from '../../config/env';

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
  const [toyData, setToyData] = useState<any>(null);
  const [showPairingModal, setShowPairingModal] = useState(false);

  const familyCode = String(user?.id || 1);

  useEffect(() => {
    let socket: Socket | null = null;
    const connectSocket = async () => {
      try {
        const token = await storage.getItem('token');
        const userStr = await storage.getItem('user');
        const u = userStr ? JSON.parse(userStr) : null;
        const socketServerUrl = API_URL.replace(/\/api\/?$/, '');
        socket = io(socketServerUrl, {
          transports: ['websocket'],
          auth: { token },
        });

        socket.on('connect', () => {
          if (u?.id) socket?.emit('join:parent', String(u.id));
        });

        socket.on('toy:status_changed', (data: any) => {
          setToyData((prev: any) => ({ ...prev, ...data }));
          if (data.isConnected !== undefined) {
            setConnectedToys(data.isConnected ? 1 : 0);
          }
        });
      } catch (e) {
        console.error('Error conectando socket en Home:', e);
      }
    };
    connectSocket();
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

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
        if (toys.length > 0) {
          setToyData(toys[0]);
        }
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
        return;
      }
    } catch (error) {
      console.warn('Cargando chat con Panda por defecto:', error);
    }
    // Si no hay juguetes aún o hay retraso de red, abrir chat de voz de inmediato
    navigation.navigate('Chat', {
      toyId: 1,
      toyName: 'Panda',
      initialMode: 'voice',
    });
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
    { id: 'panda_inside', title: 'Panda Inside', icon: 'phone-portrait-outline', color: '#10B981', route: 'PandaDevice' },
    { id: 'games', title: 'Minijuegos', icon: 'game-controller', color: '#7C3AED', route: 'Juegos' },
    { id: 'music', title: 'Música & Nanas', icon: 'musical-notes', color: '#EC4899', route: 'Musica' },
    { id: 'chat', title: 'Historial', icon: 'chatbubbles', color: accent, route: 'Conversaciones' },
    { id: 'routines', title: 'Rutinas', icon: 'calendar', color: '#6366F1', route: 'Rutinas' },
    { id: 'stories', title: 'Cuentos IA', icon: 'book', color: '#F59E0B', route: 'Historias' },
    { id: 'english', title: 'Aprender Inglés', icon: 'language', color: '#EF4444', route: 'Ingles' },
    { id: 'settings', title: 'Configuración', icon: 'settings', color: '#6B7280', route: 'Configuracion' },
    { id: 'toy_control', title: 'Control Panda', icon: 'hardware-chip-outline', color: '#8B5CF6', route: 'ToyControl' },
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

        {/* 📱 BANNER DESTACADO: VINCULAR TELÉFONO QUE VA ADENTRO DEL PELUCHE */}
        <Pressable
          className="bg-emerald-500/15 border-2 border-emerald-500/40 rounded-3xl p-4 mb-5 shadow-sm"
          onPress={() => setShowPairingModal(true)}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-2xl bg-emerald-500/25 items-center justify-center mr-3">
                <Ionicons name="phone-portrait" size={24} color="#10B981" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Label className="text-foreground font-extrabold text-base">
                    Teléfono dentro de Panda
                  </Label>
                  <View className="bg-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Label className="text-[#059669] dark:text-[#34D399] font-bold text-[10px]">
                      {connectedToys > 0 ? '🟢 CONECTADO' : '🔗 VINCULAR'}
                    </Label>
                  </View>
                </View>
                <Label className="text-muted text-xs mt-0.5">
                  Código de Familia: <Label className="text-emerald-500 font-extrabold text-xs">{familyCode}</Label> • Toca aquí para ver cómo conectarlo
                </Label>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#10B981" />
          </View>
        </Pressable>

        {/* Panda Status Card con Batería y Abrazos en Vivo */}
        <Pressable
          onPress={() =>
            navigation.navigate('ToyControl', {
              toyId: toyData?.id,
              toyName: deviceName,
            })
          }
        >
          <Card variant="default" className="rounded-3xl mb-6">
            <Card.Body>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-14 h-14 rounded-full bg-accent/10 items-center justify-center mr-4">
                    <Label className="text-3xl">{toyData?.isHugging ? '🤗' : '🐼'}</Label>
                  </View>
                  <View>
                    <Label className="text-foreground font-bold text-lg">{deviceName}</Label>
                    <View className="flex-row items-center mt-1 gap-2">
                      <View className="flex-row items-center">
                        <View className={`w-2 h-2 rounded-full mr-1.5 ${connectedToys > 0 ? 'bg-success' : 'bg-danger'}`} />
                        <Label className="text-muted text-xs">
                          {totalToys > 0 ? `Online` : 'Sin conectar'}
                        </Label>
                      </View>
                      {toyData?.batteryLevel !== undefined && (
                        <View className="flex-row items-center bg-surface-secondary px-2 py-0.5 rounded-full">
                          <Ionicons
                            name="battery-charging"
                            size={12}
                            color={toyData.batteryLevel > 20 ? success : danger}
                            className="mr-1"
                          />
                          <Label className="text-foreground text-[11px] font-semibold">
                            {Math.round(toyData.batteryLevel)}%
                          </Label>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <View className="items-end gap-1">
                  <Chip variant="soft" color={connectedToys > 0 ? 'success' : 'danger'}>
                    <Chip.Label>{connectedToys > 0 ? 'Online' : 'Offline'}</Chip.Label>
                  </Chip>
                  <View className="flex-row items-center">
                    <Label className="text-accent text-xs font-semibold">Controlar</Label>
                    <Ionicons name="chevron-forward" size={14} color={primary} />
                  </View>
                </View>
              </View>

              {/* Banner si el sensor o servos están en abrazo activo */}
              {toyData?.isHugging && (
                <View className="mt-3 flex-row items-center bg-accent/15 py-1.5 px-3 rounded-2xl">
                  <Label className="text-xs font-bold text-accent">
                    🤗 ¡Panda está dando un abrazo en vivo a tu hijo!
                  </Label>
                </View>
              )}

              {nextRutina && (
                <View className="mt-3 flex-row items-center bg-surface-secondary py-2 px-3 rounded-full self-start">
                  <Ionicons name="alarm-outline" size={16} color={textSecondary} className="mr-2" />
                  <Label className="text-muted text-xs ml-1 font-medium">{nextRutina}</Label>
                </View>
              )}
            </Card.Body>
          </Card>
        </Pressable>

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
                onPress={() => {
                  if (item.id === 'panda_inside') {
                    setShowPairingModal(true);
                  } else if (item.route) {
                    navigation.navigate(item.route);
                  }
                }}
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

      {/* MODAL GUÍA DE VINCULACIÓN DEL TELÉFONO INTERIOR */}
      <Modal
        visible={showPairingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPairingModal(false)}
      >
        <View className="flex-1 justify-end bg-black/75">
          <View className="bg-[#161922] rounded-t-3xl p-6 border-t border-white/10 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-4 border-b border-white/10">
              <View className="flex-row items-center gap-2">
                <Ionicons name="phone-portrait-outline" size={24} color="#10B981" />
                <Label className="text-lg font-extrabold text-white">Conectar Teléfono al Peluche</Label>
              </View>
              <Pressable
                onPress={() => setShowPairingModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="white" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
              {/* Código de Familia Destacado */}
              <View className="bg-[#1E2230] p-4 rounded-2xl items-center mb-5 border border-emerald-500/30">
                <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Tu Código de Familia</Label>
                <Label className="text-4xl font-extrabold text-emerald-400 mt-1 tracking-widest">{familyCode}</Label>
                <Label className="text-[11px] text-gray-400 text-center mt-1">
                  Introduce este número en el teléfono secundario que meterás dentro de Panda.
                </Label>
              </View>

              {/* Pasos ordenados */}
              <View className="gap-4 mb-6">
                <View className="flex-row items-start gap-3">
                  <View className="w-7 h-7 rounded-full bg-emerald-500/20 items-center justify-center mt-0.5">
                    <Label className="text-emerald-400 font-bold text-xs">1</Label>
                  </View>
                  <View className="flex-1">
                    <Label className="text-white font-bold text-sm">Instala la App en el Teléfono Secundario</Label>
                    <Label className="text-gray-400 text-xs mt-0.5 leading-4">
                      En el teléfono que meterás al peluche, instala el APK <Label className="text-emerald-400 font-bold text-xs">PandaAI-Juguete.apk</Label>.
                    </Label>
                  </View>
                </View>

                <View className="flex-row items-start gap-3">
                  <View className="w-7 h-7 rounded-full bg-emerald-500/20 items-center justify-center mt-0.5">
                    <Label className="text-emerald-400 font-bold text-xs">2</Label>
                  </View>
                  <View className="flex-1">
                    <Label className="text-white font-bold text-sm">Introduce el Código de Familia</Label>
                    <Label className="text-gray-400 text-xs mt-0.5 leading-4">
                      Abre la app en ese teléfono secundario. Si te pide el código, escribe <Label className="text-white font-bold text-xs">{familyCode}</Label> y pulsa Vincular (o inicia sesión con esta cuenta).
                    </Label>
                  </View>
                </View>

                <View className="flex-row items-start gap-3">
                  <View className="w-7 h-7 rounded-full bg-emerald-500/20 items-center justify-center mt-0.5">
                    <Label className="text-emerald-400 font-bold text-xs">3</Label>
                  </View>
                  <View className="flex-1">
                    <Label className="text-white font-bold text-sm">Introduce el Teléfono en Panda</Label>
                    <Label className="text-gray-400 text-xs mt-0.5 leading-4">
                      Mete el celular en el bolsillo de Panda con la <Label className="text-white font-bold text-xs">cámara frontal</Label> asomando por el orificio del ojo o nariz.
                    </Label>
                  </View>
                </View>

                <View className="flex-row items-start gap-3">
                  <View className="w-7 h-7 rounded-full bg-emerald-500/20 items-center justify-center mt-0.5">
                    <Label className="text-emerald-400 font-bold text-xs">4</Label>
                  </View>
                  <View className="flex-1">
                    <Label className="text-white font-bold text-sm">¡Listo! Funcionamiento Automático</Label>
                    <Label className="text-gray-400 text-xs mt-0.5 leading-4">
                      La pantalla del peluche permanecerá apagada (modo sigilo sin calor ni gasto de batería). El peluche escuchará al niño, responderá por su altavoz y podrás ver video en vivo desde el botón "Cámara en Vivo".
                    </Label>
                  </View>
                </View>
              </View>

              <View className="gap-3 mb-4">
                <Button
                  variant="primary"
                  className="w-full bg-blue-600 rounded-2xl py-3"
                  onPress={() => {
                    setShowPairingModal(false);
                    navigation.navigate('Supervision');
                  }}
                >
                  <Button.Label className="text-white font-bold">📹 Ir a Cámara en Vivo</Button.Label>
                </Button>

                <Button
                  variant="tertiary"
                  onPress={() => {
                    setShowPairingModal(false);
                    navigation.navigate('PandaDevice');
                  }}
                >
                  <Button.Label className="text-gray-400 text-xs">
                    (Opcional) Probar Modo Juguete en este teléfono
                  </Button.Label>
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}