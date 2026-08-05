import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/env';
import io, { Socket } from 'socket.io-client';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';

export default function SupervisionScreen({ navigation, route }: any) {
  const { colors, typography, isDark } = useTheme();

  const [roomId, setRoomId] = useState('PANDA_01');
  const [isConnected, setIsConnected] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Header del Padre */}
      <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Supervisión en Vivo</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Panda Inteligente • Remoto Nube</Text>
        </View>
        <IconButton
          icon="camera-reverse"
          variant="solid"
          color={colors.primary}
          onPress={() => navigation.navigate('CameraBroadcaster')}
        />
      </View>

      {/* Pantalla de Streaming */}
      <View style={[
        styles.videoContainer,
        { backgroundColor: isDark ? '#000000' : '#1E293B' },
        nightMode && { borderColor: colors.success, borderWidth: 2 }
      ]}>
        {currentFrame ? (
          <Image source={{ uri: currentFrame }} style={styles.streamImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.placeholderTitle}>Conectando a la cámara de Panda...</Text>
            <Text style={styles.placeholderSub}>
              Asegúrate de que el teléfono secundario tenga abierto el "Modo Cámara Juguete".
            </Text>
          </View>
        )}

        {/* Badge EN VIVO */}
        <View style={styles.liveBadge}>
          <View style={[styles.redDot, { backgroundColor: colors.error }]} />
          <Text style={styles.liveText}>EN VIVO (NUBE)</Text>
        </View>
      </View>

      {/* Panel de Controles para el Padre */}
      <Card variant="flat" style={[styles.controlsPanel, { backgroundColor: colors.card }]}>
        <Text style={[styles.controlsTitle, { color: colors.text }]}>Controles de Monitoreo</Text>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[
              styles.controlBtn,
              { backgroundColor: audioEnabled ? colors.primary : colors.surface }
            ]}
            onPress={() => setAudioEnabled(!audioEnabled)}
          >
            <Ionicons name={audioEnabled ? 'volume-high' : 'volume-mute'} size={24} color={audioEnabled ? '#FFFFFF' : colors.text} />
            <Text style={[styles.controlText, { color: audioEnabled ? '#FFFFFF' : colors.text }]}>Escuchar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlBtn,
              { backgroundColor: nightMode ? colors.primary : colors.surface }
            ]}
            onPress={() => setNightMode(!nightMode)}
          >
            <Ionicons name={nightMode ? 'moon' : 'moon-outline'} size={24} color={nightMode ? '#FFFFFF' : colors.text} />
            <Text style={[styles.controlText, { color: nightMode ? '#FFFFFF' : colors.text }]}>Nocturna</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: colors.surface }]}
            onPress={() => Alert.alert('Captura', 'Captura de pantalla guardada en la galería.')}
          >
            <Ionicons name="camera" size={24} color={colors.text} />
            <Text style={[styles.controlText, { color: colors.text }]}>Capturar</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitleContainer: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSubtitle: { fontSize: 13 },
  videoContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamImage: { width: '100%', height: '100%' },
  placeholderContainer: { padding: 24, alignItems: 'center' },
  placeholderTitle: { color: 'white', fontSize: 16, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  placeholderSub: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 8 },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  redDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { color: 'white', fontSize: 12, fontWeight: '700' },
  controlsPanel: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    marginBottom: 0,
    marginHorizontal: 0,
  },
  controlsTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  controlBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  controlText: { fontSize: 12, fontWeight: '700' },
});
