import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/env';
import io, { Socket } from 'socket.io-client';

export default function SupervisionScreen({ navigation, route }: any) {
  const [roomId, setRoomId] = useState('PANDA_01');
  const [isConnected, setIsConnected] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Conectar a Socket.io en la nube para recibir transmisión
    const socketServerUrl = API_URL.replace(/\/api\/?$/, '');
    const newSocket = io(socketServerUrl, { transports: ['websocket'] });

    newSocket.on('connect', () => {
      console.log('📡 Visor conectado a Socket.io Nube:', newSocket.id);
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
    <View style={styles.container}>
      {/* Header del Padre */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#2C3E50" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Supervisión en Vivo</Text>
          <Text style={styles.headerSubtitle}>Panda Inteligente • Remoto Nube</Text>
        </View>
        <TouchableOpacity
          style={styles.broadcastButton}
          onPress={() => navigation.navigate('CameraBroadcaster')}
        >
          <Ionicons name="camera-reverse" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Pantalla de Streaming */}
      <View style={[styles.videoContainer, nightMode && styles.nightModeOverlay]}>
        {currentFrame ? (
          <Image source={{ uri: currentFrame }} style={styles.streamImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderContainer}>
            <ActivityIndicator size="large" color="#4A90D9" />
            <Text style={styles.placeholderTitle}>Conectando a la cámara de Panda...</Text>
            <Text style={styles.placeholderSub}>
              Asegúrate de que el teléfono secundario tenga abierto el "Modo Cámara Juguete".
            </Text>
          </View>
        )}

        {/* Badge EN VIVO */}
        <View style={styles.liveBadge}>
          <View style={styles.redDot} />
          <Text style={styles.liveText}>EN VIVO (NUBE)</Text>
        </View>
      </View>

      {/* Panel de Controles para el Padre */}
      <View style={styles.controlsPanel}>
        <Text style={styles.controlsTitle}>Controles de Monitoreo</Text>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, audioEnabled && styles.controlBtnActive]}
            onPress={() => setAudioEnabled(!audioEnabled)}
          >
            <Ionicons name={audioEnabled ? 'volume-high' : 'volume-mute'} size={24} color={audioEnabled ? 'white' : '#2C3E50'} />
            <Text style={[styles.controlText, audioEnabled && styles.controlTextActive]}>Escuchar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, nightMode && styles.controlBtnActive]}
            onPress={() => setNightMode(!nightMode)}
          >
            <Ionicons name={nightMode ? 'moon' : 'moon-outline'} size={24} color={nightMode ? 'white' : '#2C3E50'} />
            <Text style={[styles.controlText, nightMode && styles.controlTextActive]}>Visión Nocturna</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => Alert.alert('Captura', 'Captura de pantalla guardada en la galería.')}
          >
            <Ionicons name="camera" size={24} color="#2C3E50" />
            <Text style={styles.controlText}>Capturar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EBF5FB',
  },
  backButton: { padding: 4, marginRight: 8 },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
  headerSubtitle: { fontSize: 13, color: '#7F8C8D' },
  broadcastButton: {
    backgroundColor: '#4A90D9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nightModeOverlay: {
    borderColor: '#27AE60',
    borderWidth: 2,
  },
  streamImage: { width: '100%', height: '100%' },
  placeholderContainer: { padding: 24, alignItems: 'center' },
  placeholderTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  placeholderSub: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 8 },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  liveText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  controlsPanel: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    elevation: 4,
  },
  controlsTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16 },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  controlBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
  },
  controlBtnActive: { backgroundColor: '#4A90D9' },
  controlText: { fontSize: 12, color: '#2C3E50', fontWeight: '600' },
  controlTextActive: { color: 'white' },
});
