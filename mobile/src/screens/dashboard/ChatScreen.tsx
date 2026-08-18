import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { toyService } from '../../services/api';
import { playAudio, stopAudio } from '../../services/audioService';
import { Card, Button, Label, TextField, Input, Spinner, useThemeColor, Avatar } from 'heroui-native';

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

  const [primary, success, danger, muted, background, surface] = useThemeColor([
    'accent',
    'success',
    'danger',
    'muted',
    'background',
    'surface',
  ]);

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

  const startRecording = async () => {
    if (isProcessingRef.current || loading || isRecording) return;
    try {
      await stopAudio();
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Se requiere acceso al micrófono para hablar con Panda.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsRecording(false);
    setLoading(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });

      if (!uri || !toyId) {
        isProcessingRef.current = false;
        setLoading(false);
        return;
      }

      const res = await toyService.voiceChatWithAudio(toyId, uri, selectedVoice);

      if (res.data.success && res.data.data) {
        const userText = res.data.data.userText || '🎙️ Mensaje de voz';
        const replyText = res.data.data.replyText || '¡Hola!';
        const audioUrl = res.data.data.audioUrl;

        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), text: userText, isUser: true, timestamp: new Date() },
          { id: (Date.now() + 1).toString(), text: replyText, isUser: false, timestamp: new Date(), audioUrl },
        ]);

        if (audioUrl) await playAudio(audioUrl);
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
    const userMsg: Message = { id: Date.now().toString(), text, isUser: true, timestamp: new Date() };
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

      if (audioUrl) await playAudio(audioUrl);
    } catch (error) {
      console.error('Error en chat:', error);
    } finally {
      isProcessingRef.current = false;
      setLoading(false);
    }
  };

  const currentVoiceObj = VOICE_OPTIONS.find((v) => v.id === selectedVoice) || VOICE_OPTIONS[0];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-3 bg-surface border-b border-separator shadow-sm z-10">
        <Pressable onPress={() => navigation.goBack()} className="p-1 mr-2">
          <Ionicons name="arrow-back" size={26} color={primary} />
        </Pressable>
        <View className="mr-3">
          <Avatar size="md" className="w-[44px] h-[44px] rounded-full">
            <Avatar.Image source={{ uri: avatarUrl || 'https://image.pollinations.ai/prompt/cute%20panda%20toy?width=100&height=100' }} />
            <Avatar.Fallback>{toyName ? toyName[0] : 'P'}</Avatar.Fallback>
          </Avatar>
        </View>
        <View className="flex-1">
          <Label className="text-base font-bold text-foreground">{toyName || 'Panda Inteligente'}</Label>
          <Label className="text-xs font-semibold text-success mt-0.5">🟢 {currentVoiceObj.name.split(' ')[0]}</Label>
        </View>

        <Pressable className="p-1.5 mr-1" onPress={() => setShowVoiceModal(true)}>
          <Ionicons name="mic-circle" size={28} color={primary} />
        </Pressable>

        <Pressable
          className={`p-2 rounded-full ${voiceMode ? 'bg-accent' : 'bg-surface'}`}
          onPress={() => setVoiceMode(!voiceMode)}
        >
          <Ionicons name="volume-medium" size={20} color={voiceMode ? 'white' : muted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View key={msg.id} className={`flex-row items-end mb-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              {!msg.isUser && (
                <View className="mr-2 mb-1">
                  <Avatar size="sm" className="w-8 h-8 rounded-full">
                    <Avatar.Image source={{ uri: avatarUrl || 'https://image.pollinations.ai/prompt/cute%20panda%20toy?width=100&height=100' }} />
                  </Avatar>
                </View>
              )}
              <View
                className={`max-w-[78%] p-3.5 rounded-2xl ${msg.isUser ? 'bg-accent rounded-br-sm' : 'bg-surface rounded-bl-sm shadow-sm'}`}
              >
                <Label className={`text-[15px] leading-5 ${msg.isUser ? 'text-white' : 'text-foreground'}`}>
                  {msg.text}
                </Label>
                {msg.audioUrl && (
                  <Pressable
                    className="flex-row items-center bg-success/15 px-3 py-1.5 rounded-full mt-2 self-start gap-1.5"
                    onPress={() => msg.audioUrl && playAudio(msg.audioUrl)}
                  >
                    <Ionicons name="play-circle" size={20} color={success} />
                    <Label className="text-xs font-bold text-success">Escuchar</Label>
                  </Pressable>
                )}
                <Label className={`text-[10px] mt-1.5 self-end ${msg.isUser ? 'text-white/70' : 'text-muted'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Label>
              </View>
            </View>
          ))}

          {isRecording && (
            <View className="flex-row items-center justify-center bg-danger/10 p-3 rounded-2xl mb-3 gap-2">
              <Ionicons name="mic-sharp" size={24} color={danger} />
              <Label className="font-bold text-danger text-sm">🎙️ Grabando... suelta para enviar</Label>
            </View>
          )}

          {loading && (
            <View className="flex-row items-end mb-3 justify-start">
              <View className="max-w-[78%] p-3.5 bg-surface rounded-2xl rounded-bl-sm shadow-sm flex-row items-center gap-2">
                <Spinner size="sm" color="accent" />
                <Label className="text-[13px] text-muted">Procesando respuesta...</Label>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View className="flex-row p-3 bg-surface border-t border-separator items-center gap-2.5">
          <Pressable
            className={`w-[52px] h-[52px] rounded-full justify-center items-center ${loading ? 'bg-muted' : isRecording ? 'bg-danger' : 'bg-success'}`}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={loading}
          >
            <Ionicons name={isRecording ? "stop-circle" : "mic"} size={26} color="white" />
          </Pressable>

          <TextField className="flex-1 bg-surface-secondary rounded-2xl px-4 max-h-[100px] border-0">
            <Input
              placeholder="Habla o escribe aquí..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              className="py-2 text-[15px]"
            />
          </TextField>

          <Pressable
            className={`w-[44px] h-[44px] rounded-full justify-center items-center ${(!inputText.trim() || loading) ? 'bg-default' : 'bg-accent'}`}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="send" size={20} color="white" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showVoiceModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface rounded-t-3xl px-5 pt-5 pb-10 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Label className="text-lg font-bold text-foreground">Elige la Voz de Panda</Label>
              </View>
              <Pressable onPress={() => setShowVoiceModal(false)} className="p-1">
                <Ionicons name="close" size={26} color={primary} />
              </Pressable>
            </View>

            <ScrollView className="mb-2">
              {VOICE_OPTIONS.map((v) => (
                <Pressable
                  key={v.id}
                  className={`flex-row items-center p-3.5 rounded-2xl mb-2.5 ${selectedVoice === v.id ? 'bg-accent/10 border border-accent' : 'bg-surface-secondary'}`}
                  onPress={() => {
                    setSelectedVoice(v.id);
                    setShowVoiceModal(false);
                  }}
                >
                  <View className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${selectedVoice === v.id ? 'bg-accent' : 'bg-accent/10'}`}>
                    <Ionicons name={v.icon as any} size={22} color={selectedVoice === v.id ? 'white' : primary} />
                  </View>
                  <View className="flex-1">
                    <Label className={`text-[15px] font-bold ${selectedVoice === v.id ? 'text-accent' : 'text-foreground'}`}>{v.name}</Label>
                    <Label className="text-xs text-muted mt-0.5">{v.desc}</Label>
                  </View>
                  {selectedVoice === v.id && <Ionicons name="checkmark-circle" size={24} color={primary} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}