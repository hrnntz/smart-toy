import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, Image, Dimensions, ScrollView } from 'react-native';
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
  const [isConnected, setIsConnected] = useState(false);
  const [isReceivingVideo, setIsReceivingVideo] = useState(false);
  const [frameData, setFrameData] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Esperando transmisión...');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const [primary, success, danger, muted, surface, background] = useThemeColor([
    'accent', 'success', 'danger', 'muted', 'surface', 'background'
  ]);
  const cameraBlue = '#3B82F6';

  // Keep ALL socket logic and useEffect exactly as-is based on user's disk version
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
          setIsConnected(true);
          setStatusText('Conectado. Esperando video...');
        });

        newSocket.on('camera:receive_frame', (data: { frame: string }) => {
          setFrameData(data.frame);
          setIsReceivingVideo(true);
          setStatusText('Recibiendo video en vivo');
        });

        newSocket.on('camera:stream_ended', () => {
          setFrameData(null);
          setIsReceivingVideo(false);
          setStatusText('Transmisión finalizada');
          Alert.alert('Transmisión finalizada', 'La cámara del juguete se ha desconectado.');
        });

        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setStatusText('Error de conexión');
        });

        setSocket(newSocket);
      } catch (err) {
        console.error('Error al iniciar socket:', err);
      }
    };

    connectSocket();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user, roomId]);

  const toggleConnection = () => {
    if (isConnected && socket) {
      socket.disconnect();
      setIsConnected(false);
      setFrameData(null);
      setIsReceivingVideo(false);
      setStatusText('Desconectado');
    } else {
      setConnectionAttempts(prev => prev + 1); // trigger re-connect if we had complex logic
      setStatusText('Conectando...');
    }
  };

  return (
    <View className="flex-1 bg-[#0D0F16] pt-12">
      <View className="flex-row items-center px-4 pb-4">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View className="flex-1 ml-3">
          <Label className="text-xl font-extrabold text-white">Cámara en Vivo</Label>
        </View>
        <View className="px-3 py-1 rounded-full" style={{ backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }}>
          <Label className="text-xs font-bold" style={{ color: isConnected ? '#10B981' : muted } as any}>
            {isConnected ? 'En vivo' : 'Sin señal'}
          </Label>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View 
          className="w-full h-64 rounded-3xl overflow-hidden mb-6 mt-2 relative justify-center items-center" 
          style={{ 
            backgroundColor: surface,
            borderWidth: isConnected ? 2 : 0,
            borderColor: isConnected ? cameraBlue : 'transparent'
          }}
        >
          {isReceivingVideo && frameData ? (
            <Image source={{ uri: frameData }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="items-center justify-center w-full h-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
              <Ionicons name="videocam-outline" size={64} color={cameraBlue} />
              <Label className="text-sm mt-4 text-center px-8" style={{ color: muted } as any}>
                {statusText}
              </Label>
            </View>
          )}

          {isConnected && (
            <View className="absolute top-4 left-4 w-3 h-3 rounded-full bg-red-500 shadow-sm" />
          )}
        </View>

        <Card variant="default" className="mb-6 rounded-3xl bg-surface border-0 p-4">
          <Card.Body className="flex-row justify-between items-center p-0">
            <View className="items-center flex-1">
              <View className="flex-row items-center gap-1.5 mb-1">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: isConnected ? '#10B981' : danger }} />
                <Label className="text-xs text-white font-bold">Conexión</Label>
              </View>
              <Label className="text-[10px]" style={{ color: muted } as any}>
                {isConnected ? 'Establecida' : 'Desconectado'}
              </Label>
            </View>
            
            <View className="w-[1px] h-8 bg-white/10" />
            
            <View className="items-center flex-1">
              <Ionicons name="film-outline" size={14} color={isReceivingVideo ? cameraBlue : muted} className="mb-1" />
              <Label className="text-xs text-white font-bold">Video</Label>
              <Label className="text-[10px]" style={{ color: muted } as any}>
                {isReceivingVideo ? 'Recibiendo' : 'En espera'}
              </Label>
            </View>

            <View className="w-[1px] h-8 bg-white/10" />

            <View className="items-center flex-1">
              <Ionicons name="speedometer-outline" size={14} color={muted} className="mb-1" />
              <Label className="text-xs text-white font-bold">Calidad</Label>
              <Label className="text-[10px]" style={{ color: muted } as any}>
                {isReceivingVideo ? 'HD 720p' : '--'}
              </Label>
            </View>
          </Card.Body>
        </Card>

        <View className="gap-3 mb-6">
          <Button variant="primary" feedbackVariant="scale-ripple" onPress={toggleConnection} style={{ backgroundColor: cameraBlue }}>
            <Button.Label className="text-white font-bold">
              {isConnected ? 'Detener conexión' : 'Iniciar conexión'}
            </Button.Label>
          </Button>

          <Button variant="tertiary" onPress={() => navigation.navigate('CameraBroadcaster')}>
            <Button.Label className="text-white">Modo Transmisor</Button.Label>
          </Button>
        </View>

        <Card variant="secondary" className="rounded-2xl border-0 p-4 bg-white/5">
          <Card.Body className="p-0">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="information-circle" size={18} color={muted} />
              <Label className="text-sm font-bold text-white">¿Cómo funciona?</Label>
            </View>
            <Label className="text-xs text-muted leading-5">
              Para ver en vivo, asegúrate de que el teléfono secundario que actúa como el "Juguete" tenga abierta la aplicación en Modo Transmisor y esté conectado a internet.
            </Label>
          </Card.Body>
        </Card>
      </ScrollView>
    </View>
  );
}
