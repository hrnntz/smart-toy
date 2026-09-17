import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Pressable,
  Animated,
  Dimensions,
  Alert,
  StatusBar,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../../config/env';
import { storage } from '../../services/storage';
import { useUser } from '../../hooks/useUser';
import { toyService, authService } from '../../services/api';
import { playAudio, stopAudio } from '../../services/audioService';
import { pandaBluetooth } from '../../services/pandaBluetooth';
import { Button, Label, Chip, Spinner, useThemeColor } from 'heroui-native';

const { width, height } = Dimensions.get('window');

type DeviceDisplayMode = 'stealth' | 'face' | 'camera';
type PandaExpression = 'idle' | 'listening' | 'thinking' | 'speaking' | 'hugging' | 'sleeping';

// Umbrales de detección de voz por decibelios (VAD calibrado para tela de peluche)
const VOICE_THRESHOLD_DB = -45; // Captar la voz natural del niño a través del peluche
const SILENCE_TIMEOUT_MS = 1000; // 1.0s de silencio tras hablar indica fin de frase
const MAX_RECORDING_DURATION_MS = 8000; // Máximo 8 segundos por mensaje
const BUFFER_RESET_MS = 2500; // Si nadie habla en 2.5s, reiniciar buffer para no acumular silencios previos

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};

export default function PandaDeviceScreen({ navigation, route }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const { user: initialUser } = useUser();
  const [user, setUser] = useState<any>(initialUser);
  const [familyId, setFamilyId] = useState<string>(route.params?.familyId || '1');
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [newFamilyCodeInput, setNewFamilyCodeInput] = useState('1');

  const [toyId, setToyId] = useState<number>(route.params?.toyId || 1);
  const [toyName, setToyName] = useState<string>(route.params?.toyName || 'Panda');
  const [serialNumber, setSerialNumber] = useState<string>(route.params?.serialNumber || 'TOY-001');

  // MODO PREDETERMINADO: 'face' para interactuar y configurar en pantalla
  const [displayMode, setDisplayMode] = useState<DeviceDisplayMode>('face');
  const [facing, setFacing] = useState<'front' | 'back'>('front'); // Cámara frontal predeterminada para el orificio
  const [isBroadcasting, setIsBroadcasting] = useState(true);
  const isBroadcastingRef = useRef<boolean>(true);
  useEffect(() => {
    isBroadcastingRef.current = isBroadcasting;
  }, [isBroadcasting]);

  const [isParentWatching, setIsParentWatching] = useState(false);
  const isParentWatchingRef = useRef<boolean>(false);
  const isCapturingFrameRef = useRef<boolean>(false);
  const captureLoopTimerRef = useRef<any>(null);
  const captureFrameStepRef = useRef<() => void>(() => {});
  const [isBtConnected, setIsBtConnected] = useState(false);

  // Estado y expresión
  const [expression, setExpression] = useState<PandaExpression>('idle');
  const [dialogueText, setDialogueText] = useState<string>('¡Hola! Soy Panda 🐼 Tócame o háblame');
  const [audioLevel, setAudioLevel] = useState<number>(-160);
  const lastAudioLevelRef = useRef<number>(-160);
  const lastAudioUpdateTimestampRef = useRef<number>(0);

  // Control de escucha (Manos libres vs Tocar para Hablar)
  const [isHandsFreeActive, setIsHandsFreeActive] = useState<boolean>(false);
  const isHandsFreeActiveRef = useRef<boolean>(false);
  const [isPushToTalkRecording, setIsPushToTalkRecording] = useState<boolean>(false);
  const lastScreenTouchTimestampRef = useRef<number>(0);
  const voiceStartTimestampRef = useRef<number>(0);
  const [showStealthWakeMenu, setShowStealthWakeMenu] = useState<boolean>(false);
  const stealthWakeTimerRef = useRef<any>(null);

  const isSpeakingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // VAD refs
  const voiceDetectedRef = useRef<boolean>(false);
  const lastVoiceTimestampRef = useRef<number>(0);
  const recordingStartTimestampRef = useRef<number>(0);

  // Bloqueo parental
  const [isLocked, setIsLocked] = useState(true);
  const [unlockProgress] = useState(new Animated.Value(0));
  const unlockTimerRef = useRef<any>(null);

  // Animaciones de cara
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const mouthAnim = useRef(new Animated.Value(0.1)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const hugHeartAnim = useRef(new Animated.Value(0)).current;
  const pulseListenAnim = useRef(new Animated.Value(1)).current;

  // Sockets & Cámara
  const cameraRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const telemetryIntervalRef = useRef<any>(null);

  // Telemetría
  const [batteryLevel, setBatteryLevel] = useState(100);
  const batteryLevelRef = useRef<number>(100);
  useEffect(() => {
    batteryLevelRef.current = batteryLevel;
  }, [batteryLevel]);

  const [hugCount, setHugCount] = useState(0);
  const hugCountRef = useRef<number>(0);
  useEffect(() => {
    hugCountRef.current = hugCount;
  }, [hugCount]);

  const [accent] = useThemeColor(['accent']);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const effectiveFamilyId = familyId || (user?.id ? String(user.id) : '1');
  const roomId = `${effectiveFamilyId}_PANDA_01`;

  // 🚀 OPTIMIZACIÓN DE RESOLUCIÓN DE CÁMARA (ELIMINA LAG DEL SENSOR DE 12-48MP)
  const [cameraPictureSize, setCameraPictureSize] = useState<string>('640x480');

  const handleCameraReady = async () => {
    try {
      if (cameraRef.current?.getAvailablePictureSizesAsync) {
        const sizes: string[] = await cameraRef.current.getAvailablePictureSizesAsync();
        console.log('📷 Tamaños de captura soportados por el hardware:', sizes);
        // Priorizar resoluciones ligeras de streaming: 640x480, 480x360, 352x288
        const preferred = ['640x480', '480x360', '800x600', '352x288', '320x240'];
        const match = preferred.find((p) => sizes.includes(p));
        if (match) {
          setCameraPictureSize(match);
        } else if (sizes.length > 0) {
          const sorted = [...sizes].sort((a, b) => {
            const [wA, hA] = a.split('x').map(Number);
            const [wB, hB] = b.split('x').map(Number);
            return (wA * hA) - (wB * hB);
          });
          const target = sorted.find((s) => {
            const [w, h] = s.split('x').map(Number);
            return w * h >= 300 * 200 && w * h <= 800 * 600;
          }) || sorted[0];
          setCameraPictureSize(target);
        }
      }
    } catch (e) {
      console.warn('Error obteniendo tamaños de cámara:', e);
    }
  };

  const toggleCameraFacing = async () => {
    const nextFacing = facing === 'front' ? 'back' : 'front';
    setFacing(nextFacing);
    await storage.setItem('toy_camera_facing', nextFacing);
  };

  const sendTestSnapshot = async () => {
    if (!cameraRef.current) {
      Alert.alert('Cámara no lista', 'Espera un momento a que la cámara termine de inicializar.');
      return;
    }
    if (!socketRef.current?.connected) {
      Alert.alert('Sin conexión', 'Conectando con el servidor... Revisa tu conexión Wi-Fi o datos.');
      return;
    }
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.2,
        base64: true,
        shutterSound: false,
      });
      if (photo?.base64) {
        socketRef.current.emit('camera:stream_frame', {
          roomId,
          frame: `data:image/jpeg;base64,${photo.base64}`,
          timestamp: Date.now(),
        });
        Alert.alert('¡Foto Enviada! 📸', `Fotograma transmitido a la app de Padres (Familia #${effectiveFamilyId}).`);
      }
    } catch (err: any) {
      Alert.alert('Error al capturar', err?.message || 'No se pudo tomar la foto de prueba');
    }
  };

  // Captura asíncrona fluida a 640x480 (0.3MP en ~25ms en vez de 12MP en 600ms)
  const captureFrameStep = useCallback(async () => {
    if (!isParentWatchingRef.current || !isBroadcastingRef.current || isCapturingFrameRef.current) return;
    if (!cameraRef.current || !socketRef.current?.connected) return;

    isCapturingFrameRef.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.18,
        base64: true,
        shutterSound: false,
      });

      if (photo?.base64 && socketRef.current?.connected && isParentWatchingRef.current) {
        socketRef.current.emit('camera:stream_frame', {
          roomId,
          frame: `data:image/jpeg;base64,${photo.base64}`,
          timestamp: Date.now(),
        });
      }
    } catch (_) {
      // Ignorar errores transitorios de fotograma para no congelar la app
    } finally {
      isCapturingFrameRef.current = false;
      if (isParentWatchingRef.current && isBroadcastingRef.current) {
        if (captureLoopTimerRef.current) clearTimeout(captureLoopTimerRef.current);
        captureLoopTimerRef.current = setTimeout(() => {
          captureFrameStepRef.current();
        }, 320);
      }
    }
  }, [roomId]);

  useEffect(() => {
    captureFrameStepRef.current = captureFrameStep;
  }, [captureFrameStep]);

  // 1. Inicializar credenciales y rol
  useEffect(() => {
    const initDevice = async () => {
      try {
        const token = await storage.getItem('token');
        const savedUserStr = await storage.getItem('user');
        const savedFamId = await storage.getItem('toy_family_id');
        const savedFacing = await storage.getItem('toy_camera_facing');

        if (savedFacing === 'front' || savedFacing === 'back') {
          setFacing(savedFacing);
        }

        const flavor = pandaBluetooth.getAppFlavor();
        if (flavor === 'toy') {
          await storage.setItem('device_role', 'toy_device');
        } else {
          await storage.removeItem('device_role');
        }

        if (savedFamId) {
          setFamilyId(savedFamId);
          setNewFamilyCodeInput(savedFamId);
          // Si ya tiene código familiar configurado y es la APK de juguete, arrancar directamente en Modo Peluche con manos libres
          if (flavor === 'toy') {
            setDisplayMode('stealth');
            setIsHandsFreeActive(true);
            isHandsFreeActiveRef.current = true;
          }
        } else if (savedUserStr) {
          const u = JSON.parse(savedUserStr);
          setUser(u);
          setFamilyId(String(u.id));
          setNewFamilyCodeInput(String(u.id));
        } else if (token) {
          try {
            const res = await authService.getProfile();
            const profile = res?.data?.data || res?.data;
            if (profile && profile.id) {
              setUser(profile);
              setFamilyId(String(profile.id));
              setNewFamilyCodeInput(String(profile.id));
              await storage.setItem('user', JSON.stringify(profile));
            }
          } catch (_) {}
        } else {
          const defaultId = route.params?.familyId || '1';
          setFamilyId(String(defaultId));
          setNewFamilyCodeInput(String(defaultId));
          // Primer inicio: mostrar modal para que el usuario vincule con el código de padres
          setShowFamilyModal(true);
        }

        try {
          const res = await toyService.getAll();
          if (res.data.success && res.data.data.length > 0) {
            const t = res.data.data[0];
            setToyId(t.id);
            setToyName(t.name || 'Panda');
            setSerialNumber(t.serialNumber || 'TOY-001');
            setHugCount(t.hugCount || 0);
          }
        } catch (_) {}
      } catch (err) {
        console.error('Error inicializando dispositivo Panda:', err);
      }
    };
    initDevice();
  }, []);

  // 2. Conectar WebSockets para comandos parentales y streaming bajo demanda
  useEffect(() => {
    let socket: Socket | null = null;

    const connectSocket = async () => {
      try {
        const token = await storage.getItem('token');
        const socketServerUrl = API_URL.replace(/\/api\/?$/, '');

        socket = io(socketServerUrl, {
          transports: ['websocket'],
          auth: {
            token: token || undefined,
            role: 'toy',
            familyId: effectiveFamilyId,
          },
        });

        socket.on('connect', () => {
          setIsSocketConnected(true);
          console.log(`🐼 Teléfono Secundario (Juguete) conectado a Socket.io (Familia #${effectiveFamilyId}):`, socket?.id);
          socket?.emit('join:toy', String(toyId));
          socket?.emit('join:toy', String(effectiveFamilyId));
          socket?.emit('camera:join_stream', roomId);
          socket?.emit('toy:status_update', {
            toyId: String(toyId),
            status: 'ONLINE',
            battery: batteryLevelRef.current,
            isHugging: false,
            hugCount: hugCountRef.current,
          });
        });

        socket.on('disconnect', () => {
          setIsSocketConnected(false);
        });

        // 👁️ Escuchar cuando el padre abre o cierra la vista de supervisión
        socket.on('camera:viewer_active', (data: { active: boolean }) => {
          const active = !!data?.active;
          console.log('👀 Señal de espectador en vivo recibida:', active);
          setIsParentWatching(active);
          isParentWatchingRef.current = active;
          if (active) {
            if (captureLoopTimerRef.current) clearTimeout(captureLoopTimerRef.current);
            captureFrameStepRef.current();
          } else {
            if (captureLoopTimerRef.current) clearTimeout(captureLoopTimerRef.current);
          }
        });

        // Comandos recibidos desde la app de los padres
        socket.on('toy:command', (data: { action: string; payload?: any }) => {
          console.log('📥 Comando del padre recibido por altavoz:', data);
          handleParentRemoteCommand(data.action, data.payload);
        });

        socket.on('chat:receive_message', (message: { text: string; sender: string }) => {
          if (message && message.text) {
            speakParentMessage(message.text);
          }
        });

        socketRef.current = socket;
      } catch (err) {
        console.error('Error conectando socket Panda Device:', err);
      }
    };

    connectSocket();

    return () => {
      if (captureLoopTimerRef.current) clearTimeout(captureLoopTimerRef.current);
      if (socket) socket.disconnect();
    };
  }, [toyId, roomId, effectiveFamilyId]);

  // 3. Heartbeat de telemetría (cada 30s)
  useEffect(() => {
    const reportHeartbeat = async () => {
      try {
        if (socketRef.current?.connected) {
          socketRef.current.emit('toy:status_update', {
            toyId: String(toyId),
            status: expression === 'hugging' ? 'TOCADO' : 'LIBRE',
            battery: batteryLevel,
            isHugging: expression === 'hugging',
            hugCount,
          });
        }
      } catch (_) {}
    };

    reportHeartbeat();
    telemetryIntervalRef.current = setInterval(reportHeartbeat, 30000);

    return () => {
      if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);
    };
  }, [toyId, batteryLevel, expression, hugCount]);

  // 5. Animaciones faciales
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (expression !== 'sleeping') {
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.05, duration: 90, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();
      }
    }, 4000);

    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.03, duration: 1800, useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1.0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(blinkInterval);
  }, [expression]);

  // ══════════════════════════════════════════════════════════════════════
  // 6. CONTROL DE VOZ: MANOS LIBRES VAD & TOCAR PARA HABLAR
  // ══════════════════════════════════════════════════════════════════════
  const startHandsFreeRecording = async () => {
    if (!isHandsFreeActiveRef.current || isSpeakingRef.current || isProcessingRef.current) {
      return;
    }

    try {
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (_) {}
        recordingRef.current = null;
      }

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        RECORDING_OPTIONS,
        onRecordingStatusUpdate,
        150
      );

      recordingRef.current = recording;
      voiceDetectedRef.current = false;
      lastVoiceTimestampRef.current = 0;
      voiceStartTimestampRef.current = 0;
      recordingStartTimestampRef.current = Date.now();
      setExpression('listening');
      setDialogueText('Panda escuchando con atención... 🎙️');
    } catch (err) {
      console.warn('Reintentando inicio de escucha manos libres:', err);
      setTimeout(() => {
        if (!isSpeakingRef.current && !isProcessingRef.current && isHandsFreeActiveRef.current) {
          startHandsFreeRecording();
        }
      }, 1500);
    }
  };

  const stopHandsFreeRecording = async () => {
    isHandsFreeActiveRef.current = false;
    setIsHandsFreeActive(false);
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (_) {}
      recordingRef.current = null;
    }
    setExpression('idle');
    setDialogueText('Panda listo y en reposo 🐼✨');
  };

  // Callback de estado del micrófono en tiempo real (análisis de decibelios)
  const onRecordingStatusUpdate = (status: Audio.RecordingStatus) => {
    if (!status.isRecording || isSpeakingRef.current || isProcessingRef.current) return;

    const metering = status.metering ?? -160;
    const now = Date.now();

    // 🛡️ Inmunidad contra toques en pantalla: ignorar cualquier sonido dentro de los 900ms posteriores a un toque
    if (now - lastScreenTouchTimestampRef.current < 900) {
      return;
    }

    if (now - lastAudioUpdateTimestampRef.current > 600 || Math.abs(metering - lastAudioLevelRef.current) > 10) {
      lastAudioLevelRef.current = metering;
      lastAudioUpdateTimestampRef.current = now;
      setAudioLevel(metering);
    }

    const duration = status.durationMillis || 0;

    // Detectar si hay voz continua
    if (metering > VOICE_THRESHOLD_DB) {
      if (!voiceDetectedRef.current) {
        voiceDetectedRef.current = true;
        voiceStartTimestampRef.current = now;
      }
      lastVoiceTimestampRef.current = now;
      setExpression('listening');
      setDialogueText('¡Te escucho, amiguito! 🐼');
    }

    // Comprobar fin de frase tras silencio
    if (voiceDetectedRef.current) {
      const silenceDuration = now - lastVoiceTimestampRef.current;
      const speechDuration = lastVoiceTimestampRef.current - voiceStartTimestampRef.current;

      // Si fue un ruido seco < 400ms (un golpe, clic de pantalla o roce), descartar limpiamente
      if (silenceDuration >= SILENCE_TIMEOUT_MS) {
        if (speechDuration < 400) {
          restartBuffer();
          return;
        }
        stopAndProcessSpeech();
        return;
      }
    }

    // Límite máximo de grabación alcanzado
    if (duration >= MAX_RECORDING_DURATION_MS) {
      const speechDuration = lastVoiceTimestampRef.current - voiceStartTimestampRef.current;
      if (voiceDetectedRef.current && speechDuration >= 400) {
        stopAndProcessSpeech();
      } else {
        restartBuffer();
      }
      return;
    }

    // Silencio prolongado mientras espera (nadie habló en 2.5s): reiniciar buffer limpiamente
    if (!voiceDetectedRef.current && duration >= BUFFER_RESET_MS) {
      restartBuffer();
    }
  };

  // Reiniciar buffer silencioso sin llamar a la IA
  const restartBuffer = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch (_) {}
    if (!isSpeakingRef.current && !isProcessingRef.current && isHandsFreeActiveRef.current) {
      startHandsFreeRecording();
    }
  };

  // Detener grabación y enviar a la IA (Whisper -> Groq -> ElevenLabs)
  const stopAndProcessSpeech = async () => {
    if (isProcessingRef.current || isSpeakingRef.current) return;
    isProcessingRef.current = true;

    try {
      setExpression('thinking');
      setDialogueText('Panda pensando respuesta... 🤔✨');

      let uri: string | null = null;
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        uri = recordingRef.current.getURI();
        recordingRef.current = null;
      }

      if (!uri) {
        isProcessingRef.current = false;
        if (isHandsFreeActiveRef.current) startHandsFreeRecording();
        return;
      }

      console.log('📡 Enviando audio a Groq Whisper STT...');
      const response = await toyService.voiceChatWithAudio(toyId, uri);

      if (response.data?.success && response.data?.data) {
        const { userText, replyText, audioUrl } = response.data.data;

        if (!userText || userText.trim().length === 0 || userText === '.') {
          if (audioUrl) {
            setDialogueText('No te alcancé a escuchar bien... 🐼👂');
            await playPandaVoiceAloud(audioUrl);
          } else {
            isProcessingRef.current = false;
            setDialogueText('No te escuché bien, ¿me dices de nuevo? 🐼');
            setExpression('idle');
            if (isHandsFreeActiveRef.current) {
              setTimeout(() => startHandsFreeRecording(), 1800);
            }
          }
          return;
        }

        console.log(`🧒 Niño dijo: "${userText}"`);
        console.log(`🐼 Panda responde: "${replyText}"`);
        setDialogueText(`🧒 "${userText}"\n🐼 "${replyText}"`);

        if (audioUrl) {
          await playPandaVoiceAloud(audioUrl);
        } else {
          setTimeout(() => {
            isProcessingRef.current = false;
            setExpression('idle');
            if (isHandsFreeActiveRef.current) startHandsFreeRecording();
          }, 3000);
        }
      } else {
        isProcessingRef.current = false;
        setExpression('idle');
        if (isHandsFreeActiveRef.current) startHandsFreeRecording();
      }
    } catch (err) {
      console.error('Error en procesamiento de voz:', err);
      isProcessingRef.current = false;
      setExpression('idle');
      if (isHandsFreeActiveRef.current) startHandsFreeRecording();
    }
  };

  // Reproducir voz por los altavoces de forma potente y luego reanudar escucha
  const playPandaVoiceAloud = async (audioUrl: string) => {
    isSpeakingRef.current = true;
    isProcessingRef.current = false;
    setExpression('speaking');

    pandaBluetooth.sendCommand('LED:TALK\n').catch(() => {});

    Animated.loop(
      Animated.sequence([
        Animated.timing(mouthAnim, { toValue: 0.8, duration: 180, useNativeDriver: true }),
        Animated.timing(mouthAnim, { toValue: 0.1, duration: 180, useNativeDriver: true }),
      ])
    ).start();

    try {
      await playAudio(audioUrl, (status) => {
        if (status.didJustFinish) {
          isSpeakingRef.current = false;
          mouthAnim.setValue(0.1);
          setExpression('idle');
          setDialogueText('¡Qué divertido! Tócame o háblame cuando quieras 🐼✨');
          pandaBluetooth.sendCommand('LED:NORMAL\n').catch(() => {});
          setTimeout(() => {
            if (!isSpeakingRef.current && isHandsFreeActiveRef.current) {
              startHandsFreeRecording();
            }
          }, 600);
        }
      });
    } catch (e) {
      console.error('Error en altavoz:', e);
      isSpeakingRef.current = false;
      pandaBluetooth.sendCommand('LED:NORMAL\n').catch(() => {});
      if (isHandsFreeActiveRef.current) startHandsFreeRecording();
    }
  };

  // 🎙️ Función Tocar para Hablar (Push to Talk)
  const togglePushToTalk = async () => {
    lastScreenTouchTimestampRef.current = Date.now();
    if (isSpeakingRef.current || isProcessingRef.current) return;

    if (isPushToTalkRecording) {
      setIsPushToTalkRecording(false);
      await stopAndProcessSpeech();
    } else {
      try {
        if (recordingRef.current) {
          try {
            await recordingRef.current.stopAndUnloadAsync();
          } catch (_) {}
          recordingRef.current = null;
        }
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
        });

        const { recording } = await Audio.Recording.createAsync(
          RECORDING_OPTIONS,
          (status) => {
            const metering = status.metering ?? -160;
            const now = Date.now();
            if (now - lastAudioUpdateTimestampRef.current > 400) {
              lastAudioUpdateTimestampRef.current = now;
              setAudioLevel(metering);
            }
          },
          150
        );

        recordingRef.current = recording;
        setIsPushToTalkRecording(true);
        setExpression('listening');
        setDialogueText('Te estoy escuchando... Toca de nuevo para responder 🎙️');
      } catch (e) {
        console.warn('Error al iniciar grabación manual:', e);
        setIsPushToTalkRecording(false);
      }
    }
  };

  const toggleHandsFree = async () => {
    lastScreenTouchTimestampRef.current = Date.now();
    if (isHandsFreeActive) {
      await stopHandsFreeRecording();
    } else {
      setIsHandsFreeActive(true);
      isHandsFreeActiveRef.current = true;
      startHandsFreeRecording();
    }
  };

  const enterPlushMode = async () => {
    lastScreenTouchTimestampRef.current = Date.now();
    setDisplayMode('stealth');
    setIsHandsFreeActive(true);
    isHandsFreeActiveRef.current = true;
    startHandsFreeRecording();
  };

  const handleQuickAction = async (prompt: string, userFacingText: string) => {
    lastScreenTouchTimestampRef.current = Date.now();
    if (isSpeakingRef.current || isProcessingRef.current) return;
    setDialogueText(userFacingText);
    setExpression('thinking');
    try {
      const res = await toyService.voiceChatWithToy(toyId, prompt);
      if (res.data?.data?.audioUrl) {
        if (res.data?.data?.replyText) {
          setDialogueText(res.data.data.replyText);
        }
        await playPandaVoiceAloud(res.data.data.audioUrl);
      } else {
        setExpression('idle');
      }
    } catch (_) {
      setExpression('idle');
    }
  };

  // Iniciar el bucle de escucha manos libres solo cuando esté activado
  useEffect(() => {
    if (isHandsFreeActive && displayMode === 'stealth') {
      isHandsFreeActiveRef.current = true;
      const startTimer = setTimeout(() => {
        startHandsFreeRecording();
      }, 1000);
      return () => clearTimeout(startTimer);
    }
  }, [isHandsFreeActive, displayMode]);

  // ══════════════════════════════════════════════════════════════════════
  // 7. INTERCOMUNICADOR Y COMANDOS PARENTALES REMOTOS
  // ══════════════════════════════════════════════════════════════════════
  const handleParentRemoteCommand = async (action: string, payload?: any) => {
    // Pausar escucha del niño mientras se reproduce el comando de los padres
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch (_) {}

    switch (action) {
      case 'HUG':
        await triggerRemoteHug();
        break;

      case 'SPEAK':
        if (payload?.text) {
          await speakParentMessage(payload.text);
        }
        break;

      case 'PLAY_AUDIO':
        if (payload?.audioUrl) {
          setDialogueText('🎶 Reproduciendo sonido enviado por papá/mamá...');
          await playPandaVoiceAloud(payload.audioUrl);
        }
        break;

      case 'RESET_BATTERY':
        setBatteryLevel(100);
        break;

      default:
        console.log('Comando remoto no manejado:', action);
    }
  };

  // Ejecutar abrazo remoto con corazones y voz de Panda
  const triggerRemoteHug = async () => {
    setExpression('hugging');
    setHugCount((c) => c + 1);
    setDialogueText('¡Mmm, qué abrazo tan lindo me mandaron! 🤗❤️');

    // Notificar al ESP32 para activar ojos de corazón y motor de vibración háptico
    pandaBluetooth.sendCommand('LED:HEART\n').catch(() => {});
    pandaBluetooth.sendCommand('VIB:PULSE\n').catch(() => {});

    Animated.sequence([
      Animated.timing(hugHeartAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(hugHeartAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    try {
      const res = await toyService.voiceChatWithToy(
        toyId,
        '¡Gracias por ese abrazo tan cálido! Te quiero mucho amiguito.'
      );
      if (res.data?.data?.audioUrl) {
        await playPandaVoiceAloud(res.data.data.audioUrl);
      } else {
        setTimeout(() => startHandsFreeRecording(), 3000);
      }
    } catch (_) {
      setTimeout(() => startHandsFreeRecording(), 3000);
    }
  };

  // Panda habla en voz alta lo que escribió el padre
  const speakParentMessage = async (text: string) => {
    try {
      setDialogueText(`Papá/Mamá dice: "${text}"`);
      const res = await toyService.voiceChatWithToy(
        toyId,
        `Dile con cariño al niño lo siguiente que te dicen sus papás: "${text}"`
      );
      if (res.data?.data?.audioUrl) {
        await playPandaVoiceAloud(res.data.data.audioUrl);
      } else {
        setTimeout(() => startHandsFreeRecording(), 3000);
      }
    } catch (_) {
      setTimeout(() => startHandsFreeRecording(), 3000);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // 8. COMUNICACIÓN BLUETOOTH CON ESP32 INTERNO ("Panda_Fisico_BT")
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    let dataSub: any = null;
    let connSub: any = null;

    const connectToEsp32 = async () => {
      try {
        const isConn = await pandaBluetooth.isConnected();
        if (!isConn) {
          console.log('🔵 Conectando con ESP32 (Panda_Fisico_BT)...');
          await pandaBluetooth.connect('Panda_Fisico_BT').catch(() => {});
        }
        const finalConn = await pandaBluetooth.isConnected();
        setIsBtConnected(finalConn);
      } catch (e) {
        setIsBtConnected(false);
      }
    };

    connectToEsp32();

    dataSub = pandaBluetooth.onData((raw: string) => {
      const line = raw.trim();
      console.log('🤖 Sensor ESP32 detectado:', line);

      if (line === 'TOUCH:HEAD') {
        handleTouchHead();
      } else if (line === 'TOUCH:HAND_L') {
        handleTouchHandL();
      } else if (line === 'TOUCH:HAND_R') {
        handleTouchHandR();
      } else if (line === 'TOUCH:CHEST' || line === '1') {
        handleTouchChest();
      }
    });

    connSub = pandaBluetooth.onConnectionChange((connected: boolean) => {
      setIsBtConnected(connected);
    });

    return () => {
      if (dataSub) dataSub.remove();
      if (connSub) connSub.remove();
    };
  }, [toyId]);

  const handleTouchHead = async () => {
    if (isSpeakingRef.current || isProcessingRef.current) return;
    setDialogueText('¡Ji, ji! ¡Qué ricas cosquillitas me haces en la cabeza! 🐼✨');
    pandaBluetooth.sendCommand('LED:HAPPY\n').catch(() => {});
    try {
      const res = await toyService.voiceChatWithToy(
        toyId,
        '¡Ji, ji, ji! ¡El niño te está haciendo cosquillitas y caricias en la cabeza! Ríete alegremente y dile una frase dulce.'
      );
      if (res.data?.data?.audioUrl) {
        await playPandaVoiceAloud(res.data.data.audioUrl);
      }
    } catch (_) {}
  };

  const handleTouchHandL = async () => {
    if (isSpeakingRef.current || isProcessingRef.current) return;
    setDialogueText('¡Choca la patita! ¿Quieres que te cuente un cuento o juguemos adivinanzas? 📖🎮');
    try {
      const res = await toyService.voiceChatWithToy(
        toyId,
        '¡El niño te tocó la mano izquierda! Salúdalo, choca la patita y proponle jugar a las adivinanzas o escuchar un cuento cortito.'
      );
      if (res.data?.data?.audioUrl) {
        await playPandaVoiceAloud(res.data.data.audioUrl);
      }
    } catch (_) {}
  };

  const handleTouchHandR = async () => {
    if (isSpeakingRef.current || isProcessingRef.current) return;
    setDialogueText("¡Hello! Let's learn English together! 🐾");
    try {
      const res = await toyService.voiceChatWithToy(
        toyId,
        '¡El niño tocó tu mano derecha para aprender inglés! Salúdalo en inglés y enséñale una palabra divertida como "Happy" o "Panda" pidiéndole que la repita.'
      );
      if (res.data?.data?.audioUrl) {
        await playPandaVoiceAloud(res.data.data.audioUrl);
      }
    } catch (_) {}
  };

  const handleTouchChest = async () => {
    await triggerRemoteHug();
  };

  // Desbloqueo parental (3s)
  const handleLockPressIn = () => {
    Animated.timing(unlockProgress, { toValue: 1, duration: 2500, useNativeDriver: false }).start();
    unlockTimerRef.current = setTimeout(() => {
      setIsLocked((prev) => !prev);
      Alert.alert(
        isLocked ? '🔓 Menú Desbloqueado' : '🔒 Pantalla Bloqueada',
        isLocked ? 'Opciones de cámara y salida disponibles.' : 'Pantalla asegurada.'
      );
      unlockProgress.setValue(0);
    }, 2500);
  };

  const handleLockPressOut = () => {
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    Animated.timing(unlockProgress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const exitToyMode = async () => {
    const isToy = pandaBluetooth.getAppFlavor() === 'toy';
    if (isToy) {
      Alert.alert('Opciones de Panda 🐼', 'Configuración del teléfono dentro del peluche', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vincular Familia 🔗',
          onPress: () => {
            setNewFamilyCodeInput(effectiveFamilyId);
            setShowFamilyModal(true);
          },
        },
        {
          text: 'Modo Peluche 🌙',
          onPress: enterPlushMode,
        },
      ]);
      return;
    }

    Alert.alert('Salir de Modo Juguete', '¿Deseas volver al Panel de Padres?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          isHandsFreeActiveRef.current = false;
          await storage.removeItem('device_role');
          stopAudio();
          if (captureLoopTimerRef.current) clearTimeout(captureLoopTimerRef.current);
          navigation.replace('Home');
        },
      },
    ]);
  };

  if (!permission) return <View className="flex-1 bg-black" />;
  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-black px-6">
        <Ionicons name="camera-outline" size={64} color="#3B82F6" />
        <Label className="text-xl font-bold text-white mt-4 text-center">Permiso de Cámara Requerido</Label>
        <Label className="text-sm text-gray-400 text-center mt-2 mb-6">
          Panda necesita la cámara para transmitir video en vivo a los padres a través del orificio del peluche.
        </Label>
        <Button variant="primary" onPress={requestPermission}>
          <Button.Label>Conceder Permiso</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar hidden />

      {/* 📹 Cámara nativa: fija en 640x480 (0.3MP) para eliminar 100% el lag del sensor */}
      <View style={StyleSheet.absoluteFillObject}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          ref={cameraRef}
          pictureSize={cameraPictureSize}
          onCameraReady={handleCameraReady}
        />
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 1. MODO SIGILO / PELUCHE (PANTALLA NEGRA / CERO CALOR)            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {displayMode === 'stealth' && (
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000', zIndex: 10 }]}
          className="justify-between items-center py-6 px-4"
          onPress={() => {
            lastScreenTouchTimestampRef.current = Date.now();
            setShowStealthWakeMenu((prev) => !prev);
            if (stealthWakeTimerRef.current) clearTimeout(stealthWakeTimerRef.current);
            stealthWakeTimerRef.current = setTimeout(() => setShowStealthWakeMenu(false), 5000);
          }}
        >
          {/* Barra superior de estado (siempre visible pero tenue) */}
          <View className="flex-row items-center justify-between w-full z-20 pt-2 px-1">
            <View className="flex-row items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
              <View className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <Label className="text-white text-xs font-bold">
                Fam #{effectiveFamilyId}
              </Label>
              <Label className="text-emerald-400 text-[10px] font-bold">● Peluche Activo</Label>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                className="bg-white/15 px-3 py-1.5 rounded-full flex-row items-center gap-1"
                onPress={() => {
                  lastScreenTouchTimestampRef.current = Date.now();
                  setDisplayMode('face');
                }}
              >
                <Ionicons name="happy-outline" size={14} color="#FBBF24" />
                <Label className="text-amber-300 text-xs font-bold">Ver Cara</Label>
              </Pressable>

              <Pressable
                className="bg-white/15 px-3 py-1.5 rounded-full flex-row items-center gap-1"
                onPress={() => {
                  lastScreenTouchTimestampRef.current = Date.now();
                  exitToyMode();
                }}
              >
                <Ionicons name="arrow-back" size={13} color="white" />
                <Label className="text-white text-xs font-bold">Salir</Label>
              </Pressable>
            </View>
          </View>

          {/* Menú flotante temporal que aparece al dar tap en la pantalla negra (sin activar la IA) */}
          {showStealthWakeMenu ? (
            <View className="bg-[#181B26] p-5 rounded-3xl border border-white/20 items-center max-w-xs shadow-2xl">
              <Ionicons name="moon" size={32} color="#60A5FA" />
              <Label className="text-white font-extrabold text-sm mt-2 text-center">
                Panda Dentro del Peluche 🐼
              </Label>
              <Label className="text-gray-400 text-xs text-center mt-1 mb-4 leading-4">
                Pantalla negra para no calentar el muñeco. El micrófono escucha al niño con manos libres y la cámara está lista.
              </Label>

              <View className="flex-row gap-2 w-full">
                <Button
                  variant="primary"
                  className="flex-1 bg-amber-500 py-2.5 rounded-xl"
                  onPress={() => {
                    lastScreenTouchTimestampRef.current = Date.now();
                    setDisplayMode('face');
                  }}
                >
                  <Button.Label className="text-black font-bold text-xs">🎭 Cara Panda</Button.Label>
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 border-blue-400 py-2.5 rounded-xl"
                  onPress={() => {
                    lastScreenTouchTimestampRef.current = Date.now();
                    setDisplayMode('camera');
                  }}
                >
                  <Button.Label className="text-blue-300 font-bold text-xs">📷 Cámara</Button.Label>
                </Button>
              </View>
            </View>
          ) : (
            <View className="items-center opacity-25">
              <Ionicons name="radio-outline" size={54} color="#60A5FA" />
              <Label className="text-gray-400 text-xs mt-3 text-center leading-5">
                Modo Peluche Activo{'\n'}
                (Toca la pantalla para ver el menú sin hablar)
              </Label>
            </View>
          )}

          {/* Barra inferior: VAD, batería y estado del padre */}
          <View className="flex-row items-center justify-between w-full px-4 py-2.5 bg-white/5 rounded-2xl border border-white/5">
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={audioLevel > VOICE_THRESHOLD_DB ? 'mic' : 'mic-outline'}
                size={14}
                color={audioLevel > VOICE_THRESHOLD_DB ? '#10B981' : '#94A3B8'}
              />
              <Label className="text-gray-400 text-xs font-medium">
                {audioLevel > VOICE_THRESHOLD_DB ? '🎙️ Voz activa' : 'Escuchando'} ({audioLevel.toFixed(0)} dB)
              </Label>
            </View>
            <View className="flex-row items-center gap-3">
              <Label className={`text-xs font-semibold ${isParentWatching ? 'text-red-500' : 'text-emerald-400'}`}>
                {isParentWatching ? '🔴 Padres Mirando' : '🟢 Listo'}
              </Label>
              <Label className="text-gray-400 text-xs font-bold">🔋 {batteryLevel}%</Label>
            </View>
          </View>
        </Pressable>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. MODO CALIBRACIÓN DE CÁMARA (ENFOCAR EL ORIFICIO DEL PELUCHE)  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {displayMode === 'camera' && (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'transparent', zIndex: 10 }]}
          className="justify-between p-5 pt-8"
        >
          {/* Barra superior de configuración de cámara */}
          <View className="flex-row items-center justify-between">
            <View className="bg-black/75 px-3.5 py-1.5 rounded-full flex-row items-center gap-2 border border-white/20">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <Label className="text-white text-xs font-bold">
                {facing === 'front' ? 'Cámara Delantera' : 'Cámara Trasera'}
              </Label>
            </View>

            <Pressable
              className="bg-black/75 px-3.5 py-2 rounded-full flex-row items-center gap-1.5 border border-white/20"
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse-outline" size={18} color="#60A5FA" />
              <Label className="text-blue-300 text-xs font-bold">
                Cambiar a {facing === 'front' ? 'Trasera' : 'Delantera'}
              </Label>
            </Pressable>
          </View>

          {/* Mira de alineación para el agujero del peluche */}
          <View className="items-center justify-center">
            <View className="w-64 h-64 border-4 border-emerald-400 border-dashed rounded-full items-center justify-center bg-black/25">
              <View className="w-16 h-16 border-2 border-emerald-300 rounded-full items-center justify-center bg-emerald-500/20">
                <View className="w-3 h-3 rounded-full bg-emerald-400" />
              </View>
              <Label className="text-white font-extrabold text-xs text-center px-6 mt-4 shadow-lg">
                Centra aquí el orificio del ojo o nariz del peluche
              </Label>
              <Label className="text-emerald-300 text-[11px] text-center font-semibold mt-1">
                Lente activa: {facing === 'front' ? 'Frontal (Pantalla)' : 'Trasera'}
              </Label>
            </View>
          </View>

          {/* Botones de acción inferior */}
          <View className="gap-2.5">
            <Button
              variant="outline"
              className="w-full rounded-2xl py-3 bg-black/75 border-blue-500/50"
              onPress={sendTestSnapshot}
            >
              <Button.Label className="text-blue-300 font-bold">
                ⚡ Enviar Foto de Prueba a Padres (Sala #{effectiveFamilyId})
              </Button.Label>
            </Button>

            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl py-3 bg-white/10 border-white/20"
                onPress={() => setDisplayMode('face')}
              >
                <Button.Label className="text-white font-bold">🎭 Ver Cara</Button.Label>
              </Button>

              <Button
                variant="primary"
                className="flex-1 rounded-2xl py-3 bg-emerald-600"
                onPress={enterPlushMode}
              >
                <Button.Label className="text-white font-bold">🌙 Modo Peluche</Button.Label>
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 3. MODO CARA ANIMADA DE PANDA (INTERACTIVO)                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {displayMode === 'face' && (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#12141C', zIndex: 10 }]}
          className="justify-between pb-6"
          onTouchStart={() => {
            lastScreenTouchTimestampRef.current = Date.now();
          }}
        >
          {/* Barra Superior */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2 z-20">
            <Pressable
              onPress={() => {
                lastScreenTouchTimestampRef.current = Date.now();
                setNewFamilyCodeInput(effectiveFamilyId);
                setShowFamilyModal(true);
              }}
              className="flex-row items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
            >
              <View className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <Label className="text-white text-xs font-bold">
                Fam #{effectiveFamilyId}
              </Label>
              <Ionicons name="settings-outline" size={12} color="#94A3B8" />
            </Pressable>

            <View className="flex-row items-center gap-2">
              <Pressable
                className="bg-blue-500/20 border border-blue-500/40 px-3 py-1.5 rounded-full flex-row items-center gap-1"
                onPress={() => {
                  lastScreenTouchTimestampRef.current = Date.now();
                  setDisplayMode('camera');
                }}
              >
                <Ionicons name="camera-outline" size={14} color="#60A5FA" />
                <Label className="text-blue-300 text-xs font-bold">Alinear</Label>
              </Pressable>

              <Pressable
                className="bg-white/15 px-3 py-1.5 rounded-full flex-row items-center gap-1"
                onPress={() => {
                  lastScreenTouchTimestampRef.current = Date.now();
                  exitToyMode();
                }}
              >
                <Ionicons name="arrow-back" size={13} color="white" />
                <Label className="text-white text-xs font-bold">Salir</Label>
              </Pressable>
            </View>
          </View>

          {/* Cara de Panda con Ojos Animados */}
          <View className="flex-1 justify-center items-center px-4 my-1">
            <Animated.View style={{ transform: [{ scale: breathAnim }], alignItems: 'center', width: '100%' }}>
              <View className="flex-row justify-between w-64 -mb-8 z-0">
                <View className="w-20 h-20 bg-[#1E222D] rounded-full border-4 border-[#2A2F3D]" />
                <View className="w-20 h-20 bg-[#1E222D] rounded-full border-4 border-[#2A2F3D]" />
              </View>

              <View className="w-72 h-64 bg-[#F8FAFC] rounded-full border-4 border-[#E2E8F0] shadow-2xl items-center justify-center z-10 overflow-hidden">
                <View className="flex-row justify-around w-full px-8 mt-2">
                  <View className="w-16 h-20 bg-[#1E222D] rounded-full items-center justify-center transform -rotate-12">
                    <Animated.View
                      style={{
                        transform: [{ scaleY: blinkAnim }],
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: 'white',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View className="w-3.5 h-3.5 rounded-full bg-[#0F172A]" />
                      <View className="w-1 h-1 rounded-full bg-white absolute top-1 right-1" />
                    </Animated.View>
                  </View>

                  <View className="w-16 h-20 bg-[#1E222D] rounded-full items-center justify-center transform rotate-12">
                    <Animated.View
                      style={{
                        transform: [{ scaleY: blinkAnim }],
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: 'white',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View className="w-3.5 h-3.5 rounded-full bg-[#0F172A]" />
                      <View className="w-1 h-1 rounded-full bg-white absolute top-1 right-1" />
                    </Animated.View>
                  </View>
                </View>

                <View className="flex-row justify-between w-56 px-4 -mt-1">
                  <View className="w-7 h-3 rounded-full bg-pink-300 opacity-60" />
                  <View className="w-7 h-3 rounded-full bg-pink-300 opacity-60" />
                </View>

                <View className="w-5 h-3.5 bg-[#1E222D] rounded-full mt-1" />

                <Animated.View
                  style={{
                    transform: [{ scaleY: expression === 'speaking' ? mouthAnim : 1 }],
                    width: expression === 'speaking' ? 22 : 16,
                    height: expression === 'speaking' ? 14 : 7,
                    borderRadius: 8,
                    backgroundColor: expression === 'speaking' ? '#EF4444' : '#1E222D',
                    marginTop: 5,
                  }}
                />
              </View>

              {/* Corazones de abrazo */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: -20,
                  opacity: hugHeartAnim,
                  transform: [
                    {
                      translateY: hugHeartAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, -30],
                      }),
                    },
                  ],
                }}
              >
                <Label className="text-5xl">💖🤗💖</Label>
              </Animated.View>
            </Animated.View>
          </View>

          {/* Globo de Diálogo de Panda */}
          <View className="px-5 mb-2">
            <View className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15 w-full items-center">
              <Label className="text-white text-sm font-semibold text-center leading-5">
                {dialogueText}
              </Label>
              <Label className="text-emerald-400 text-[11px] mt-1 font-bold">
                {expression === 'speaking'
                  ? '🔊 Hablando con voz infantil (Gigi)'
                  : isPushToTalkRecording
                  ? '🎙️ Grabando tu voz... Toca para enviar'
                  : isHandsFreeActive
                  ? '🎙️ Escucha manos libres activa'
                  : '👆 Toca el micrófono para hablar o un botón'}
              </Label>
            </View>
          </View>

          {/* Chips de interacción rápida */}
          <View className="flex-row justify-center gap-2 px-4 mb-2.5">
            <Pressable
              onPress={() => triggerRemoteHug()}
              className="bg-pink-500/20 border border-pink-500/40 px-3 py-1.5 rounded-full flex-row items-center gap-1"
            >
              <Label className="text-pink-300 text-xs font-bold">🤗 Abrazo</Label>
            </Pressable>

            <Pressable
              onPress={() => handleQuickAction('¡Cuéntame un cuento cortito de animales!', '¡Cuéntame un cuento! 📖')}
              className="bg-purple-500/20 border border-purple-500/40 px-3 py-1.5 rounded-full flex-row items-center gap-1"
            >
              <Label className="text-purple-300 text-xs font-bold">📖 Cuento</Label>
            </Pressable>

            <Pressable
              onPress={() => handleQuickAction('¡Enséñame una palabra en inglés con pronunciación!', '¡Aprender inglés! 🇬🇧')}
              className="bg-blue-500/20 border border-blue-500/40 px-3 py-1.5 rounded-full flex-row items-center gap-1"
            >
              <Label className="text-blue-300 text-xs font-bold">🇬🇧 Inglés</Label>
            </Pressable>

            <Pressable
              onPress={() => handleQuickAction('¡Cuéntame un chiste infantil muy gracioso!', '¡Dime un chiste! ⭐')}
              className="bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-full flex-row items-center gap-1"
            >
              <Label className="text-amber-300 text-xs font-bold">⭐ Chiste</Label>
            </Pressable>
          </View>

          {/* Botones de Control Principal */}
          <View className="px-5 gap-2">
            {/* Botón Tocar para Hablar */}
            <Pressable
              onPress={togglePushToTalk}
              className={`py-3 px-4 rounded-2xl flex-row items-center justify-center gap-2.5 ${
                isPushToTalkRecording
                  ? 'bg-red-600 border-2 border-red-400'
                  : 'bg-emerald-600 border border-emerald-400/50'
              }`}
            >
              <Ionicons
                name={isPushToTalkRecording ? 'stop-circle' : 'mic'}
                size={22}
                color="white"
              />
              <Label className="text-white font-extrabold text-sm">
                {isPushToTalkRecording ? '⏹️ Enviar a Panda' : '🎙️ Tocar para Hablar'}
              </Label>
            </Pressable>

            {/* Fila de opciones: Toggle Manos Libres y Botón Modo Peluche */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={toggleHandsFree}
                className={`flex-1 py-2 px-3 rounded-2xl border flex-row items-center justify-center gap-1.5 ${
                  isHandsFreeActive
                    ? 'bg-blue-600/30 border-blue-500'
                    : 'bg-white/10 border-white/10'
                }`}
              >
                <Ionicons
                  name={isHandsFreeActive ? 'radio' : 'radio-outline'}
                  size={16}
                  color={isHandsFreeActive ? '#60A5FA' : '#94A3B8'}
                />
                <Label className={`text-xs font-bold ${isHandsFreeActive ? 'text-blue-300' : 'text-gray-400'}`}>
                  {isHandsFreeActive ? 'Manos Libres: ON' : 'Manos Libres: OFF'}
                </Label>
              </Pressable>

              <Pressable
                onPress={enterPlushMode}
                className="flex-1 py-2 px-3 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex-row items-center justify-center gap-1.5"
              >
                <Ionicons name="moon" size={16} color="#818CF8" />
                <Label className="text-indigo-300 text-xs font-bold">Modo Peluche 🌙</Label>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Modal para configurar o cambiar el Código de Familia en el juguete */}
      <Modal
        visible={showFamilyModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFamilyModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/85 px-6">
          <View className="w-full bg-[#181B26] p-6 rounded-3xl border border-white/10 max-w-sm">
            <View className="items-center mb-3">
              <View className="w-14 h-14 rounded-2xl bg-emerald-500/20 items-center justify-center mb-3">
                <Ionicons name="link-outline" size={28} color="#10B981" />
              </View>
              <Label className="text-xl font-extrabold text-white text-center">
                Vincular Teléfono a Padres
              </Label>
              <Label className="text-xs text-gray-300 text-center mt-1.5 leading-4">
                Abre la app de Padres en el otro teléfono, entra a <Label className="text-emerald-400 font-bold">Supervisión</Label> y copia el <Label className="text-emerald-400 font-bold">Código de Familia</Label> que ves allí.
              </Label>
            </View>

            <View className="my-2">
              <Label className="text-gray-400 text-xs font-semibold mb-1 text-center">
                Código de Familia (ej: 1, 2, 3...)
              </Label>
              <TextInput
                className="bg-white/10 text-white text-2xl font-black text-center py-3.5 px-4 rounded-2xl border border-emerald-500/40 mb-3"
                value={newFamilyCodeInput}
                onChangeText={setNewFamilyCodeInput}
                placeholder="1"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                autoFocus
              />
            </View>

            <View className="flex-row gap-3">
              <Button
                variant="tertiary"
                className="flex-1"
                onPress={() => setShowFamilyModal(false)}
              >
                <Button.Label className="text-gray-400 font-semibold">Cerrar</Button.Label>
              </Button>

              <Button
                variant="primary"
                className="flex-1 bg-emerald-600"
                onPress={async () => {
                  const code = newFamilyCodeInput.trim();
                  if (code) {
                    setFamilyId(code);
                    await storage.setItem('toy_family_id', code);
                    setShowFamilyModal(false);
                    Alert.alert(
                      '¡Vinculado con Éxito! 🐼🎉',
                      `Panda está conectado a la Familia #${code}. En la app de padres verás el juguete en línea.`
                    );
                  }
                }}
              >
                <Button.Label className="text-white font-bold">Conectar</Button.Label>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
