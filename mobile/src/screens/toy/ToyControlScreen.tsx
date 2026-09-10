import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  Animated,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { Card, Label, Button, Chip, Spinner, useThemeColor } from 'heroui-native';
import { toyService } from '../../services/api';
import { storage } from '../../services/storage';
import { API_URL } from '../../config/env';

export default function ToyControlScreen({ route, navigation }: any) {
  const { toyId: initialToyId, toyName: initialToyName } = route.params || {};

  const primary = useThemeColor('accent');
  const textSecondary = useThemeColor('muted');
  const successColor = useThemeColor('success');
  const dangerColor = useThemeColor('danger');
  const warningColor = useThemeColor('warning');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingAction, setSendingAction] = useState(false);

  // Modo de conexión: 'cloud' (Producción Render) o 'local' (Backup Wi-Fi directo)
  const [connectionMode, setConnectionMode] = useState<'cloud' | 'local'>('cloud');
  const [localIp, setLocalIp] = useState('192.168.4.1'); // IP por defecto del ESP32 (SoftAP o LAN)

  // Datos del juguete y telemetría
  const [toy, setToy] = useState<any>({
    id: initialToyId,
    name: initialToyName || 'Panda',
    serialNumber: 'TOY-001',
    isConnected: false,
    batteryLevel: 100,
    batteryMah: 6600,
    batteryHours: 41.2,
    sensorStatus: 'LIBRE',
    isHugging: false,
    hugCount: 0,
    lastHugAt: null,
  });

  const hugAnim = useRef(new Animated.Value(1)).current;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    loadTelemetry();
    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [initialToyId]);

  // Polling automático si está en modo Backup Local Directo
  useEffect(() => {
    let timer: any = null;
    if (connectionMode === 'local') {
      fetchLocalTelemetry();
      timer = setInterval(fetchLocalTelemetry, 2500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [connectionMode, localIp]);

  // Animación de pulso cuando Panda está abrazando
  useEffect(() => {
    if (toy.isHugging) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(hugAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(hugAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      hugAnim.setValue(1.0);
    }
  }, [toy.isHugging]);

  // WebSocket en Modo Nube (Producción)
  const setupSocket = async () => {
    try {
      const token = await storage.getItem('token');
      const userStr = await storage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const socketServerUrl = API_URL.replace(/\/api\/?$/, '');

      const socket = io(socketServerUrl, {
        transports: ['websocket'],
        auth: { token },
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        if (initialToyId) {
          socket.emit('join:toy', String(initialToyId));
        }
        if (user?.id) {
          socket.emit('join:parent', String(user.id));
        }
      });

      socket.on('toy:status_changed', (data: any) => {
        if (connectionMode === 'cloud') {
          if (!initialToyId || String(data.toyId) === String(initialToyId)) {
            setToy((prev: any) => ({
              ...prev,
              ...data,
              isConnected: true,
            }));
          }
        }
      });
    } catch (err) {
      console.error('Error configurando WebSocket:', err);
    }
  };

  // Cargar telemetría desde la API en Producción
  const loadTelemetry = async () => {
    if (connectionMode === 'local') {
      await fetchLocalTelemetry();
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (!initialToyId) {
        const all = await toyService.getAll();
        if (all.data.success && all.data.data.length > 0) {
          const firstToy = all.data.data[0];
          const res = await toyService.getTelemetry(firstToy.id);
          if (res.data.success) {
            setToy(res.data.data);
          }
        }
      } else {
        const res = await toyService.getTelemetry(initialToyId);
        if (res.data.success) {
          setToy(res.data.data);
        }
      }
    } catch (error) {
      console.error('Error cargando telemetría de producción:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Consultar telemetría en Modo Backup Local Directo (sin internet)
  const fetchLocalTelemetry = async () => {
    try {
      const response = await fetch(`http://${localIp}/telemetry`);
      if (response.ok) {
        const data = await response.json();
        setToy((prev: any) => ({
          ...prev,
          ...data,
          isConnected: true,
        }));
      }
    } catch (e) {
      // Fallo local temporal
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTelemetry();
  };

  // Ejecutar abrazo remoto (en Producción o Backup Local)
  const handleRemoteHug = async () => {
    setSendingAction(true);
    try {
      if (connectionMode === 'local') {
        // Enviar directo al servidor HTTP local del ESP32
        const res = await fetch(`http://${localIp}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'HUG' }),
        });
        if (res.ok) {
          setToy((prev: any) => ({
            ...prev,
            isHugging: true,
            hugCount: (prev.hugCount || 0) + 1,
            lastHugAt: new Date(),
          }));
          Alert.alert('🤗 ¡Abrazo local enviado!', 'El Panda físico está abrazando ahora mismo.');
        }
      } else {
        // Enviar a través de la API en Producción (Render)
        if (!toy?.id) return;
        const res = await toyService.triggerAction(toy.id, 'HUG');
        if (res.data.success) {
          setToy((prev: any) => ({
            ...prev,
            isHugging: true,
            hugCount: (prev.hugCount || 0) + 1,
            lastHugAt: new Date(),
          }));
          Alert.alert('🤗 ¡Abrazo enviado!', 'Panda está abrazando a tu hijo vía la nube.');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo comunicar con el Panda.');
    } finally {
      setSendingAction(false);
    }
  };

  // Reiniciar contador de batería al 100%
  const handleResetBattery = async () => {
    Alert.alert(
      'Recarga de Batería',
      '¿Has cargado la batería Samsung de 10.000 mAh al 100%? Esto restablecerá la estimación a 6.600 mAh disponibles.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, reiniciar al 100%',
          onPress: async () => {
            try {
              if (connectionMode === 'local') {
                await fetch(`http://${localIp}/action`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'RESET_BATTERY' }),
                });
              } else {
                if (toy?.id) await toyService.triggerAction(toy.id, 'RESET_BATTERY');
              }
              setToy((prev: any) => ({
                ...prev,
                batteryLevel: 100,
                batteryMah: 6600,
                batteryHours: 41.2,
              }));
              Alert.alert('Batería al 100%', 'Contador de batería restablecido exitosamente.');
            } catch (err) {
              Alert.alert('Error', 'No se pudo reiniciar la batería');
            }
          },
        },
      ]
    );
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return successColor;
    if (level > 20) return warningColor;
    return dangerColor;
  };

  const batteryColor = getBatteryColor(toy.batteryLevel || 100);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Spinner size="lg" />
        <Label className="text-muted mt-3 text-sm">Conectando con Panda...</Label>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-14 pb-4 px-4 flex-row items-center justify-between border-b border-separator/20">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-surface items-center justify-center"
        >
          <Ionicons name="arrow-back" size={22} color={primary} />
        </Pressable>
        <View className="items-center">
          <Label className="text-foreground text-xl font-bold">{toy.name}</Label>
          <Label className="text-muted text-xs">SN: {toy.serialNumber}</Label>
        </View>
        <Chip variant="soft" color={toy.isConnected ? 'success' : 'danger'}>
          <Chip.Label>{toy.isConnected ? 'En Línea' : 'Offline'}</Chip.Label>
        </Chip>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={primary} />
        }
      >
        {/* Selector de Modo: Producción vs Backup Local Directo */}
        <View className="flex-row bg-surface-secondary p-1.5 rounded-2xl mb-5">
          <Pressable
            className={`flex-1 py-2 items-center rounded-xl ${
              connectionMode === 'cloud' ? 'bg-accent shadow-sm' : ''
            }`}
            onPress={() => setConnectionMode('cloud')}
          >
            <Label
              className={`text-xs font-bold ${
                connectionMode === 'cloud' ? 'text-white' : 'text-muted'
              }`}
            >
              ☁️ Nube (Producción)
            </Label>
          </Pressable>

          <Pressable
            className={`flex-1 py-2 items-center rounded-xl ${
              connectionMode === 'local' ? 'bg-accent shadow-sm' : ''
            }`}
            onPress={() => setConnectionMode('local')}
          >
            <Label
              className={`text-xs font-bold ${
                connectionMode === 'local' ? 'text-white' : 'text-muted'
              }`}
            >
              📶 Backup Local Directo
            </Label>
          </Pressable>
        </View>

        {/* Configuración IP en modo Backup Local */}
        {connectionMode === 'local' && (
          <View className="bg-surface p-3.5 rounded-2xl mb-5 border border-separator/30">
            <Label className="text-foreground text-xs font-bold mb-1">
              IP del ESP32 en tu Wi-Fi / SoftAP:
            </Label>
            <View className="flex-row items-center bg-surface-secondary px-3 py-1.5 rounded-xl">
              <Ionicons name="wifi" size={16} color={primary} className="mr-2" />
              <TextInput
                value={localIp}
                onChangeText={setLocalIp}
                placeholder="192.168.4.1"
                className="flex-1 text-foreground text-sm font-medium"
                autoCapitalize="none"
              />
            </View>
            <Label className="text-muted text-[11px] mt-1.5">
              Si estás conectado a la red propia del Panda ("Panda_AP"), usa 192.168.4.1
            </Label>
          </View>
        )}

        {/* Card 1: Estado de Batería Samsung 10.000 mAh */}
        <Card variant="default" className="rounded-3xl mb-5 shadow-sm">
          <Card.Body className="p-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Ionicons name="battery-charging" size={24} color={batteryColor} />
                <Label className="text-foreground text-lg font-bold">Batería Power Bank</Label>
              </View>
              <Chip variant="soft" color={toy.batteryLevel > 20 ? 'success' : 'danger'}>
                <Chip.Label>{Math.round(toy.batteryLevel || 100)}%</Chip.Label>
              </Chip>
            </View>

            {/* Barra de progreso de batería */}
            <View className="w-full h-4 bg-surface-secondary rounded-full overflow-hidden mb-4">
              <View
                style={{
                  width: `${Math.min(100, Math.max(0, toy.batteryLevel || 100))}%`,
                  backgroundColor: batteryColor,
                }}
                className="h-full rounded-full"
              />
            </View>

            <View className="flex-row justify-between items-center py-2 border-t border-separator/20">
              <Label className="text-muted text-sm">Energía restante:</Label>
              <Label className="text-foreground font-semibold text-sm">
                {Math.round(toy.batteryMah || 6600)} / 6.600 mAh
              </Label>
            </View>

            <View className="flex-row justify-between items-center py-2 border-t border-separator/20">
              <Label className="text-muted text-sm">Tiempo estimado de uso:</Label>
              <Label className="text-accent font-bold text-sm">
                ~{(toy.batteryHours || 40).toFixed(1)} horas
              </Label>
            </View>

            <View className="flex-row justify-between items-center py-2 border-t border-separator/20 mb-2">
              <Label className="text-muted text-sm">Fuente:</Label>
              <Label className="text-foreground text-xs font-medium">Samsung 10.000 mAh (USB-C)</Label>
            </View>

            <Button
              variant="outline"
              size="sm"
              className="mt-2 rounded-2xl"
              onPress={handleResetBattery}
            >
              <Button.Label className="text-xs">🔄 Ya la cargué al 100% (Reiniciar)</Button.Label>
            </Button>
          </Card.Body>
        </Card>

        {/* Card 2: Estado Físico, Servos y Afecto */}
        <Card variant="default" className="rounded-3xl mb-5 shadow-sm">
          <Card.Body className="p-5">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="heart" size={24} color="#EC4899" />
                <Label className="text-foreground text-lg font-bold">Interacción & Abrazos</Label>
              </View>
              <Chip variant="soft" color={toy.isHugging ? 'danger' : 'accent'}>
                <Chip.Label>{toy.isHugging ? '🤗 Abrazando' : '😊 Esperando'}</Chip.Label>
              </Chip>
            </View>

            {/* Visual animado del Abrazo */}
            <View className="items-center py-4 bg-surface-secondary/40 rounded-2xl mb-4">
              <Animated.View style={{ transform: [{ scale: hugAnim }] }}>
                <Label className="text-6xl mb-2">{toy.isHugging ? '🤗' : '🐼'}</Label>
              </Animated.View>
              <Label className="text-foreground font-bold text-base mt-1">
                {toy.isHugging ? '¡Panda está dando un abrazo!' : 'Panda listo para recibir cariño'}
              </Label>
              <Label className="text-muted text-xs mt-0.5">
                {toy.sensorStatus === 'TOCADO'
                  ? 'Sensor táctil TTP223 activado'
                  : 'Sensor libre'}
              </Label>
            </View>

            <View className="flex-row justify-around py-3 bg-surface rounded-2xl border border-separator/30 mb-2">
              <View className="items-center">
                <Label className="text-2xl font-extrabold text-foreground">{toy.hugCount || 0}</Label>
                <Label className="text-muted text-xs">Abrazos dados</Label>
              </View>
              <View className="w-[1px] bg-separator/40" />
              <View className="items-center">
                <Label className="text-2xl font-extrabold text-foreground">
                  {toy.sensorStatus === 'TOCADO' ? 'Activo' : 'Libre'}
                </Label>
                <Label className="text-muted text-xs">Sensor TTP223</Label>
              </View>
            </View>
          </Card.Body>
        </Card>

        {/* Card 3: Control Remoto */}
        <Card variant="default" className="rounded-3xl mb-8 shadow-sm">
          <Card.Body className="p-5">
            <Label className="text-foreground text-lg font-bold mb-1">Acción Remota</Label>
            <Label className="text-muted text-xs mb-4">
              {connectionMode === 'cloud'
                ? 'Envía la señal a través de la nube a los servomotores del Panda.'
                : 'Envía la señal directamente por Wi-Fi local sin internet.'}
            </Label>

            <Button
              variant="primary"
              size="lg"
              className="rounded-2xl"
              onPress={handleRemoteHug}
              disabled={sendingAction}
            >
              <Button.Label className="font-bold">
                {sendingAction ? 'Transmitiendo...' : '🤗 Dar Abrazo Remoto'}
              </Button.Label>
            </Button>
          </Card.Body>
        </Card>
      </ScrollView>
    </View>
  );
}
