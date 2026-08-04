import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/env';
import io, { Socket } from 'socket.io-client';

export default function CameraBroadcasterScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [roomId] = useState('PANDA_01');
  const cameraRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<any>(null);

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
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#4A90D9" />
        <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
        <Text style={styles.permissionSub}>
          Esta pantalla convierte este teléfono en la cámara en vivo del juguete para supervisión.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>Conceder Permisos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Header Superior */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.statusBadge}>
            <View style={[styles.dot, isBroadcasting && styles.dotActive]} />
            <Text style={styles.statusText}>
              {isBroadcasting ? 'TRANSMITIENDO EN VIVO' : 'MODO CÁMARA JUGUETE'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.flipBtn}
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
          >
            <Ionicons name="camera-reverse-outline" size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* Panel Inferior de Emisión */}
        <View style={styles.bottomBar}>
          <Text style={styles.codeText}>Código de Sala: {roomId}</Text>
          <TouchableOpacity
            style={[styles.streamBtn, isBroadcasting && styles.streamBtnStop]}
            onPress={isBroadcasting ? stopStreaming : startStreaming}
          >
            <Ionicons name={isBroadcasting ? 'stop' : 'radio-outline'} size={24} color="white" />
            <Text style={styles.streamBtnText}>
              {isBroadcasting ? 'Detener Transmisión' : 'Iniciar Transmisión Nube'}
            </Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, backgroundColor: 'black' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  permissionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginTop: 16 },
  permissionSub: { fontSize: 14, color: '#7F8C8D', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  grantBtn: { backgroundColor: '#4A90D9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  grantBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  camera: { flex: 1, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  closeBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#94A3B8' },
  dotActive: { backgroundColor: '#EF4444' },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  flipBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  bottomBar: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 24,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  codeText: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  streamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  streamBtnStop: { backgroundColor: '#E74C3C' },
  streamBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
