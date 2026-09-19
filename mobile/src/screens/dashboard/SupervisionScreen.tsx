import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, Image, Dimensions, ScrollView, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { Audio } from 'expo-av';
import { API_URL } from '../../config/env';
import { Card, Button, Label, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';
import { useUser } from '../../hooks/useUser';
import { storage } from '../../services/storage';
import { toyService } from '../../services/api';

const { width } = Dimensions.get('window');

export default function SupervisionScreen({ navigation }: any) {
  const { user } = useUser();
  const roomId = user ? `${user.id}_PANDA_01` : 'PANDA_01';
  const familyCode = String(user?.id || 1);

  const [isConnected, setIsConnected] = useState(false);
  const [isReceivingVideo, setIsReceivingVideo] = useState(false);
  const [isToyOnline, setIsToyOnline] = useState(false);
  
  // 🖼️ Doble Buffering de Video (CERO parpadeo en React Native)
  const [bufferA, setBufferA] = useState<string | null>(null);
  const [bufferB, setBufferB] = useState<string | null>(null);
  const [activeBuffer, setActiveBuffer] = useState<'A' | 'B'>('A');
  const activeBufferRef = useRef<'A' | 'B'>('A');
  useEffect(() => {
    activeBufferRef.current = activeBuffer;
  }, [activeBuffer]);

  // ⚙️ Estados de Control Remoto del Juguete
  const [remoteCameraFacing, setRemoteCameraFacing] = useState<'front' | 'back'>('front');
  const [remoteDisplayMode, setRemoteDisplayMode] = useState<'face' | 'stealth'>('stealth');
  const [remoteSensitivity, setRemoteSensitivity] = useState<-52 | -45 | -38>(-45);

  const [statusText, setStatusText] = useState('Esperando transmisión...');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showPairingModal, setShowPairingModal] = useState(false);

  // 🎙️ Intercomunicador Walkie-Talkie
  const [customSpeechText, setCustomSpeechText] = useState('');
  const [isSendingSpeech, setIsSendingSpeech] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [primary, success, danger, muted, surface, background] = useThemeColor([
    'accent', 'success', 'danger', 'muted', 'surface', 'background'
  ]);
  const cameraBlue = '#3B82F6';

  useEffect(() => {
    if (!user) return;
    let newSocket: Socket;
    let offlineTimer: any = null;

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
            if (data.isConnected) {
              if (offlineTimer) clearTimeout(offlineTimer);
              setIsToyOnline(true);
            } else {
              // Filtro anti-rebote para evitar parpadeo si el socket reconecta rápidamente
              if (offlineTimer) clearTimeout(offlineTimer);
              offlineTimer = setTimeout(() => {
                setIsToyOnline(false);
              }, 3500);
            }
          } else {
            setIsToyOnline(true);
          }
        });

        newSocket.on('toy:camera_ready', () => {
          if (offlineTimer) clearTimeout(offlineTimer);
          setIsToyOnline(true);
          newSocket.emit('camera:watch_start', { roomId });
        });

        newSocket.on('camera:receive_frame', (data: { frame: string }) => {
          if (offlineTimer) clearTimeout(offlineTimer);
          if (!data?.frame) return;

          // Swap buffers offscreen to eliminate 100% of screen flickering
          if (activeBufferRef.current === 'A') {
            setBufferB(data.frame);
          } else {
            setBufferA(data.frame);
          }
          setIsReceivingVideo(true);
          setIsToyOnline(true);
          setStatusText('Recibiendo video en vivo');
        });

        newSocket.on('camera:stream_ended', () => {
          setIsReceivingVideo(false);
          setStatusText('Transmisión finalizada');
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

    return () => {
      if (offlineTimer) clearTimeout(offlineTimer);
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
      setBufferA(null);
      setBufferB(null);
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

  // Comandos de configuración remota del teléfono dentro del peluche
  const sendRemoteCommand = (command: string, payload: any) => {
    if (!socket || !isConnected) {
      Alert.alert('Sin conexión', 'Inicia la conexión de supervisión para enviar comandos al juguete.');
      return;
    }
    socket.emit('parent:send_command', {
      toyId: String(user?.id || 1),
      command,
      payload,
    });
  };

  const handleToggleCameraFacing = (nextFacing: 'front' | 'back') => {
    setRemoteCameraFacing(nextFacing);
    sendRemoteCommand('SET_CAMERA_FACING', { facing: nextFacing });
    Alert.alert('📷 Lente Cambiada', `Se cambió la cámara a: ${nextFacing === 'front' ? 'Frontal (Pantalla)' : 'Trasera'}`);
  };

  const handleToggleDisplayMode = (nextMode: 'face' | 'stealth') => {
    setRemoteDisplayMode(nextMode);
    sendRemoteCommand('SET_DISPLAY_MODE', { mode: nextMode });
    Alert.alert(
      '📱 Modo de Pantalla Cambiado',
      nextMode === 'stealth'
        ? 'Pantalla del peluche apagada (ahorro de batería y cero calor).'
        : 'Mostrando cara animada de Panda en la pantalla del peluche.'
    );
  };

  const handleSetSensitivity = (threshold: -52 | -45 | -38) => {
    setRemoteSensitivity(threshold);
    sendRemoteCommand('SET_VAD_SENSITIVITY', { threshold });
    const label = threshold === -52 ? 'Alta (Tela gruesa)' : threshold === -45 ? 'Normal (Recomendado)' : 'Baja (Con ruido)';
    Alert.alert('🎙️ Sensibilidad de Micrófono Calibrada', `Sensibilidad ajustada a: ${label} (${threshold} dB)`);
  };

  const handleSendHug = async () => {
    try {
      if (socket && user) {
        socket.emit('parent:send_command', {
          toyId: String(user.id || 1),
          command: 'HUG',
        });
      }
      Alert.alert('🤗 ¡Abrazo Enviado!', 'Panda está mostrando la animación de abrazo y hablando con tu hijo en vivo.');
    } catch (e) {
      console.warn('Error enviando abrazo en supervisión:', e);
    }
  };

  const sendSpeechToToy = (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;
    if (!socket || !isConnected) {
      Alert.alert('Sin conexión', 'Conecta la supervisión para hablar con Panda.');
      return;
    }

    setIsSendingSpeech(true);
    try {
      socket.emit('parent:send_command', {
        toyId: String(user?.id || 1),
        command: 'SPEAK',
        payload: { text },
      });
      socket.emit('chat:send_message', {
        toyId: String(user?.id || 1),
        text,
        sender: user?.name || 'Padres',
      });
      setCustomSpeechText('');
      Alert.alert('📢 Mensaje Transmitido a Panda', `Panda está diciendo en voz alta:\n\n"${text}"`);
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo enviar el mensaje a Panda');
    } finally {
      setIsSendingSpeech(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso al micrófono para el intercomunicador.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecordingVoice(true);
    } catch (err) {
      console.warn('Error iniciando grabación:', err);
      setIsRecordingVoice(false);
    }
  };

  const stopAndSendVoice = async () => {
    if (!recordingRef.current) return;
    setIsRecordingVoice(false);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (uri) {
        Alert.alert('🎙️ Procesando voz...', 'Transcribiendo y enviando tu voz a Panda...');
        const res = await toyService.voiceChatWithAudio(1, uri);
        if (res.data?.success && res.data?.data) {
          const userSaid = res.data.data.userText;
          if (userSaid && userSaid.trim()) {
            sendSpeechToToy(userSaid);
          } else {
            Alert.alert('Audio no reconocido', 'No se detectó voz con claridad. Prueba de nuevo o escribe un mensaje.');
          }
        }
      }
    } catch (err) {
      console.warn('Error procesando voz walkie-talkie:', err);
    }
  };

  return (
    <View className="flex-1 bg-background pt-12">
      {/* Header */}
      <View className="flex-row items-center px-4 pb-4">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View className="flex-1 ml-3">
          <Label className="text-xl font-extrabold text-foreground">Cámara en Vivo</Label>
          <Label className="text-xs text-muted">Panda Inside • Transmisión Continua</Label>
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
        {/* Visor de Video - Double Buffering para CERO parpadeo */}
        <View 
          className="w-full h-64 rounded-3xl overflow-hidden mb-4 mt-2 relative justify-center items-center shadow-lg" 
          style={{ 
            backgroundColor: '#000000',
            borderWidth: isConnected ? 2 : 1,
            borderColor: isReceivingVideo ? '#EF4444' : isConnected ? cameraBlue : 'rgba(255,255,255,0.1)'
          }}
        >
          {bufferA && (
            <Image
              source={{ uri: bufferA }}
              style={[
                StyleSheet.absoluteFillObject,
                { opacity: activeBuffer === 'A' ? 1 : 0, backgroundColor: '#000000' }
              ]}
              resizeMode="cover"
              fadeDuration={0}
              onLoad={() => setActiveBuffer('A')}
            />
          )}

          {bufferB && (
            <Image
              source={{ uri: bufferB }}
              style={[
                StyleSheet.absoluteFillObject,
                { opacity: activeBuffer === 'B' ? 1 : 0, backgroundColor: '#000000' }
              ]}
              resizeMode="cover"
              fadeDuration={0}
              onLoad={() => setActiveBuffer('B')}
            />
          )}

          {(!bufferA && !bufferB) && (
            <View className="items-center justify-center w-full h-full px-6" style={{ backgroundColor: '#000000' }}>
              <Ionicons name="videocam-outline" size={56} color={cameraBlue} />
              <Label className="text-sm font-semibold text-white mt-3 text-center">
                {statusText}
              </Label>
              <Label className="text-xs mt-1 text-center" style={{ color: muted } as any}>
                {isToyOnline ? 'El juguete está listo. Iniciando transmisión...' : 'Asegúrate de que el teléfono en el peluche tenga abierta la app Panda Juguete.'}
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

          {/* Badge En Vivo */}
          {(bufferA || bufferB) && isReceivingVideo && (
            <View className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600/80 flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-white" />
              <Label className="text-white text-[10px] font-extrabold tracking-wider">EN VIVO</Label>
            </View>
          )}

          {(bufferA || bufferB) && isReceivingVideo && (
            <View className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60">
              <Label className="text-white/80 text-[10px] font-bold">Familia #{familyCode}</Label>
            </View>
          )}

          {/* Overlay suave si hay micro-desconexión sin parpadear en blanco */}
          {(bufferA || bufferB) && !isToyOnline && (
            <View className="absolute inset-0 bg-black/60 items-center justify-center">
              <Ionicons name="cloud-offline-outline" size={32} color="#FBBF24" />
              <Label className="text-xs font-semibold text-amber-300 mt-1">Reconectando señal del juguete...</Label>
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

        {/* 🎙️ INTERCOMUNICADOR / HABLAR POR EL JUGUETE (WALKIE-TALKIE) */}
        <Card variant="default" className="mb-4 rounded-3xl bg-surface border-0 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-purple-500/20 items-center justify-center">
                <Ionicons name="megaphone-outline" size={18} color="#C084FC" />
              </View>
              <View>
                <Label className="text-white font-extrabold text-sm">Hablar por Panda 🐼</Label>
                <Label className="text-[11px] text-gray-400">Panda lo dirá en voz alta con su voz infantil</Label>
              </View>
            </View>
            <View className="bg-purple-500/20 px-2.5 py-0.5 rounded-full">
              <Label className="text-purple-300 text-[10px] font-bold">Intercomunicador</Label>
            </View>
          </View>

          {/* Frases Rápidas de 1 Toque */}
          <Label className="text-xs text-gray-400 font-semibold mb-2">Frases Rápidas:</Label>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {[
              { icon: 'hand-left', text: '¡Hola mi amor! 🐼' },
              { icon: 'cube-outline', text: '¡Hora de guardar los juguetes! 🧸' },
              { icon: 'restaurant-outline', text: '¡A cenar, lávate las manos! 🍽️' },
              { icon: 'bed-outline', text: '¡A dormir, que descanses! 🌙' },
              { icon: 'heart', text: '¡Papis te mandan un beso grande! ❤️' },
            ].map((phrase, idx) => (
              <Pressable
                key={idx}
                onPress={() => sendSpeechToToy(phrase.text)}
                className="bg-white/10 active:bg-purple-600/30 border border-white/10 px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
              >
                <Ionicons name={phrase.icon as any} size={12} color="#C084FC" />
                <Label className="text-white text-xs font-medium">{phrase.text}</Label>
              </Pressable>
            ))}
          </View>

          {/* Campo de texto personalizado */}
          <View className="flex-row items-center gap-2 mt-1">
            <TextInput
              className="flex-1 bg-black/40 text-white text-xs px-3.5 py-2.5 rounded-2xl border border-white/15"
              placeholder="Escribe lo que quieres que Panda diga..."
              placeholderTextColor="#94A3B8"
              value={customSpeechText}
              onChangeText={setCustomSpeechText}
            />
            <Pressable
              onPress={() => sendSpeechToToy(customSpeechText)}
              disabled={isSendingSpeech || !customSpeechText.trim()}
              className={`px-4 py-2.5 rounded-2xl flex-row items-center gap-1 ${
                customSpeechText.trim() ? 'bg-purple-600' : 'bg-white/10 opacity-50'
              }`}
            >
              <Ionicons name="send" size={14} color="white" />
              <Label className="text-white text-xs font-bold">Enviar</Label>
            </Pressable>
          </View>

          {/* Botón Walkie-Talkie por Voz */}
          <Pressable
            onPressIn={startVoiceRecording}
            onPressOut={stopAndSendVoice}
            className={`mt-3 py-2.5 px-4 rounded-2xl border flex-row items-center justify-center gap-2 ${
              isRecordingVoice
                ? 'bg-red-600/80 border-red-400'
                : 'bg-white/5 border-purple-500/30 active:bg-purple-500/20'
            }`}
          >
            <Ionicons
              name={isRecordingVoice ? 'mic' : 'mic-outline'}
              size={18}
              color={isRecordingVoice ? '#FFFFFF' : '#C084FC'}
            />
            <Label className="text-xs font-bold text-white">
              {isRecordingVoice ? '🔴 Grabando tu voz... Suelta para enviar' : '🎙️ Mantén presionado para hablar por Panda'}
            </Label>
          </Pressable>
        </Card>

        {/* ⚙️ PANEL DE CONTROL REMOTO DEL JUGUETE */}
        <Card variant="default" className="mb-4 rounded-3xl bg-surface border-0 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-blue-500/20 items-center justify-center">
                <Ionicons name="settings-outline" size={18} color="#60A5FA" />
              </View>
              <View>
                <Label className="text-white font-extrabold text-sm">Control Remoto del Peluche 🐼</Label>
                <Label className="text-[11px] text-gray-400">Configura el teléfono dentro de Panda sin tocarlo</Label>
              </View>
            </View>
            <View className="bg-blue-500/20 px-2.5 py-0.5 rounded-full">
              <Label className="text-blue-300 text-[10px] font-bold">Remoto</Label>
            </View>
          </View>

          {/* 1. Lente de Cámara */}
          <View className="mb-3">
            <Label className="text-xs text-gray-300 font-semibold mb-1.5">📷 Lente de la Cámara:</Label>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleToggleCameraFacing('front')}
                className={`flex-1 py-2 px-3 rounded-2xl border flex-row items-center justify-center gap-1.5 ${
                  remoteCameraFacing === 'front'
                    ? 'bg-blue-600/30 border-blue-400'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <Ionicons name="camera-reverse" size={14} color={remoteCameraFacing === 'front' ? '#60A5FA' : '#94A3B8'} />
                <Label className={`text-xs font-bold ${remoteCameraFacing === 'front' ? 'text-blue-300' : 'text-gray-400'}`}>
                  Frontal (Pantalla)
                </Label>
              </Pressable>

              <Pressable
                onPress={() => handleToggleCameraFacing('back')}
                className={`flex-1 py-2 px-3 rounded-2xl border flex-row items-center justify-center gap-1.5 ${
                  remoteCameraFacing === 'back'
                    ? 'bg-blue-600/30 border-blue-400'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <Ionicons name="camera" size={14} color={remoteCameraFacing === 'back' ? '#60A5FA' : '#94A3B8'} />
                <Label className={`text-xs font-bold ${remoteCameraFacing === 'back' ? 'text-blue-300' : 'text-gray-400'}`}>
                  Trasera
                </Label>
              </Pressable>
            </View>
          </View>

          {/* 2. Modo de Pantalla del Juguete */}
          <View className="mb-3">
            <Label className="text-xs text-gray-300 font-semibold mb-1.5">📱 Pantalla del Teléfono Secundario:</Label>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleToggleDisplayMode('stealth')}
                className={`flex-1 py-2 px-3 rounded-2xl border flex-row items-center justify-center gap-1.5 ${
                  remoteDisplayMode === 'stealth'
                    ? 'bg-emerald-600/30 border-emerald-400'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <Ionicons name="moon" size={14} color={remoteDisplayMode === 'stealth' ? '#34D399' : '#94A3B8'} />
                <Label className={`text-xs font-bold ${remoteDisplayMode === 'stealth' ? 'text-emerald-300' : 'text-gray-400'}`}>
                  Apagada (Sigilo / Fría)
                </Label>
              </Pressable>

              <Pressable
                onPress={() => handleToggleDisplayMode('face')}
                className={`flex-1 py-2 px-3 rounded-2xl border flex-row items-center justify-center gap-1.5 ${
                  remoteDisplayMode === 'face'
                    ? 'bg-amber-600/30 border-amber-400'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <Ionicons name="happy" size={14} color={remoteDisplayMode === 'face' ? '#FBBF24' : '#94A3B8'} />
                <Label className={`text-xs font-bold ${remoteDisplayMode === 'face' ? 'text-amber-300' : 'text-gray-400'}`}>
                  Cara Animada
                </Label>
              </Pressable>
            </View>
          </View>

          {/* 3. Sensibilidad del Micrófono (VAD para tela de peluche) */}
          <View>
            <Label className="text-xs text-gray-300 font-semibold mb-1.5">🎙️ Sensibilidad de Detección de Voz (VAD):</Label>
            <View className="flex-row gap-2">
              {[
                { label: 'Alta (Tela gruesa)', threshold: -52 as const },
                { label: 'Normal (Recomendado)', threshold: -45 as const },
                { label: 'Baja (Con ruido)', threshold: -38 as const },
              ].map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleSetSensitivity(item.threshold)}
                  className={`flex-1 py-2 px-1 rounded-2xl border items-center justify-center ${
                    remoteSensitivity === item.threshold
                      ? 'bg-purple-600/30 border-purple-400'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Label className={`text-[11px] font-bold text-center ${
                    remoteSensitivity === item.threshold ? 'text-purple-300' : 'text-gray-400'
                  }`}>
                    {item.label}
                  </Label>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>

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
