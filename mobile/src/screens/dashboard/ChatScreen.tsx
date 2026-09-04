import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
  Animated,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { toyService } from '../../services/api';
import { playAudio, stopAudio, pauseAudio, resumeAudio } from '../../services/audioService';
import {
  Card,
  Button,
  Label,
  TextField,
  Input,
  Spinner,
  useThemeColor,
  Avatar,
  Chip,
  Surface,
} from 'heroui-native';
import { LiveVoiceView, VOICE_OPTIONS, CharacterVoice } from '../../components/chat/LiveVoiceView';
import { VoiceState } from '../../components/chat/VoiceOrb';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  audioUrl?: string;
}

const QUICK_PROMPTS = [
  '📖 Cuéntame un cuento corto',
  '❓ ¿Por qué el cielo es azul?',
  '🧩 Dime una adivinanza divertida',
  '🇬🇧 Enséñame una palabra en inglés',
  '🐼 ¿Cómo es la vida de los osos panda?',
];

export default function ChatScreen({ navigation, route }: any) {
  const { toyId, toyName = 'Panda Inteligente', avatarUrl, initialMode } = route.params || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>('EXAVITQu4vr4xnSDxMaL');
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Gemini Live / ChatGPT Voice Mode State
  const [liveVoiceVisible, setLiveVoiceVisible] = useState(initialMode === 'voice');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [lastUserText, setLastUserText] = useState<string>('');
  const [lastBotText, setLastBotText] = useState<string>('');

  // Audio recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const isProcessingRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Theme colors from HeroUI Native
  const [accent, muted, success, danger, background, surface, surfaceSecondary, separator] =
    useThemeColor([
      'accent',
      'muted',
      'success',
      'danger',
      'background',
      'surface',
      'surface-secondary',
      'separator',
    ]);

  useEffect(() => {
    if (toyId) {
      loadMessages();
    }
    return () => {
      stopAudio();
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
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
              text: `¡Hola! Soy ${toyName}, tu compañero inteligente. Puedes escribirme por aquí o pulsar el botón de Modo Voz para hablar en vivo conmigo como en una llamada 🧸✨`,
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

  // ── Grabación con expo-av ──
  const startRecording = async () => {
    if (isProcessingRef.current || loading || isRecording) return;
    try {
      await stopAudio();
      setVoiceState('listening');
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Se requiere acceso al micrófono para hablar con Panda.');
        setVoiceState('idle');
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
      setVoiceState('idle');
    }
  };

  const stopRecording = async () => {
    if (!recording || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsRecording(false);
    setLoading(true);
    setVoiceState('thinking');

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!uri || !toyId) {
        isProcessingRef.current = false;
        setLoading(false);
        setVoiceState('idle');
        return;
      }

      const res = await toyService.voiceChatWithAudio(toyId, uri, selectedVoice);

      if (res.data.success && res.data.data) {
        const userText = res.data.data.userText || '🎙️ Mensaje de voz';
        const replyText = res.data.data.replyText || '¡Hola!';
        const audioUrl = res.data.data.audioUrl;

        const uId = Date.now().toString();
        const bId = (Date.now() + 1).toString();

        setLastUserText(userText);
        setLastBotText(replyText);

        setMessages((prev) => [
          ...prev,
          { id: uId, text: userText, isUser: true, timestamp: new Date() },
          { id: bId, text: replyText, isUser: false, timestamp: new Date(), audioUrl },
        ]);

        if (audioUrl) {
          setVoiceState('speaking');
          setPlayingAudioId(bId);
          await playAudio(audioUrl, (status) => {
            if (status.didJustFinish) {
              setVoiceState('idle');
              setPlayingAudioId(null);
            }
          });
        } else {
          setVoiceState('idle');
        }
      } else {
        setVoiceState('idle');
      }
    } catch (error) {
      console.error('Error procesando voz:', error);
      Alert.alert('Error', 'No se pudo procesar la voz. Inténtalo de nuevo.');
      setVoiceState('idle');
    } finally {
      isProcessingRef.current = false;
      setLoading(false);
    }
  };

  // ── Enviar mensaje de texto ──
  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || !toyId || isProcessingRef.current) return;

    isProcessingRef.current = true;
    const uId = Date.now().toString();
    const userMsg: Message = { id: uId, text, isUser: true, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLastUserText(text);
    if (!textToSend) setInputText('');
    setLoading(true);
    setVoiceState('thinking');

    try {
      let replyText = '';
      let audioUrl = '';

      if (voiceMode || liveVoiceVisible) {
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

      const bId = (Date.now() + 1).toString();
      const botMsg: Message = {
        id: bId,
        text: replyText || '¡Hola! Qué gusto saludarte.',
        isUser: false,
        timestamp: new Date(),
        audioUrl,
      };

      setLastBotText(botMsg.text);
      setMessages((prev) => [...prev, botMsg]);

      if (audioUrl && (voiceMode || liveVoiceVisible)) {
        setVoiceState('speaking');
        setPlayingAudioId(bId);
        await playAudio(audioUrl, (status) => {
          if (status.didJustFinish) {
            setVoiceState('idle');
            setPlayingAudioId(null);
          }
        });
      } else {
        setVoiceState('idle');
      }
    } catch (error) {
      console.error('Error en chat:', error);
      setVoiceState('idle');
    } finally {
      isProcessingRef.current = false;
      setLoading(false);
    }
  };

  // ── Interrumpir / Pausar reproducción ──
  const handleInterrupt = async () => {
    await stopAudio();
    setVoiceState('idle');
    setPlayingAudioId(null);
  };

  // ── Reproducir / pausar audio de un mensaje específico en el historial ──
  const toggleAudioMessage = async (msgId: string, audioUrl: string) => {
    if (playingAudioId === msgId) {
      await stopAudio();
      setPlayingAudioId(null);
      setVoiceState('idle');
    } else {
      await stopAudio();
      setPlayingAudioId(msgId);
      setVoiceState('speaking');
      await playAudio(audioUrl, (status) => {
        if (status.didJustFinish) {
          setPlayingAudioId(null);
          setVoiceState('idle');
        }
      });
    }
  };

  const currentVoiceObj =
    VOICE_OPTIONS.find((v) => v.id === selectedVoice) || VOICE_OPTIONS[0];

  return (
    <View className="flex-1 bg-background">
      {/* ── Header Principal (HeroUI Native) ── */}
      <Surface
        variant="default"
        className="flex-row items-center px-4 pt-14 pb-3 border-b border-separator z-10"
      >
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full items-center justify-center bg-surface-secondary mr-2"
          accessibilityLabel="Volver atrás"
        >
          <Ionicons name="arrow-back" size={22} color={accent} />
        </Pressable>

        <View className="mr-3">
          <Avatar size="md" color="accent">
            {avatarUrl ? (
              <Avatar.Image source={{ uri: avatarUrl }} />
            ) : null}
            <Avatar.Fallback>
              <Label className="text-white font-bold">{toyName ? toyName[0] : 'P'}</Label>
            </Avatar.Fallback>
          </Avatar>
        </View>

        <View className="flex-1">
          <Text className="text-base font-extrabold text-foreground" numberOfLines={1}>
            {toyName}
          </Text>
          <View className="flex-row items-center mt-0.5">
            <View className="w-2 h-2 rounded-full bg-success mr-1.5" />
            <Label className="text-xs text-muted font-medium">
              En línea · Voz: {currentVoiceObj.name.split(' ')[0]}
            </Label>
          </View>
        </View>

        {/* Botón Selector de Voz */}
        <Pressable
          className="w-9 h-9 rounded-full bg-surface-secondary items-center justify-center mr-2"
          onPress={() => setShowVoiceModal(true)}
          accessibilityLabel="Elegir voz"
        >
          <Ionicons name="musical-notes-outline" size={20} color={accent} />
        </Pressable>

        {/* ── BOTÓN DESTACADO: MODO VOZ EN VIVO (Gemini Live / ChatGPT) ── */}
        <Pressable
          className="flex-row items-center bg-accent px-3.5 py-2 rounded-full shadow-sm"
          onPress={() => setLiveVoiceVisible(true)}
          accessibilityLabel="Abrir modo voz en vivo"
        >
          <Ionicons name="sparkles" size={16} color="white" />
          <Label className="text-white text-xs font-bold ml-1.5">Modo Voz</Label>
        </Pressable>
      </Surface>

      {/* ── Vista de Chat de Texto ── */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isPlaying = playingAudioId === msg.id;

            return (
              <View
                key={msg.id}
                className={`flex-row items-end mb-4 ${
                  msg.isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!msg.isUser && (
                  <View className="mr-2 mb-1">
                    <Avatar size="sm" color="default">
                      {avatarUrl ? <Avatar.Image source={{ uri: avatarUrl }} /> : null}
                      <Avatar.Fallback>
                        <Label className="text-foreground font-bold text-xs">P</Label>
                      </Avatar.Fallback>
                    </Avatar>
                  </View>
                )}

                <View
                  className={`max-w-[80%] p-4 rounded-3xl ${
                    msg.isUser
                      ? 'bg-accent rounded-br-sm'
                      : 'bg-surface rounded-bl-sm border border-separator shadow-sm'
                  }`}
                >
                  <Label
                    className={`text-[15px] leading-6 font-normal ${
                      msg.isUser ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {msg.text}
                  </Label>

                  {/* Inline Audio Player Badge */}
                  {msg.audioUrl && (
                    <Pressable
                      className={`flex-row items-center px-3 py-2 rounded-2xl mt-2.5 gap-2 self-start ${
                        isPlaying ? 'bg-success/20 border border-success' : 'bg-surface-secondary'
                      }`}
                      onPress={() => toggleAudioMessage(msg.id, msg.audioUrl!)}
                    >
                      <Ionicons
                        name={isPlaying ? 'pause-circle' : 'play-circle'}
                        size={22}
                        color={isPlaying ? success : accent}
                      />
                      <Text
                        className="text-xs font-bold"
                        style={{ color: isPlaying ? success : accent }}
                      >
                        {isPlaying ? 'Pausar audio' : 'Escuchar voz'}
                      </Text>
                    </Pressable>
                  )}

                  <Label
                    className={`text-[10px] mt-2 self-end font-medium ${
                      msg.isUser ? 'text-white/70' : 'text-muted'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Label>
                </View>
              </View>
            );
          })}

          {/* Indicador animado de grabación en curso */}
          {isRecording && (
            <View className="flex-row items-center justify-center bg-danger/10 border border-danger/30 p-3.5 rounded-2xl mb-4 gap-2.5">
              <Ionicons name="radio" size={20} color={danger} />
              <Label className="font-bold text-danger text-sm">
                Grabando audio... suelta para enviar
              </Label>
            </View>
          )}

          {/* Indicador de "Panda pensando..." */}
          {loading && (
            <View className="flex-row items-end mb-4 justify-start">
              <View className="mr-2 mb-1">
                <Avatar size="sm" color="default">
                  <Avatar.Fallback>
                    <Label className="text-foreground font-bold text-xs">P</Label>
                  </Avatar.Fallback>
                </Avatar>
              </View>
              <Surface
                variant="default"
                className="p-3.5 rounded-3xl rounded-bl-sm border border-separator flex-row items-center gap-2.5 shadow-sm"
              >
                <Spinner size="sm" color="accent" />
                <Label className="text-[13px] text-muted font-medium">
                  Panda está pensando...
                </Label>
              </Surface>
            </View>
          )}
        </ScrollView>

        {/* ── Chips de Sugerencias Rápidas de Conversación ── */}
        <View className="py-2 border-t border-separator bg-surface">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {QUICK_PROMPTS.map((prompt, idx) => (
              <Pressable
                key={idx}
                onPress={() => sendMessage(prompt.substring(3))}
                disabled={loading}
                className="bg-surface-secondary px-3.5 py-1.5 rounded-full border border-separator/60"
              >
                <Label className="text-xs font-semibold text-foreground/80">{prompt}</Label>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Input Toolbar Inferior ── */}
        <Surface
          variant="default"
          className="flex-row p-3 items-center gap-2.5 border-t border-separator"
        >
          {/* Botón de Micrófono Rápido (presionar para grabar o abrir Live Voice) */}
          <Pressable
            className={`w-[48px] h-[48px] rounded-full justify-center items-center shadow-sm ${
              isRecording ? 'bg-danger' : loading ? 'bg-muted' : 'bg-surface-secondary'
            }`}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            onLongPress={startRecording}
            delayLongPress={200}
            disabled={loading}
            accessibilityLabel="Grabar nota de voz"
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={24}
              color={isRecording ? 'white' : accent}
            />
          </Pressable>

          {/* Campo de Texto con HeroUI */}
          <TextField className="flex-1 bg-surface-secondary rounded-2xl px-4 border-0">
            <Input
              placeholder="Escribe un mensaje a Panda..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={600}
              className="py-2.5 text-[15px] text-foreground max-h-[100px]"
            />
          </TextField>

          {/* Botón de Enviar */}
          <Pressable
            className={`w-[48px] h-[48px] rounded-full justify-center items-center ${
              !inputText.trim() || loading ? 'bg-default opacity-60' : 'bg-accent shadow-sm'
            }`}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || loading}
            accessibilityLabel="Enviar mensaje"
          >
            <Ionicons name="send" size={20} color="white" />
          </Pressable>
        </Surface>
      </KeyboardAvoidingView>

      {/* ── MODAL / VISTA DE VOZ EN VIVO (Gemini Live / ChatGPT Voice Mode) ── */}
      <LiveVoiceView
        visible={liveVoiceVisible}
        toyName={toyName}
        avatarUrl={avatarUrl}
        voiceState={voiceState}
        selectedVoice={selectedVoice}
        onSelectVoice={(vId) => setSelectedVoice(vId)}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onInterrupt={handleInterrupt}
        onClose={() => {
          stopAudio();
          setLiveVoiceVisible(false);
          setVoiceState('idle');
        }}
        onSwitchToText={() => {
          stopAudio();
          setLiveVoiceVisible(false);
          setVoiceState('idle');
        }}
        lastUserText={lastUserText}
        lastBotText={lastBotText}
        isRecording={isRecording}
        isLoading={loading}
      />

      {/* ── Modal Selector de Voz (Para modo texto) ── */}
      <Modal visible={showVoiceModal} animationType="slide" transparent>
        <View style={styles.sheetBackdrop}>
          <Surface variant="default" className="rounded-t-3xl px-5 pt-5 pb-10 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Label className="text-lg font-bold text-foreground">Voz de {toyName}</Label>
                <Label className="text-xs text-muted mt-0.5">
                  Elige la personalidad de voz generada con IA
                </Label>
              </View>
              <Pressable onPress={() => setShowVoiceModal(false)} className="p-1">
                <Ionicons name="close" size={24} color={accent} />
              </Pressable>
            </View>

            <ScrollView className="mb-2">
              {VOICE_OPTIONS.map((v) => {
                const isSelected = selectedVoice === v.id;
                return (
                  <Pressable
                    key={v.id}
                    className={`flex-row items-center p-3.5 rounded-2xl mb-2.5 ${
                      isSelected
                        ? 'bg-accent/10 border border-accent'
                        : 'bg-surface-secondary border border-transparent'
                    }`}
                    onPress={() => {
                      setSelectedVoice(v.id);
                      setShowVoiceModal(false);
                    }}
                  >
                    <View
                      className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${
                        isSelected ? 'bg-accent' : 'bg-surface'
                      }`}
                    >
                      <Ionicons
                        name={v.icon as any}
                        size={20}
                        color={isSelected ? 'white' : accent}
                      />
                    </View>
                    <View className="flex-1">
                      <Label
                        className={`text-[15px] font-bold ${
                          isSelected ? 'text-accent' : 'text-foreground'
                        }`}
                      >
                        {v.name}
                      </Label>
                      <Label className="text-xs text-muted mt-0.5">{v.desc}</Label>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={accent} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Surface>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
});
