import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { Card, Label, Button, Chip, Spinner, useThemeColor } from 'heroui-native';
import { toyService } from '../../services/api';
import { storage } from '../../services/storage';
import { API_URL } from '../../config/env';
import { pandaBluetooth } from '../../services/pandaBluetooth';

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
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [familyCode, setFamilyCode] = useState('1');

  useEffect(() => {
    storage.getItem('user').then((userStr) => {
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u?.id) setFamilyCode(String(u.id));
        } catch (_) {}
      }
    });
  }, []);

  // Modo de conexión: 'bluetooth' (Escuela / Directo) o 'cloud' (Producción)
  const [connectionMode, setConnectionMode] = useState<'bluetooth' | 'cloud'>('bluetooth');
  const [isBtConnected, setIsBtConnected] = useState(false);
  const [connectingBt, setConnectingBt] = useState(false);

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

  const connectBluetooth = async (silent = false) => {
    setConnectingBt(true);
    try {
      await pandaBluetooth.connect('Panda_Fisico_BT');
      setIsBtConnected(true);
      setToy((prev: any) => ({ ...prev, isConnected: true }));
      if (!silent) {
        Alert.alert('🔵 ¡Bluetooth Conectado!', 'Panda_Fisico_BT está listo para recibir comandos.');
      }
    } catch (err: any) {
      setIsBtConnected(false);
      if (!silent) {
        Alert.alert(
          'Bluetooth no conectado',
          err?.message || 'Asegúrate de haber vinculado "Panda_Fisico_BT" en los Ajustes de Bluetooth de tu teléfono.'
        );
      }
    } finally {
      setConnectingBt(false);
    }
  };

  useEffect(() => {
    if (connectionMode === 'bluetooth') {
      connectBluetooth(true);
    }
  }, [connectionMode]);

  // Polling automático en modo Nube
  useEffect(() => {
    let timer: any = null;
    if (connectionMode === 'cloud') {
      loadTelemetry();
      timer = setInterval(loadTelemetry, 3500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [connectionMode, toy?.id]);

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
          if (!initialToyId || String(data.toyId) === String(initialToyId) || String(data.toyId) === String(toy?.id)) {
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
    try {
      let targetId = initialToyId || toy?.id;
      if (!targetId) {
        const all = await toyService.getAll();
        if (all.data.success && all.data.data.length > 0) {
          const firstToy = all.data.data[0];
          targetId = firstToy.id;
          setToy((prev: any) => ({ ...prev, ...firstToy }));
        }
      }

      if (targetId) {
        const res = await toyService.getTelemetry(targetId);
        if (res.data.success) {
          setToy((prev: any) => ({ ...prev, ...res.data.data }));
        }
      }
    } catch (error) {
      console.error('Error cargando telemetría de producción:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (connectionMode === 'bluetooth') {
      await connectBluetooth(true);
      setRefreshing(false);
    } else {
      await loadTelemetry();
    }
  };

  // Ejecutar abrazo remoto (por Bluetooth directo o Nube)
  const handleRemoteHug = async () => {
    setSendingAction(true);
    try {
      if (connectionMode === 'bluetooth') {
        let connected = isBtConnected;
        if (!connected) {
          try {
            await pandaBluetooth.connect('Panda_Fisico_BT');
            connected = true;
            setIsBtConnected(true);
          } catch (e: any) {
            Alert.alert(
              'Bluetooth no conectado',
              'Por favor vincula "Panda_Fisico_BT" en los Ajustes de Bluetooth de tu teléfono y pulsa de nuevo.'
            );
            return;
          }
        }
        await pandaBluetooth.sendHug();
        setToy((prev: any) => ({
          ...prev,
          isHugging: true,
          hugCount: (prev.hugCount || 0) + 1,
          lastHugAt: new Date(),
          isConnected: true,
        }));
        Alert.alert('🤗 ¡Abrazo enviado!', 'El Panda físico está abrazando ahora mismo vía Bluetooth.');
      } else {
        // Enviar a través de la API en Producción (Render)
        let targetId = toy?.id;
        if (!targetId) {
          const all = await toyService.getAll();
          if (all.data.success && all.data.data.length > 0) {
            targetId = all.data.data[0].id;
            setToy((prev: any) => ({ ...prev, ...all.data.data[0] }));
          }
        }

        if (!targetId) {
          Alert.alert('Sin Juguete', 'Primero registra un juguete en tu cuenta con el número de serie TOY-001.');
          return;
        }

        const res = await toyService.triggerAction(targetId, 'HUG');
        if (res.data.success) {
          setToy((prev: any) => ({
            ...prev,
            isHugging: true,
            hugCount: (prev.hugCount || 0) + 1,
            lastHugAt: new Date(),
          }));
          Alert.alert('🤗 ¡Abrazo enviado!', 'Panda ha recibido la orden de abrazar vía la nube.');
        } else {
          Alert.alert('Error', res.data.message || 'No se pudo enviar el abrazo.');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo comunicar con el Panda.');
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
              if (connectionMode === 'cloud' && toy?.id) {
                await toyService.triggerAction(toy.id, 'RESET_BATTERY');
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
        {/* Selector de Modo: Bluetooth (Directo) vs Nube */}
        <View className="flex-row bg-surface-secondary p-1 rounded-2xl mb-4">
          <Pressable
            className={`flex-1 py-2.5 items-center rounded-xl ${
              connectionMode === 'bluetooth' ? 'bg-accent shadow-sm' : ''
            }`}
            onPress={() => setConnectionMode('bluetooth')}
          >
            <Label
              className={`text-xs font-bold ${
                connectionMode === 'bluetooth' ? 'text-white' : 'text-muted'
              }`}
            >
              🔵 Bluetooth (Directo)
            </Label>
          </Pressable>

          <Pressable
            className={`flex-1 py-2.5 items-center rounded-xl ${
              connectionMode === 'cloud' ? 'bg-accent shadow-sm' : ''
            }`}
            onPress={() => setConnectionMode('cloud')}
          >
            <Label
              className={`text-xs font-bold ${
                connectionMode === 'cloud' ? 'text-white' : 'text-muted'
              }`}
            >
              ☁️ Nube (Remoto)
            </Label>
          </Pressable>
        </View>

        {/* Banner de Vinculación con el Teléfono Secundario (Panda Inside) */}
        <Pressable
          className="bg-[#10B981]/15 border border-[#10B981]/40 p-3.5 rounded-2xl mb-5 flex-row items-center justify-between"
          onPress={() => setShowPairingModal(true)}
        >
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-10 h-10 rounded-full bg-[#10B981]/20 items-center justify-center">
              <Ionicons name="phone-portrait" size={20} color="#059669" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Label className="text-foreground font-bold text-sm">Teléfono dentro de Panda</Label>
                <View className="bg-emerald-500/20 px-2 py-0.5 rounded-md">
                  <Label className="text-emerald-400 font-extrabold text-[10px]">CÓDIGO #{familyCode}</Label>
                </View>
              </View>
              <Label className="text-muted text-xs">Toca aquí para ver los pasos de conexión y vincularlo</Label>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#059669" />
        </Pressable>

        {/* Panel Bluetooth */}
        {connectionMode === 'bluetooth' && (
          <View className="bg-surface p-4 rounded-2xl mb-5 border border-accent/40 bg-accent/5">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="bluetooth" size={22} color={primary} />
                <Label className="text-foreground text-sm font-bold">Bluetooth ESP32</Label>
              </View>
              <Chip variant="soft" color={isBtConnected ? 'success' : 'warning'}>
                <Chip.Label>{isBtConnected ? 'Conectado' : 'Desconectado'}</Chip.Label>
              </Chip>
            </View>

            <Label className="text-muted text-xs mb-3">
              Dispositivo: <Label className="text-foreground font-semibold">Panda_Fisico_BT</Label>
              {'\n'}Comunicación directa sin cables ni router Wi-Fi.
            </Label>

            <Button
              variant={isBtConnected ? 'outline' : 'primary'}
              size="sm"
              className="rounded-xl"
              onPress={() => connectBluetooth(false)}
              isDisabled={connectingBt}
            >
              <Button.Label className="text-xs">
                {connectingBt ? 'Conectando...' : isBtConnected ? '🔄 Reconectar Bluetooth' : '🔵 Conectar a Panda_Fisico_BT'}
              </Button.Label>
            </Button>
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
              {connectionMode === 'bluetooth'
                ? 'Envía la señal directa e instantánea por Bluetooth al Panda (< 10 ms).'
                : 'Envía la señal a través de la nube a los servomotores del Panda.'}
            </Label>

            <Button
              variant="primary"
              size="lg"
              className="w-full rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-lg"
              onPress={handleRemoteHug}
              isDisabled={sendingAction}
            >
              <Button.Label className="font-bold">
                {sendingAction
                  ? 'Transmitiendo...'
                  : connectionMode === 'bluetooth'
                  ? '🤗 Dar Abrazo (Bluetooth)'
                  : '🤗 Dar Abrazo Remoto'}
              </Button.Label>
            </Button>
          </Card.Body>
        </Card>
      </ScrollView>

      {/* Modal Guía de Vinculación con el Teléfono Secundario */}
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
                <Label className="text-lg font-extrabold text-white">Vincular Teléfono del Juguete</Label>
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
                <Label className="text-3xl font-extrabold text-emerald-400 mt-1 tracking-widest">{familyCode}</Label>
                <Label className="text-[11px] text-gray-400 text-center mt-1">
                  Introduce este número en el teléfono que va dentro de Panda para que se conecten de inmediato.
                </Label>
              </View>

              {/* Pasos ordenados */}
              <View className="gap-4 mb-6">
                <View className="flex-row items-start gap-3">
                  <View className="w-7 h-7 rounded-full bg-blue-500/20 items-center justify-center mt-0.5">
                    <Label className="text-blue-400 font-bold text-xs">1</Label>
                  </View>
                  <View className="flex-1">
                    <Label className="text-white font-bold text-sm">Instala la App del Juguete</Label>
                    <Label className="text-gray-400 text-xs mt-0.5 leading-4">
                      En el teléfono secundario que meterás al peluche, instala el APK <Label className="text-emerald-400 font-bold text-xs">PandaAI-Juguete.apk</Label>.
                    </Label>
                  </View>
                </View>

                <View className="flex-row items-start gap-3">
                  <View className="w-7 h-7 rounded-full bg-blue-500/20 items-center justify-center mt-0.5">
                    <Label className="text-blue-400 font-bold text-xs">2</Label>
                  </View>
                  <View className="flex-1">
                    <Label className="text-white font-bold text-sm">Introduce el Código de Familia</Label>
                    <Label className="text-gray-400 text-xs mt-0.5 leading-4">
                      Al abrir la app en el teléfono secundario, pon el Código de Familia <Label className="text-white font-bold text-xs">{familyCode}</Label> y presiona Conectar.
                    </Label>
                  </View>
                </View>

                <View className="flex-row items-start gap-3">
                  <View className="w-7 h-7 rounded-full bg-blue-500/20 items-center justify-center mt-0.5">
                    <Label className="text-blue-400 font-bold text-xs">3</Label>
                  </View>
                  <View className="flex-1">
                    <Label className="text-white font-bold text-sm">Coloca el Teléfono dentro del Peluche</Label>
                    <Label className="text-gray-400 text-xs mt-0.5 leading-4">
                      Introduce el teléfono en el bolsillo del peluche alineando la <Label className="text-white font-bold text-xs">cámara frontal</Label> con el orificio del ojo o nariz de Panda.
                    </Label>
                  </View>
                </View>

                <View className="flex-row items-start gap-3">
                  <View className="w-7 h-7 rounded-full bg-blue-500/20 items-center justify-center mt-0.5">
                    <Label className="text-blue-400 font-bold text-xs">4</Label>
                  </View>
                  <View className="flex-1">
                    <Label className="text-white font-bold text-sm">Cero Calor y Pantalla en Sigilo</Label>
                    <Label className="text-gray-400 text-xs mt-0.5 leading-4">
                      La pantalla del teléfono dentro de Panda se mantendrá apagada para ahorrar batería y no sobrecalentar el peluche. La cámara solo se encenderá cuando abras Supervisión.
                    </Label>
                  </View>
                </View>
              </View>

              <Button
                variant="primary"
                onPress={() => setShowPairingModal(false)}
                className="w-full bg-emerald-600 rounded-2xl py-3"
              >
                <Button.Label className="text-white font-bold">¡Entendido, listo!</Button.Label>
              </Button>

              <Pressable
                onPress={() => {
                  setShowPairingModal(false);
                  navigation.navigate('PandaDevice', {
                    toyId: toy?.id,
                    toyName: toy?.name,
                    serialNumber: toy?.serialNumber,
                  });
                }}
                className="py-3 items-center mt-2"
              >
                <Label className="text-xs text-gray-500 underline">
                  🛠️ Probar Modo Panda en este dispositivo (Dev)
                </Label>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
