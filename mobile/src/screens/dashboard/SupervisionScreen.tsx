import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Modal,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/env';
import io, { Socket } from 'socket.io-client';
import { Card, Label, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

export default function SupervisionScreen({ navigation, route }: any) {
  const [roomId, setRoomId] = useState('PANDA_01');
  const [isConnected, setIsConnected] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [primary, success, danger, muted, surface, card, background, text] = useThemeColor([
    'accent',
    'success',
    'danger',
    'muted',
    'surface',
    'surface',
    'background',
    'foreground'
  ]);

  useEffect(() => {
    const socketServerUrl = API_URL.replace(/\/api\/?$/, '');
    const newSocket = io(socketServerUrl, { transports: ['websocket'] });

    newSocket.on('connect', () => {
      newSocket.emit('camera:join_stream', roomId);
      setIsConnected(true);
    });

    newSocket.on('camera:receive_frame', (data: { frame: string }) => {
      setCurrentFrame(data.frame);
    });

    newSocket.on('camera:stream_ended', () => {
      setCurrentFrame(null);
      Alert.alert('Transmisión finalizada', 'La cámara del juguete se ha desconectado.');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  return (
    <View className="flex-1 bg-background pt-12">
      {/* Header del Padre */}
      <View className="flex-row items-center px-4 pb-4">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View className="flex-1 ml-2">
          <Label className="text-xl font-extrabold text-foreground">Supervisión en Vivo</Label>
          <Label className="text-[13px] text-muted">Panda Inteligente • Remoto Nube</Label>
        </View>
        <IconButton
          icon="camera-reverse"
          variant="solid"
          color={primary}
          onPress={() => navigation.navigate('CameraBroadcaster')}
        />
      </View>

      {/* Pantalla de Streaming */}
      <View
        className={`flex-1 mx-4 rounded-3xl overflow-hidden justify-center items-center ${
          nightMode ? 'border-2' : ''
        }`}
        style={{
          backgroundColor: '#1E293B',
          borderColor: nightMode ? success : 'transparent',
        }}
      >
        {currentFrame ? (
          <Image source={{ uri: currentFrame }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="p-6 items-center">
            <Spinner size="lg" color="primary" />
            <Label className="text-white text-base font-bold mt-4 text-center">Conectando a la cámara de Panda...</Label>
            <Label className="text-[#94A3B8] text-[13px] text-center mt-2">
              Asegúrate de que el teléfono secundario tenga abierto el "Modo Cámara Juguete".
            </Label>
          </View>
        )}

        {/* Badge EN VIVO */}
        <View className="absolute top-4 left-4 flex-row items-center bg-black/65 px-3 py-1.5 rounded-full gap-1.5">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: danger }} />
          <Label className="text-white text-xs font-bold">EN VIVO (NUBE)</Label>
        </View>
      </View>

      {/* Panel de Controles para el Padre */}
      <Card variant="default" className="rounded-t-[32px] rounded-b-none p-5 mt-4 border-0">
        <Card.Body className="p-0">
          <Label className="text-base font-extrabold text-foreground mb-4">Controles de Monitoreo</Label>

          <View className="flex-row justify-between gap-3">
            <Pressable
              className="flex-1 py-4 rounded-[20px] items-center gap-1.5"
              style={{ backgroundColor: audioEnabled ? primary : surface }}
              onPress={() => setAudioEnabled(!audioEnabled)}
            >
              <Ionicons name={audioEnabled ? 'volume-high' : 'volume-mute'} size={24} color={audioEnabled ? '#FFFFFF' : text} />
              <Label className={`text-xs font-bold ${audioEnabled ? 'text-white' : 'text-foreground'}`}>Escuchar</Label>
            </Pressable>

            <Pressable
              className="flex-1 py-4 rounded-[20px] items-center gap-1.5"
              style={{ backgroundColor: nightMode ? primary : surface }}
              onPress={() => setNightMode(!nightMode)}
            >
              <Ionicons name={nightMode ? 'moon' : 'moon-outline'} size={24} color={nightMode ? '#FFFFFF' : text} />
              <Label className={`text-xs font-bold ${nightMode ? 'text-white' : 'text-foreground'}`}>Nocturna</Label>
            </Pressable>

            <Pressable
              className="flex-1 py-4 rounded-[20px] items-center gap-1.5"
              style={{ backgroundColor: surface }}
              onPress={() => Alert.alert('Captura', 'Captura de pantalla guardada en la galería.')}
            >
              <Ionicons name="camera" size={24} color={text} />
              <Label className="text-xs font-bold text-foreground">Capturar</Label>
            </Pressable>
          </View>
        </Card.Body>
      </Card>
    </View>
  );
}
