import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { toyService } from '../../services/api';
import { playAudio, stopAudio } from '../../services/audioService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  audioUrl?: string;
}

interface CharacterVoice {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

const VOICE_OPTIONS: CharacterVoice[] = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Panda Dulce)', icon: 'paw', desc: 'Voz tierna e infantil' },
  { id: 'jBpfOiLJlfdOoWvoflAa', name: 'Gigi (Cuento Mágico)', icon: 'sparkles', desc: 'Voz animada de hada' },
  { id: 'zrHiDhphv95cyQqftM9H', name: 'Mimi (Oso Pequeño)', icon: 'heart', desc: 'Voz muy tierna tipo peluche' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Amiga Panda)', icon: 'moon', desc: 'Voz calmada para dormir' },
  { id: 'jsCqWAovK2LkecYy1ClR', name: 'Freya (Princesa)', icon: 'ribbon', desc: 'Voz alegre y expresiva' },
  { id: 'z9fAnlkznG4ndvfOBYJU', name: 'Glinda (Fantasía)', icon: 'planet', desc: 'Voz mágica de cuento' },
  { id: 'zcAAsDuNqEBlko7h1jiB', name: 'Giovanni (Explorador)', icon: 'compass', desc: 'Voz animada masculina' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Aventurera)', icon: 'flash', desc: 'Voz enérgica y risueña' },
  { id: 'D38z5RcWu1voky8WS1ja', name: 'Finn (Caricatura)', icon: 'happy', desc: 'Voz graciosa de caricatura' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Divertido)', icon: 'school', desc: 'Voz juvenil amigable' },
];

export default function ChatScreen({ navigation, route }: any) {
  const { toyId, toyName, avatarUrl } = route.params || {};
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>('EXAVITQu4vr4xnSDxMaL');
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const isProcessingRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (toyId) {
      loadMessages();
    }
    return () => {
      stopAudio();
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [toyId]);

  const loadMessages = async () => {
    try {
      const response = await toyService.getMessages(toyId);
      if (response.data.success) {
        const msgs = response.data.data.map((m: any) => ({
          id: m.id.toString(),
          text: m.content,
          isUser: m.isUser,
          timestamp: new Date(m.createdAt),
        }));
        setMessages(msgs);
        if (msgs.length === 0 && toyName) {
          setMessages([
            {
              id: 'welcome',
              text: `¡Hola! Soy ${toyName}, tu amigo inteligente. Presiona el micrófono para hablarme o escríbeme 🧸`,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  // 🎙️ Iniciar grabación evadiendo bucles
  const startRecording = async () => {
    if (isProcessingRef.current || loading || isRecording) return;
    try {
      await stopAudio(); // Detener cualquier reproducción en curso

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Se requiere acceso al micrófono para hablar con Panda.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      setIsRecording(false);
    }
  };

  // ⏹️ Detener grabación de audio y enviar a backend
  const stopRecording = async () => {
    if (!recording || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsRecording(false);
    setLoading(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Cambiar modo de audio a modo reproducción para altavoces
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!uri || !toyId) {
        isProcessingRef.current = false;
        setLoading(false);
        return;
      }

      // Enviar audio con la voz seleccionada
      const res = await toyService.voiceChatWithAudio(toyId, uri, selectedVoice);

      if (res.data.success && res.data.data) {
        const userText = res.data.data.userText || '🎙️ Mensaje de voz';
        const replyText = res.data.data.replyText || '¡Hola!';
        const audioUrl = res.data.data.audioUrl;

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: userText,
            isUser: true,
            timestamp: new Date(),
          },
          {
            id: (Date.now() + 1).toString(),
            text: replyText,
            isUser: false,
            timestamp: new Date(),
            audioUrl,
          },
        ]);

        if (audioUrl) {
          await playAudio(audioUrl);
        }
      }
    } catch (error) {
      console.error('Error procesando voz:', error);
      Alert.alert('Error', 'No se pudo procesar la voz.');
    } finally {
      isProcessingRef.current = false;
      setLoading(false);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || !toyId || isProcessingRef.current) return;

    isProcessingRef.current = true;
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      let replyText = '';
      let audioUrl = '';

      if (voiceMode) {
        const response = await toyService.voiceChatWithToy(toyId, text, selectedVoice);
        if (response.data.success) {
          replyText = response.data.data.replyText;
          audioUrl = response.data.data.audioUrl;
        }
      } else {
        await toyService.saveMessage(toyId, text, true);
        const response = await toyService.chatWithToy(toyId, text);
        replyText = response.data?.data?.reply || 'No pude entender eso, ¿puedes repetirlo?';
        await toyService.saveMessage(toyId, replyText, false);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText || '¡Hola! Qué gusto saludarte.',
        isUser: false,
        timestamp: new Date(),
        audioUrl,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (audioUrl) {
        await playAudio(audioUrl);
      }
    } catch (error) {
      console.error('Error en chat:', error);
    } finally {
      isProcessingRef.current = false;
      setLoading(false);
    }
  };

  const currentVoiceObj = VOICE_OPTIONS.find((v) => v.id === selectedVoice) || VOICE_OPTIONS[0];

  return (
    <View style={styles.mainWrapper}>
      {/* Header del Chat */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#2C3E50" />
        </TouchableOpacity>
        <Image
          source={{ uri: avatarUrl || 'https://image.pollinations.ai/prompt/cute%20panda%20toy?width=100&height=100' }}
          style={styles.headerAvatar}
        />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{toyName || 'Panda Inteligente'}</Text>
          <Text style={styles.headerStatus}>🟢 Voz: {currentVoiceObj.name.split(' ')[0]}</Text>
        </View>

        {/* Botón Selector de Voz */}
        <TouchableOpacity style={styles.voiceSelectBtn} onPress={() => setShowVoiceModal(true)}>
          <Ionicons name="mic-circle" size={26} color="#8E44AD" />
        </TouchableOpacity>

        {/* Toggle de Mute/Voz */}
        <TouchableOpacity
          style={[styles.voiceToggle, voiceMode && styles.voiceToggleActive]}
          onPress={() => setVoiceMode(!voiceMode)}
        >
          <Ionicons name="volume-medium" size={20} color={voiceMode ? 'white' : '#7F8C8D'} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Lista de Mensajes */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.messageRow, msg.isUser ? styles.userRow : styles.botRow]}>
              {!msg.isUser && (
                <Image
                  source={{ uri: avatarUrl || 'https://image.pollinations.ai/prompt/cute%20panda%20toy?width=100&height=100' }}
                  style={styles.avatar}
                />
              )}
              <View style={[styles.messageBubble, msg.isUser ? styles.userBubble : styles.botBubble]}>
                <Text style={msg.isUser ? styles.userText : styles.botText}>{msg.text}</Text>
                {msg.audioUrl && (
                  <TouchableOpacity
                    style={styles.audioPlayBtn}
                    onPress={() => msg.audioUrl && playAudio(msg.audioUrl)}
                  >
                    <Ionicons name="play-circle" size={22} color="#27AE60" />
                    <Text style={styles.audioPlayText}>Escuchar Voz de Panda</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.timestamp}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <Ionicons name="mic-sharp" size={24} color="#E74C3C" />
              <Text style={styles.recordingText}>🎙️ Grabando... suelta para enviar</Text>
            </View>
          )}

          {loading && (
            <View style={[styles.messageRow, styles.botRow]}>
              <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#4A90D9" />
                <Text style={styles.loadingBubbleText}>Panda está procesando la respuesta de voz...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Barra de Entrada */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonRecording, loading && styles.micButtonDisabled]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={loading}
          >
            <Ionicons name={isRecording ? "stop-circle" : "mic"} size={24} color="white" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Mantén el micro para hablar..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal Selector de Voces de Personajes */}
      <Modal visible={showVoiceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Elige la Voz de Panda</Text>
                <Text style={styles.modalSubtitle}>10 voces oficiales estilo caricatura</Text>
              </View>
              <TouchableOpacity onPress={() => setShowVoiceModal(false)}>
                <Ionicons name="close" size={26} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.voiceList}>
              {VOICE_OPTIONS.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.voiceCard, selectedVoice === v.id && styles.voiceCardActive]}
                  onPress={() => {
                    setSelectedVoice(v.id);
                    setShowVoiceModal(false);
                  }}
                >
                  <View style={[styles.voiceIconBg, selectedVoice === v.id && styles.voiceIconBgActive]}>
                    <Ionicons name={v.icon as any} size={22} color={selectedVoice === v.id ? 'white' : '#8E44AD'} />
                  </View>
                  <View style={styles.voiceInfo}>
                    <Text style={[styles.voiceName, selectedVoice === v.id && styles.voiceNameActive]}>{v.name}</Text>
                    <Text style={styles.voiceDesc}>{v.desc}</Text>
                  </View>
                  {selectedVoice === v.id && <Ionicons name="checkmark-circle" size={24} color="#8E44AD" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#F8FAFC' },
  flexContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 2,
    zIndex: 10,
  },
  backButton: { padding: 4, marginRight: 8 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#E2E8F0' },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  headerStatus: { fontSize: 12, color: '#27AE60', marginTop: 1 },
  voiceSelectBtn: { padding: 6, marginRight: 4 },
  voiceToggle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  voiceToggleActive: { backgroundColor: '#4A90D9' },
  messagesContainer: { flex: 1, paddingHorizontal: 16 },
  messagesContent: { paddingVertical: 16 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#E2E8F0' },
  messageBubble: { maxWidth: '78%', padding: 14, borderRadius: 18 },
  userBubble: { backgroundColor: '#4A90D9', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: 'white', borderBottomLeftRadius: 4, elevation: 1 },
  userText: { color: 'white', fontSize: 15, lineHeight: 20 },
  botText: { color: '#1E293B', fontSize: 15, lineHeight: 20 },
  audioPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
  },
  audioPlayText: { fontSize: 12, color: '#27AE60', fontWeight: 'bold' },
  timestamp: { fontSize: 10, color: '#94A3B8', marginTop: 6, alignSelf: 'flex-end' },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDEDEC',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    gap: 8,
  },
  recordingText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 14 },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingBubbleText: { fontSize: 13, color: '#64748B' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
    gap: 10,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: { backgroundColor: '#E74C3C' },
  micButtonDisabled: { backgroundColor: '#CBD5E1' },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#1E293B',
  },
  sendButton: { backgroundColor: '#4A90D9', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#CBD5E1' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  voiceList: { marginBottom: 10 },
  voiceCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: '#F8FAFC', marginBottom: 10 },
  voiceCardActive: { backgroundColor: '#F3E8FF', borderWidth: 1, borderColor: '#8E44AD' },
  voiceIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  voiceIconBgActive: { backgroundColor: '#8E44AD' },
  voiceInfo: { flex: 1 },
  voiceName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  voiceNameActive: { color: '#8E44AD' },
  voiceDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
});