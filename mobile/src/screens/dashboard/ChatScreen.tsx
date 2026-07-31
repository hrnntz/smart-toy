// src/screens/dashboard/ChatScreen.tsx
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toyService } from '../../services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen({ navigation, route }: any) {
  const { toyId, toyName, avatarUrl } = route.params || {};
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Cargar mensajes guardados al abrir la pantalla
  useEffect(() => {
    if (toyId) {
      loadMessages();
    }
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
        // Si no hay mensajes, agregar bienvenida
        if (msgs.length === 0 && toyName) {
          setMessages([
            {
              id: 'welcome',
              text: `¡Hola! Soy ${toyName}, tu amigo inteligente. ¿En qué puedo ayudarte hoy? 🧸`,
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

  const sendMessage = async () => {
    if (!inputText.trim() || !toyId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // 1. Guardar mensaje del usuario
      await toyService.saveMessage(toyId, userMsg.text, true);

      // 2. Obtener respuesta de la IA
      const response = await toyService.chatWithToy(toyId, userMsg.text);
      const replyText = response.data?.data?.reply || response.data?.reply || 'No pude entender eso, ¿puedes repetirlo?';

      // 3. Guardar respuesta del bot
      await toyService.saveMessage(toyId, replyText, false);

      // 4. Agregar al estado
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Error en chat:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          text: '❌ Hubo un error al procesar tu mensaje. Intenta de nuevo.',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat con {toyName || 'Juguete'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.messageRow, msg.isUser ? styles.userRow : styles.botRow]}>
            {!msg.isUser && avatarUrl && (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            )}
            <View style={[styles.messageBubble, msg.isUser ? styles.userBubble : styles.botBubble]}>
              <Text style={msg.isUser ? styles.userText : styles.botText}>{msg.text}</Text>
              <Text style={styles.timestamp}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={[styles.messageRow, styles.botRow]}>
            <View style={[styles.messageBubble, styles.botBubble]}>
              <ActivityIndicator size="small" color="#4A90D9" />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    borderBottomColor: '#E0E0E0',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', flex: 1, textAlign: 'center' },
  messagesContainer: { flex: 1, paddingHorizontal: 16 },
  messagesContent: { paddingVertical: 16 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8, backgroundColor: '#F0F0F0' },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  userBubble: { backgroundColor: '#4A90D9' },
  botBubble: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E0E0E0' },
  userText: { color: 'white', fontSize: 16 },
  botText: { color: '#2C3E50', fontSize: 16 },
  timestamp: { fontSize: 10, color: '#999', marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: { backgroundColor: '#4A90D9', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#CCC' },
});