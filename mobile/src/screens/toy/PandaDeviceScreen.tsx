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

  // MODO PREDETERMINADO: 'stealth' (Pantalla negra para que el teléfono no se caliente dentro del peluche)
  const [displayMode, setDisplayMode] = useState<DeviceDisplayMode>('stealth');
  const [facing, setFacing] = useState<'front' | 'back'>('front'); // Cámara frontal predeterminada para el orificio
  const [isBroadcasting, setIsBroadcasting] = useState(true);
  const [isParentWatching, setIsParentWatching] = useState(false);
  const isParentWatchingRef = useRef<boolean>(false);
  const isCapturingFrameRef = useRef<boolean>(false);
  const captureLoopTimerRef = useRef<any>(null);
  const [isBtConnected, setIsBtConnected] = useState(false);

  // Estado y expresión
  const [expression, setExpression] = useState<PandaExpression>('idle');
  const [dialogueText, setDialogueText] = useState<string>('Panda listo y escuchando en el juguete 🐼');
  const [audioLevel, setAudioLevel] = useState<number>(-160);
  const lastAudioLevelRef = useRef<number>(-160);
  const lastAudioUpdateTimestampRef = useRef<number>(0);

  // Control del bucle continuo manos libres
  const isHandsFreeActiveRef = useRef<boolean>(true);
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
  const [hugCount, setHugCount] = useState(0);

  const [accent] = useThemeColor(['accent']);
  const effectiveFamilyId = user?.id ? String(user.id) : (familyId || '1');
  const roomId = `${effectiveFamilyId}_PANDA_01`;

  // Captura asíncrona secuencial suave bajo demanda (solo cuando el padre está viendo)
  const captureFrameStep = useCallback(async () => {
    if (!isParentWatchingRef.current || isCapturingFrameRef.current) return;
    if (!cameraRef.current || !socketRef.current?.connected) return;

    isCapturingFrameRef.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.22,
        base64: true,
        skipProcessing: true,
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
      if (isParentWatchingRef.current && isBroadcasting) {
        captureLoopTimerRef.current = setTimeout(captureFrameStep, 800);
      }
    }
  }, [roomId, isBroadcasting]);

  // 1. Inicializar credenciales y rol
  useEffect(() => {
    const initDevice = async () => {
      try {
        const token = await storage.getItem('token');
        const savedUserStr = await storage.getItem('user');
        const savedFamId = await storage.getItem('toy_family_id');

        if (savedUserStr) {
          const u = JSON.parse(savedUserStr);
          setUser(u);
          setFamilyId(String(u.id));
        } else if (savedFamId) {
          setFamilyId(savedFamId);
        } else if (token) {
          try {
            const res = await authService.getProfile();
            const profile = res?.data?.data || res?.data;
            if (profile && profile.id) {
              setUser(profile);
              setFamilyId(String(profile.id));
              await storage.setItem('user', JSON.stringify(profile));
            }
          } catch (_) {}
        } else {
          const defaultId = route.params?.familyId || '1';
          setFamilyId(String(defaultId));
          await storage.setItem('toy_family_id', String(defaultId));
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

        const flavor = pandaBluetooth.getAppFlavor();
        if (flavor === 'toy') {
          await storage.setItem('device_role', 'toy_device');
        } else {
          await storage.removeItem('device_role');
        }
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
          console.log(`🐼 Teléfono Secundario (Juguete) conectado a Socket.io (Familia #${effectiveFamilyId}):`, socket?.id);
          socket?.emit('join:toy', String(toyId));
          socket?.emit('camera:join_stream', roomId);
          socket?.emit('toy:status_update', {
            toyId: String(toyId),
            status: 'ONLINE',
            battery: batteryLevel,
            isHugging: false,
            hugCount,
          });
        });

        // 👁️ Escuchar cuando el padre abre o cierra la vista de supervisión
        socket.on('camera:viewer_active', (data: { active: boolean }) => {
          const active = !!data?.active;
          console.log('👀 Señal de espectador en vivo recibida:', active);
          setIsParentWatching(active);
          isParentWatchingRef.current = active;
          if (active) {
            if (captureLoopTimerRef.current) clearTimeout(captureLoopTimerRef.current);
            captureFrameStep();
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
  }, [toyId, roomId, effectiveFamilyId, batteryLevel, hugCount, captureFrameStep]);

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
  // 6. MOTOR MANOS LIBRES: ESCUCHA CONTINUA Y DETECCIÓN DE VOZ (VAD)
  // ══════════════════════════════════════════════════════════════════════
  const startHandsFreeRecording = async () => {
    if (!isHandsFreeActiveRef.current || isSpeakingRef.current || isProcessingRef.current) {
      return;
    }

    try {
      // Limpiar grabación previa si existe
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
        150 // Chequeo cada 150ms para respuesta inmediata
      );

      recordingRef.current = recording;
      voiceDetectedRef.current = false;
      lastVoiceTimestampRef.current = 0;
      recordingStartTimestampRef.current = Date.now();
      setExpression('listening');
      setDialogueText('Panda escuchando con atención... 🎙️');
    } catch (err) {
      console.warn('Reintentando inicio de escucha manos libres:', err);
      setTimeout(() => {
        if (!isSpeakingRef.current && !isProcessingRef.current) {
          startHandsFreeRecording();
        }
      }, 1500);
    }
  };

  // Callback de estado del micrófono en tiempo real (análisis de decibelios)
  const onRecordingStatusUpdate = (status: Audio.RecordingStatus) => {
    if (!status.isRecording || isSpeakingRef.current || isProcessingRef.current) return;

    const metering = status.metering ?? -160;
    const now = Date.now();

    // Throttling: solo actualizar el estado de React cada 600ms o si hay cambio notable (>10dB)
    if (now - lastAudioUpdateTimestampRef.current > 600 || Math.abs(metering - lastAudioLevelRef.current) > 10) {
      lastAudioLevelRef.current = metering;
      lastAudioUpdateTimestampRef.current = now;
      setAudioLevel(metering);
    }

    const duration = status.durationMillis || 0;

    // Detectar si el niño comenzó a hablar
    if (metering > VOICE_THRESHOLD_DB) {
      if (!voiceDetectedRef.current) {
        console.log(`🎙️ Voz detectada por el micrófono (${metering.toFixed(1)} dB)`);
      }
      voiceDetectedRef.current = true;
      lastVoiceTimestampRef.current = now;
      setExpression('listening');
      setDialogueText('¡Te escucho, amiguito! 🐼');
    }

    // Caso A: El niño habló y ahora guardó silencio por más de SILENCE_TIMEOUT_MS
    if (voiceDetectedRef.current) {
      const silenceDuration = now - lastVoiceTimestampRef.current;
      if (silenceDuration >= SILENCE_TIMEOUT_MS && (now - recordingStartTimestampRef.current) >= 800) {
        console.log(`✅ Fin de frase detectado tras ${duration}ms de audio. Procesando con IA...`);
        stopAndProcessSpeech();
        return;
      }
    }

    // Caso B: Límite máximo de grabación alcanzado
    if (duration >= MAX_RECORDING_DURATION_MS) {
      if (voiceDetectedRef.current) {
        stopAndProcessSpeech();
      } else {
        restartBuffer();
      }
      return;
    }

    // Caso C: Silencio prolongado mientras espera (nadie habló en 2.5s): reiniciar buffer limpiamente
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
    if (!isSpeakingRef.current && !isProcessingRef.current) {
      startHandsFreeRecording();
    }
  };

  // Detener grabación y enviar a la IA (Whisper -> Groq -> ElevenLabs)
  const stopAndProcessSpeech = async () => {
    if (isProcessingRef.current || isSpeakingRef.current) return;
    isProcessingRef.current = true;

    try {
      setExpression('thinking');
      setDialogueText('Panda escuchando y pensando respuesta... 🤔✨');

      let uri: string | null = null;
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        uri = recordingRef.current.getURI();
        recordingRef.current = null;
      }

      if (!uri) {
        isProcessingRef.current = false;
        startHandsFreeRecording();
        return;
      }

      console.log('📡 Enviando audio del niño a Groq Whisper STT...');
      const response = await toyService.voiceChatWithAudio(toyId, uri);

      if (response.data?.success && response.data?.data) {
        const { userText, replyText, audioUrl } = response.data.data;

        // Si la transcripción fue vacía o no reconoció palabras:
        if (!userText || userText.trim().length === 0 || userText === '.') {
          if (audioUrl) {
            setDialogueText('No te alcancé a escuchar bien... 🐼👂');
            await playPandaVoiceAloud(audioUrl);
          } else {
            isProcessingRef.current = false;
            setDialogueText('No te escuché bien, ¿me hablas más fuerte? 🐼');
            setTimeout(() => {
              startHandsFreeRecording();
            }, 1800);
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
            startHandsFreeRecording();
          }, 3000);
        }
      } else {
        isProcessingRef.current = false;
        startHandsFreeRecording();
      }
    } catch (err) {
      console.error('Error en procesamiento de voz:', err);
      isProcessingRef.current = false;
      startHandsFreeRecording();
    }
  };

  // Reproducir voz por los altavoces de forma potente y luego reanudar escucha
  const playPandaVoiceAloud = async (audioUrl: string) => {
    isSpeakingRef.current = true;
    isProcessingRef.current = false;
    setExpression('speaking');

    // Notificar al ESP32 para animar los ojos al compás del habla
    pandaBluetooth.sendCommand('LED:TALK\n').catch(() => {});

    // Activar animación rítmica de boca
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
          setDialogueText('Panda escuchando de nuevo... 🐼');
          // Restaurar ojos normales en el ESP32
          pandaBluetooth.sendCommand('LED:NORMAL\n').catch(() => {});
          // Pequeña pausa antes de reanudar para evitar eco residual
          setTimeout(() => {
            if (!isSpeakingRef.current) {
              startHandsFreeRecording();
            }
          }, 400);
        }
      });
    } catch (e) {
      console.error('Error en altavoz:', e);
      isSpeakingRef.current = false;
      pandaBluetooth.sendCommand('LED:NORMAL\n').catch(() => {});
      startHandsFreeRecording();
    }
  };

  // Iniciar el bucle de escucha manos libres al montar la pantalla
  useEffect(() => {
    isHandsFreeActiveRef.current = true;
    const startTimer = setTimeout(() => {
      startHandsFreeRecording();
    }, 1000);

    return () => {
      clearTimeout(startTimer);
      isHandsFreeActiveRef.current = false;
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      stopAudio();
    };
  }, [toyId]);

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

      {/* 📹 Cámara nativa: SIEMPRE fija a pantalla completa en el fondo para evitar parpadeos de SurfaceView */}
      <View style={StyleSheet.absoluteFillObject}>
        <CameraView style={StyleSheet.absoluteFillObject} facing={facing} ref={cameraRef} />
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 1. MODO SIGILO (PREDETERMINADO: PANTALLA NEGRA / CERO CALOR)      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {displayMode === 'stealth' && (
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000', zIndex: 10 }]}
          className="justify-between items-center py-10 px-6"
          onPress={() => setDisplayMode('face')}
        >
          {/* Barra superior con botón de salida */}
          <View className="flex-row items-center justify-between w-full z-20 pt-2">
            <View className="flex-row items-center gap-2 opacity-50">
              <View className={`w-2 h-2 rounded-full ${isParentWatching ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <Label className="text-gray-400 text-xs font-semibold">
                Panda Inside • Fam #{effectiveFamilyId}
              </Label>
            </View>

            <Pressable
              className="bg-white/20 px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
              onPress={exitToyMode}
            >
              <Ionicons name="arrow-back" size={14} color="white" />
              <Label className="text-white text-xs font-bold">Salir a Padres</Label>
            </Pressable>
          </View>

          {/* Icono central de bajo consumo */}
          <View className="items-center opacity-30">
            <Ionicons name="radio-outline" size={44} color="#60A5FA" />
            <Label className="text-gray-400 text-xs mt-3 text-center leading-5">
              Cámara lista por el orificio{'\n'}Micrófono escuchando • Altavoces activos
            </Label>
          </View>

          {/* Nivel de audio en vivo / batería */}
          <View className="flex-row items-center justify-between w-full opacity-40 px-4">
            <Label className="text-gray-500 text-[11px]">
              Mic: {audioLevel > VOICE_THRESHOLD_DB ? '🎙️ Voz activa' : 'Silencio'} ({audioLevel.toFixed(0)} dB)
            </Label>
            <Label className="text-gray-500 text-[11px]">Batería: {batteryLevel}%</Label>
          </View>
        </Pressable>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. MODO CALIBRACIÓN DE CÁMARA (ENFOCAR EL ORIFICIO DEL PELUCHE)  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {displayMode === 'camera' && (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'transparent', zIndex: 10 }]}
          className="justify-between p-6"
        >
          <View className="flex-row items-center justify-between pt-6">
            <View className="bg-black/70 px-3 py-1.5 rounded-full flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <Label className="text-white text-xs font-bold">ALINEAR ORIFICIO</Label>
            </View>

            <Pressable
              className="bg-black/70 p-2.5 rounded-full"
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse-outline" size={22} color="white" />
            </Pressable>
          </View>

          <View className="self-center w-56 h-56 border-2 border-white/70 border-dashed rounded-full items-center justify-center bg-black/25">
            <Label className="text-white font-bold text-xs text-center px-4">
              Alinea la lente con el orificio del ojo/nariz de Panda
            </Label>
          </View>

          <Button
            variant="primary"
            className="w-full rounded-2xl py-3.5 bg-emerald-600"
            onPress={() => setDisplayMode('stealth')}
          >
            <Button.Label className="text-white font-bold">Listo (Volver a Pantalla Negra)</Button.Label>
          </Button>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 3. MODO CARA ANIMADA DE PANDA                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {displayMode === 'face' && (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#12141C', zIndex: 10 }]}
          className="justify-between"
        >
          <View className="flex-row items-center justify-between px-6 pt-4 pb-2 z-20">
            <View className="flex-row items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
              <View className={`w-2 h-2 rounded-full ${isParentWatching ? 'bg-red-400' : 'bg-emerald-400'}`} />
              <Label className="text-white/80 text-[11px] font-bold">
                {toyName} • Fam #{effectiveFamilyId} • {isParentWatching ? 'Padres Mirando' : 'Reposo'}
              </Label>
            </View>

            <View className="flex-row items-center gap-2">
              {!isLocked && (
                <>
                  <Pressable
                    className="w-9 h-9 rounded-full bg-emerald-500/25 items-center justify-center"
                    onPress={() => {
                      setNewFamilyCodeInput(effectiveFamilyId);
                      setShowFamilyModal(true);
                    }}
                  >
                    <Ionicons name="link-outline" size={18} color="#10B981" />
                  </Pressable>

                  <Pressable
                    className="w-9 h-9 rounded-full bg-white/15 items-center justify-center"
                    onPress={() => setDisplayMode('camera')}
                  >
                    <Ionicons name="camera-outline" size={18} color="white" />
                  </Pressable>

                  <Pressable
                    className="w-9 h-9 rounded-full bg-white/15 items-center justify-center"
                    onPress={() => setDisplayMode('stealth')}
                  >
                    <Ionicons name="moon-outline" size={18} color="white" />
                  </Pressable>

                  <Pressable
                    className="w-9 h-9 rounded-full bg-red-500/30 items-center justify-center"
                    onPress={exitToyMode}
                  >
                    <Ionicons name="exit-outline" size={18} color="#EF4444" />
                  </Pressable>
                </>
              )}

              <Pressable
                className="bg-white/20 px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
                onPress={exitToyMode}
              >
                <Ionicons name="arrow-back" size={14} color="white" />
                <Label className="text-white text-xs font-bold">Salir a Padres</Label>
              </Pressable>

              <Pressable
                className={`w-9 h-9 rounded-full items-center justify-center ${
                  isLocked ? 'bg-white/10' : 'bg-accent'
                }`}
                onPressIn={handleLockPressIn}
                onPressOut={handleLockPressOut}
              >
                <Ionicons
                  name={isLocked ? 'lock-closed' : 'lock-open'}
                  size={16}
                  color={isLocked ? '#94A3B8' : 'white'}
                />
              </Pressable>
            </View>
          </View>

          {/* Cara de Panda con Ojos Animados */}
          <View className="flex-1 justify-center items-center px-4">
            <Animated.View style={{ transform: [{ scale: breathAnim }], alignItems: 'center', width: '100%' }}>
              <View className="flex-row justify-between w-64 -mb-8 z-0">
                <View className="w-20 h-20 bg-[#1E222D] rounded-full border-4 border-[#2A2F3D]" />
                <View className="w-20 h-20 bg-[#1E222D] rounded-full border-4 border-[#2A2F3D]" />
              </View>

              <View className="w-80 h-72 bg-[#F8FAFC] rounded-full border-4 border-[#E2E8F0] shadow-2xl items-center justify-center z-10 overflow-hidden">
                <View className="flex-row justify-around w-full px-8 mt-4">
                  <View className="w-20 h-24 bg-[#1E222D] rounded-full items-center justify-center transform -rotate-12">
                    <Animated.View
                      style={{
                        transform: [{ scaleY: blinkAnim }],
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: 'white',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View className="w-4 h-4 rounded-full bg-[#0F172A]" />
                      <View className="w-1.5 h-1.5 rounded-full bg-white absolute top-1 right-1" />
                    </Animated.View>
                  </View>

                  <View className="w-20 h-24 bg-[#1E222D] rounded-full items-center justify-center transform rotate-12">
                    <Animated.View
                      style={{
                        transform: [{ scaleY: blinkAnim }],
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: 'white',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View className="w-4 h-4 rounded-full bg-[#0F172A]" />
                      <View className="w-1.5 h-1.5 rounded-full bg-white absolute top-1 right-1" />
                    </Animated.View>
                  </View>
                </View>

                <View className="flex-row justify-between w-64 px-4 -mt-2">
                  <View className="w-8 h-4 rounded-full bg-pink-300 opacity-60" />
                  <View className="w-8 h-4 rounded-full bg-pink-300 opacity-60" />
                </View>

                <View className="w-6 h-4 bg-[#1E222D] rounded-full mt-1" />

                <Animated.View
                  style={{
                    transform: [{ scaleY: expression === 'speaking' ? mouthAnim : 1 }],
                    width: expression === 'speaking' ? 24 : 18,
                    height: expression === 'speaking' ? 16 : 8,
                    borderRadius: 10,
                    backgroundColor: expression === 'speaking' ? '#EF4444' : '#1E222D',
                    marginTop: 6,
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
          <View className="px-6 pb-8 items-center">
            <View className="bg-white/10 px-5 py-3 rounded-2xl border border-white/15 w-full items-center">
              <Label className="text-white text-base font-semibold text-center">
                {dialogueText}
              </Label>
              <Label className="text-emerald-400 text-xs mt-1 font-bold">
                {expression === 'speaking' ? '🔊 Altavoz activo' : '🎙️ Manos libres: solo háblale a Panda'}
              </Label>
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
        <View className="flex-1 justify-center items-center bg-black/80 px-6">
          <View className="w-full bg-[#181B26] p-6 rounded-3xl border border-white/10 max-w-sm">
            <View className="items-center mb-3">
              <View className="w-12 h-12 rounded-2xl bg-emerald-500/20 items-center justify-center mb-2">
                <Ionicons name="link-outline" size={24} color="#10B981" />
              </View>
              <Label className="text-xl font-extrabold text-white text-center">Vincular a Familia</Label>
              <Label className="text-xs text-gray-400 text-center mt-1">
                Ingresa el Código de Familia que aparece en la app de los padres (ejemplo: 1).
              </Label>
            </View>

            <TextInput
              className="bg-white/10 text-white text-xl font-bold text-center py-3.5 px-4 rounded-2xl border border-white/20 mb-5"
              value={newFamilyCodeInput}
              onChangeText={setNewFamilyCodeInput}
              placeholder="Código de Familia"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
            />

            <View className="flex-row gap-3">
              <Button
                variant="tertiary"
                className="flex-1"
                onPress={() => setShowFamilyModal(false)}
              >
                <Button.Label className="text-gray-400 font-semibold">Cancelar</Button.Label>
              </Button>

              <Button
                variant="primary"
                className="flex-1 bg-emerald-600"
                onPress={async () => {
                  if (newFamilyCodeInput.trim()) {
                    const code = newFamilyCodeInput.trim();
                    setFamilyId(code);
                    await storage.setItem('toy_family_id', code);
                    setShowFamilyModal(false);
                    Alert.alert('¡Vinculado con Éxito!', `Panda está ahora enlazado a la Familia #${code}`);
                  }
                }}
              >
                <Button.Label className="text-white font-bold">Vincular</Button.Label>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
