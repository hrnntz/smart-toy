import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Alert,
  Pressable,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/env';
import io, { Socket } from 'socket.io-client';
import { Label, Button, useThemeColor } from 'heroui-native';

export default function CameraBroadcasterScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [roomId] = useState('PANDA_01');
  const cameraRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<any>(null);

  const [primary, background, foreground, muted, danger, success] = useThemeColor([
    'accent',
    'background',
    'foreground',
    'muted',
    'danger',
    'success'
  ]);

  useEffect(() => {
    // Conectar a la Nube Socket.io
    const socketServerUrl = API_URL.replace(/\/api\/?$/, '');
    const socket = io(socketServerUrl, { transports: ['websocket'] });

    socket.on('connect', () => {
      console.log('📹 Transmisor de cámara conectado a Socket.io:', socket.id);
      socket.emit('camera:join_stream', roomId);
    });

    socketRef.current = socket;

    return () => {
      stopStreaming();
      socket.disconnect();
    };
  }, []);

  const startStreaming = () => {
    setIsBroadcasting(true);
    // Enviar capturas periódicas cada 300ms a través del servidor en la nube
    intervalRef.current = setInterval(async () => {
      try {
        if (cameraRef.current && socketRef.current) {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.3,
            base64: true,
            skipProcessing: true,
          });
          if (photo && photo.base64) {
            socketRef.current.emit('camera:stream_frame', {
              roomId,
              frame: `data:image/jpeg;base64,${photo.base64}`,
              timestamp: Date.now(),
            });
          }
        }
      } catch (err) {
        // Ignorar errores menores de captura continua
      }
    }, 350);
  };

  const stopStreaming = () => {
    setIsBroadcasting(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.emit('camera:stop_stream', roomId);
    }
  };

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Ionicons name="camera-outline" size={64} color={primary} />
        <Label className="text-xl font-bold text-foreground mt-4 text-center">Permiso de Cámara Requerido</Label>
        <Label className="text-sm text-muted text-center mt-2 mb-6">
          Esta pantalla convierte este teléfono en la cámara en vivo del juguete para supervisión.
        </Label>
        <Button variant="primary" onPress={requestPermission}>
          <Button.Label>Conceder Permisos</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView className="flex-1 justify-between" facing={facing} ref={cameraRef}>
        {/* Header Superior */}
        <View className="flex-row items-center justify-between px-5 pt-12">
          <Pressable onPress={() => navigation.goBack()} className="p-2 bg-black/50 rounded-full">
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
          <View className="flex-row items-center bg-black/60 px-3.5 py-2 rounded-full gap-2">
            <View className={`w-2.5 h-2.5 rounded-full ${isBroadcasting ? 'bg-danger' : 'bg-[#94A3B8]'}`} />
            <Label className="text-white text-xs font-bold">
              {isBroadcasting ? 'TRANSMITIENDO EN VIVO' : 'MODO CÁMARA JUGUETE'}
            </Label>
          </View>
          <Pressable
            className="p-2 bg-black/50 rounded-full"
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
          >
            <Ionicons name="camera-reverse-outline" size={26} color="white" />
          </Pressable>
        </View>

        {/* Panel Inferior de Emisión */}
        <View className="bg-black/75 p-6 items-center rounded-t-3xl">
          <Label className="text-[#CBD5E1] text-sm font-semibold mb-3">Código de Sala: {roomId}</Label>
          <Pressable
            className={`flex-row items-center px-6 py-3.5 rounded-full gap-2 ${isBroadcasting ? 'bg-danger' : 'bg-success'}`}
            onPress={isBroadcasting ? stopStreaming : startStreaming}
          >
            <Ionicons name={isBroadcasting ? 'stop' : 'radio-outline'} size={24} color="white" />
            <Label className="text-white text-base font-bold">
              {isBroadcasting ? 'Detener Transmisión' : 'Iniciar Transmisión Nube'}
            </Label>
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}
