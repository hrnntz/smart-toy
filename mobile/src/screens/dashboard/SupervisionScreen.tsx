import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, Image, Dimensions, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../../config/env';
import { Card, Button, Label, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';
import { useUser } from '../../hooks/useUser';
import { storage } from '../../services/storage';

const { width } = Dimensions.get('window');

export default function SupervisionScreen({ navigation }: any) {
  const { user } = useUser();
  const roomId = user ? `${user.id}_PANDA_01` : 'PANDA_01';
  const familyCode = String(user?.id || 1);

  const [isConnected, setIsConnected] = useState(false);
  const [isReceivingVideo, setIsReceivingVideo] = useState(false);
  const [isToyOnline, setIsToyOnline] = useState(false);
  const [frameData, setFrameData] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Esperando transmisión...');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showPairingModal, setShowPairingModal] = useState(false);

  const [primary, success, danger, muted, surface, background] = useThemeColor([
    'accent', 'success', 'danger', 'muted', 'surface', 'background'
  ]);
  const cameraBlue = '#3B82F6';

  useEffect(() => {
    if (!user) return;
    let newSocket: Socket;

    const connectSocket = async () => {
      try {
        const token = await storage.getItem('token');
        const socketServerUrl = API_URL.replace(/\/api\/?$/, '');
        newSocket = io(socketServerUrl, {
          transports: ['websocket'],
          auth: { token },
        });

        newSocket.on('connect', () => {
          newSocket.emit('camera:join_stream', roomId);
          newSocket.emit('join:parent', String(user.id));
          // Señalizar al juguete que el padre está viendo en vivo (iniciar captura)
          newSocket.emit('camera:watch_start', { roomId });
          setIsConnected(true);
          setStatusText('Conectado a la sala familiar. Esperando video...');
        });

        newSocket.on('toy:status_changed', (data: any) => {
          if (data.isConnected !== undefined) {
            setIsToyOnline(data.isConnected);
          } else {
            setIsToyOnline(true);
          }
        });

        newSocket.on('toy:camera_ready', () => {
          setIsToyOnline(true);
          newSocket.emit('camera:watch_start', { roomId });
        });

        newSocket.on('camera:receive_frame', (data: { frame: string }) => {
          setFrameData(data.frame);
          setIsReceivingVideo(true);
          setIsToyOnline(true);
          setStatusText('Recibiendo video en vivo');
        });

        newSocket.on('camera:stream_ended', () => {
          setFrameData(null);
          setIsReceivingVideo(false);
          setStatusText('Transmisión finalizada');
          Alert.alert('Transmisión pausada', 'La cámara del juguete se ha detenido.');
        });

        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setStatusText('Error de conexión con el servidor');
        });

        setSocket(newSocket);
      } catch (err) {
        console.error('Error al iniciar socket:', err);
      }
    };

    connectSocket();

    // Reintentar periódicamente la señalización de visualización en caso de que el juguete conecte unos segundos después
    const pingInterval = setInterval(() => {
      if (newSocket && newSocket.connected) {
        newSocket.emit('camera:watch_start', { roomId });
      }
    }, 3000);

    return () => {
      clearInterval(pingInterval);
      if (newSocket) {
        newSocket.emit('camera:watch_stop', { roomId });
        newSocket.disconnect();
      }
    };
  }, [user, roomId]);

  const toggleConnection = () => {
    if (isConnected && socket) {
      socket.emit('camera:watch_stop', { roomId });
      socket.disconnect();
      setIsConnected(false);
      setFrameData(null);
      setIsReceivingVideo(false);
      setStatusText('Supervisión detenida');
    } else if (socket) {
      socket.connect();
      socket.emit('camera:join_stream', roomId);
      socket.emit('camera:watch_start', { roomId });
      setIsConnected(true);
      setStatusText('Reconectando...');
    }
  };

  const handleSendHug = async () => {
    try {
      if (socket && user) {
        socket.emit('parent:send_command', {
          toyId: '1',
          command: 'HUG',
        });
      }
      Alert.alert('🤗 ¡Abrazo Enviado!', 'Panda está mostrando la animación de abrazo y hablando con tu hijo en vivo.');
    } catch (e) {
      console.warn('Error enviando abrazo en supervisión:', e);
    }
  };

  return (
    <View className="flex-1 bg-[#0D0F16] pt-12">
      {/* Header */}
      <View className="flex-row items-center px-4 pb-4">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View className="flex-1 ml-3">
          <Label className="text-xl font-extrabold text-white">Cámara en Vivo</Label>
          <Label className="text-xs text-gray-400">Panda Inside • Transmisión Continua</Label>
        </View>
        <View
          className="px-3 py-1 rounded-full flex-row items-center gap-1.5"
          style={{ backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }}
        >
          <View className={`w-2 h-2 rounded-full ${isReceivingVideo ? 'bg-red-500 animate-pulse' : isConnected ? 'bg-emerald-400' : 'bg-gray-400'}`} />
          <Label className="text-xs font-bold" style={{ color: isConnected ? '#10B981' : muted } as any}>
            {isReceivingVideo ? 'EN VIVO' : isConnected ? 'Conectado' : 'Sin señal'}
          </Label>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Visor de Video - fadeDuration={0} elimina el parpadeo de imagen */}
        <View 
          className="w-full h-64 rounded-3xl overflow-hidden mb-4 mt-2 relative justify-center items-center shadow-lg" 
          style={{ 
            backgroundColor: '#0F121C',
            borderWidth: isConnected ? 2 : 1,
            borderColor: isReceivingVideo ? '#EF4444' : isConnected ? cameraBlue : 'rgba(255,255,255,0.1)'
          }}
        >
          {isReceivingVideo && frameData ? (
            <Image
              source={{ uri: frameData }}
              className="w-full h-full"
              resizeMode="cover"
              fadeDuration={0}
            />
          ) : (
            <View className="items-center justify-center w-full h-full px-6" style={{ backgroundColor: 'rgba(59, 130, 246, 0.04)' }}>
              <Ionicons name="videocam-outline" size={56} color={cameraBlue} />
              <Label className="text-sm font-semibold text-white mt-3 text-center">
                {statusText}
              </Label>
              <Label className="text-xs mt-1 text-center" style={{ color: muted } as any}>
                {isToyOnline ? 'El juguete está listo. Iniciando video...' : 'Asegúrate de que el teléfono en el peluche tenga abierta la app Panda Juguete.'}
              </Label>

              <Pressable
                onPress={() => setShowPairingModal(true)}
                className="mt-4 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/40 flex-row items-center gap-1.5"
              >
                <Ionicons name="link-outline" size={14} color="#60A5FA" />
                <Label className="text-xs font-bold text-[#60A5FA]">¿Cómo conectar el teléfono secundario?</Label>
              </Pressable>
            </View>
          )}

          {isReceivingVideo && (
            <View className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600/80 flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-white" />
              <Label className="text-white text-[10px] font-extrabold tracking-wider">REC</Label>
            </View>
          )}

          {isReceivingVideo && (
            <View className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60">
              <Label className="text-white/80 text-[10px] font-bold">Familia #{familyCode}</Label>
            </View>
          )}
        </View>

        {/* Tarjeta de Estado del Sistema */}
        <Card variant="default" className="mb-4 rounded-3xl bg-surface border-0 p-4">
          <Card.Body className="flex-row justify-between items-center p-0">
            <View className="items-center flex-1">
              <View className="flex-row items-center gap-1.5 mb-1">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: isConnected ? '#10B981' : danger }} />
                <Label className="text-xs text-white font-bold">Nube</Label>
              </View>
              <Label className="text-[10px]" style={{ color: muted } as any}>
                {isConnected ? 'En Línea' : 'Desconectado'}
              </Label>
            </View>
            
            <View className="w-[1px] h-8 bg-white/10" />
            
            <View className="items-center flex-1">
              <View className="flex-row items-center gap-1.5 mb-1">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: isToyOnline ? '#10B981' : '#F59E0B' }} />
                <Label className="text-xs text-white font-bold">Juguete</Label>
              </View>
              <Label className="text-[10px]" style={{ color: muted } as any}>
                {isToyOnline ? 'Conectado' : 'Esperando'}
              </Label>
            </View>

            <View className="w-[1px] h-8 bg-white/10" />

            <View className="items-center flex-1">
              <Ionicons name="film-outline" size={14} color={isReceivingVideo ? '#10B981' : muted} className="mb-1" />
              <Label className="text-xs text-white font-bold">Video</Label>
              <Label className="text-[10px]" style={{ color: muted } as any}>
                {isReceivingVideo ? 'Fluido' : 'En espera'}
              </Label>
            </View>
          </Card.Body>
        </Card>

        {/* Tarjeta Destacada de Vinculación Rápida */}
        <Pressable
          onPress={() => setShowPairingModal(true)}
          className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-3xl mb-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-12 h-12 rounded-2xl bg-emerald-500/20 items-center justify-center">
              <Ionicons name="qr-code-outline" size={24} color="#10B981" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Label className="text-white font-bold text-sm">Código de Familia:</Label>
                <View className="bg-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                  <Label className="text-emerald-300 font-extrabold text-sm">{familyCode}</Label>
                </View>
              </View>
              <Label className="text-gray-400 text-xs mt-0.5">Toca aquí para ver cómo vincular el teléfono del peluche</Label>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#10B981" />
        </Pressable>

        {/* Botones de Acción */}
        <View className="gap-3 mb-5">
          <Button
            variant="primary"
            feedbackVariant="scale-ripple"
            onPress={toggleConnection}
            style={{ backgroundColor: isConnected ? '#1E293B' : cameraBlue }}
          >
            <Button.Label className="text-white font-bold">
              {isConnected ? 'Pausar Supervisión' : 'Iniciar Conexión'}
            </Button.Label>
          </Button>

          {/* Enviar Abrazo interactivo al muñeco */}
          {isConnected && (
            <Button
              variant="outline"
              onPress={handleSendHug}
              className="border-[#EC4899]/40 bg-[#EC4899]/15"
            >
              <Button.Label className="text-[#F472B6] font-bold">
                🤗 Mandar Abrazo al Panda en Vivo
              </Button.Label>
            </Button>
          )}

          <Button
            variant="tertiary"
            onPress={() => navigation.navigate('PandaDevice')}
          >
            <Button.Label className="text-white font-semibold">
              🐼 Abrir Modo Juguete en este Teléfono (Prueba)
            </Button.Label>
          </Button>
        </View>
      </ScrollView>

      {/* MODAL GUÍA DE VINCULACIÓN DEL TELÉFONO SECUNDARIO */}
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
                      La pantalla del teléfono dentro de Panda se mantendrá apagada para ahorrar batería y no sobrecalentar el peluche. La cámara solo se encenderá cuando tú abras esta pantalla.
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
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
