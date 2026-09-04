import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Chip, Label, Button } from 'heroui-native';
import { VoiceOrb, VoiceState } from './VoiceOrb';

const { width, height } = Dimensions.get('window');

export interface CharacterVoice {
  id: string;
  name: string;
  icon: string;
  desc: string;
  color: string;
}

export const VOICE_OPTIONS: CharacterVoice[] = [
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella (Panda Dulce)',
    icon: 'paw',
    desc: 'Voz tierna e infantil, ideal para niños pequeños',
    color: '#E8533F',
  },
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel (Amiga Panda)',
    icon: 'moon',
    desc: 'Voz calmada y suave para cuentos de buenas noches',
    color: '#8B5CF6',
  },
  {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'Giovanni (Explorador)',
    icon: 'compass',
    desc: 'Voz animada y entusiasta para aventuras',
    color: '#10B981',
  },
  {
    id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie (Divertido)',
    icon: 'school',
    desc: 'Voz juvenil amigable para juegos y curiosidades',
    color: '#F59E0B',
  },
];

interface LiveVoiceViewProps {
  visible: boolean;
  toyName?: string;
  avatarUrl?: string;
  voiceState: VoiceState;
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onInterrupt: () => void;
  onClose: () => void;
  onSwitchToText: () => void;
  lastUserText?: string;
  lastBotText?: string;
  isRecording: boolean;
  isLoading: boolean;
}

export const LiveVoiceView: React.FC<LiveVoiceViewProps> = ({
  visible,
  toyName = 'Panda',
  avatarUrl,
  voiceState,
  selectedVoice,
  onSelectVoice,
  onStartRecording,
  onStopRecording,
  onInterrupt,
  onClose,
  onSwitchToText,
  lastUserText,
  lastBotText,
  isRecording,
  isLoading,
}) => {
  const [showVoiceSheet, setShowVoiceSheet] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  // Soundwave bars animation for speaking/listening
  const wave1 = useRef(new Animated.Value(6)).current;
  const wave2 = useRef(new Animated.Value(14)).current;
  const wave3 = useRef(new Animated.Value(8)).current;
  const wave4 = useRef(new Animated.Value(18)).current;
  const wave5 = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (voiceState === 'listening' || voiceState === 'speaking') {
      const createBarAnim = (val: Animated.Value, minH: number, maxH: number, dur: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: maxH, duration: dur, useNativeDriver: false }),
            Animated.timing(val, { toValue: minH, duration: dur, useNativeDriver: false }),
          ])
        );
      };

      animLoop = Animated.parallel([
        createBarAnim(wave1, 4, 22, 220),
        createBarAnim(wave2, 6, 28, 280),
        createBarAnim(wave3, 8, 34, 190),
        createBarAnim(wave4, 6, 26, 250),
        createBarAnim(wave5, 4, 20, 210),
      ]);
      animLoop.start();
    } else {
      wave1.setValue(6);
      wave2.setValue(10);
      wave3.setValue(8);
      wave4.setValue(10);
      wave5.setValue(6);
    }
    return () => {
      animLoop?.stop();
    };
  }, [voiceState]);

  if (!visible) return null;

  const currentVoice = VOICE_OPTIONS.find((v) => v.id === selectedVoice) || VOICE_OPTIONS[0];

  // Informative subtitle depending on state
  const getStateInfo = () => {
    switch (voiceState) {
      case 'listening':
        return {
          title: 'Escuchándote...',
          hint: 'Habla con naturalidad, suelta o toca para enviar',
          color: '#10B981',
          badgeText: 'EN VIVO · ESCUCHANDO',
          badgeColor: 'success' as const,
        };
      case 'thinking':
        return {
          title: 'Pensando...',
          hint: 'Panda está preparando su respuesta',
          color: '#8B5CF6',
          badgeText: 'PENSANDO',
          badgeColor: 'accent' as const,
        };
      case 'speaking':
        return {
          title: `${toyName} está hablando`,
          hint: 'Toca "Interrumpir" para pausar en cualquier momento',
          color: '#F59E0B',
          badgeText: 'EN VIVO · HABLANDO',
          badgeColor: 'warning' as const,
        };
      default:
        return {
          title: 'Listo para hablar',
          hint: 'Mantén presionado el micrófono o toca para hablar',
          color: '#E8533F',
          badgeText: 'EN VIVO · LISTO',
          badgeColor: 'accent' as const,
        };
    }
  };

  const stateInfo = getStateInfo();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Background ambient gradient glow */}
        <View style={styles.backgroundGlowTop} />
        <View style={styles.backgroundGlowCenter} />

        {/* ── Top Bar (Gemini / ChatGPT Header) ── */}
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={styles.iconButton}
            accessibilityLabel="Cerrar modo de voz"
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <View style={styles.headerToyRow}>
              <Avatar size="sm" color="accent" style={styles.headerAvatar}>
                {avatarUrl ? (
                  <Avatar.Image source={{ uri: avatarUrl }} />
                ) : (
                  <Avatar.Fallback>
                    <Label className="text-white font-bold text-xs">{toyName[0]}</Label>
                  </Avatar.Fallback>
                )}
              </Avatar>
              <Label className="text-white font-bold text-base ml-2">{toyName}</Label>
            </View>
            <View style={styles.headerStatusBadge}>
              <View style={[styles.statusDot, { backgroundColor: stateInfo.color }]} />
              <Label className="text-white/70 text-[11px] font-semibold">
                {stateInfo.badgeText}
              </Label>
            </View>
          </View>

          {/* Voice Personality Selector Button */}
          <Pressable
            onPress={() => setShowVoiceSheet(true)}
            style={styles.voicePickerTrigger}
            accessibilityLabel="Cambiar voz de Panda"
          >
            <Ionicons name="sparkles" size={16} color="#FBBF24" />
            <Label className="text-white text-xs font-semibold ml-1">
              {currentVoice.name.split(' ')[0]}
            </Label>
            <Ionicons name="chevron-down" size={14} color="#94A3B8" style={{ marginLeft: 2 }} />
          </Pressable>
        </View>

        {/* ── Center Stage: Voice Orb & Dynamic Visualizer ── */}
        <View style={styles.orbStage}>
          <VoiceOrb
            state={voiceState}
            size={Math.min(width * 0.58, 230)}
            onPress={() => {
              if (voiceState === 'speaking') {
                onInterrupt();
              } else if (voiceState === 'idle') {
                onStartRecording();
              } else if (voiceState === 'listening') {
                onStopRecording();
              }
            }}
          />

          {/* Soundwave equalizer bars indicator */}
          <View style={styles.soundBarsContainer}>
            <Animated.View style={[styles.soundBar, { height: wave1, backgroundColor: stateInfo.color }]} />
            <Animated.View style={[styles.soundBar, { height: wave2, backgroundColor: stateInfo.color }]} />
            <Animated.View style={[styles.soundBar, { height: wave3, backgroundColor: stateInfo.color }]} />
            <Animated.View style={[styles.soundBar, { height: wave4, backgroundColor: stateInfo.color }]} />
            <Animated.View style={[styles.soundBar, { height: wave5, backgroundColor: stateInfo.color }]} />
          </View>

          {/* State Text & Hint */}
          <Label className="text-white text-xl font-extrabold mt-3 text-center">
            {stateInfo.title}
          </Label>
          <Label className="text-white/60 text-xs text-center mt-1 px-8 max-w-sm">
            {stateInfo.hint}
          </Label>
        </View>

        {/* ── Floating Live Subtitle / Transcript Card (ChatGPT / Gemini style) ── */}
        {showTranscript && (lastUserText || lastBotText) && (
          <View style={styles.transcriptCard}>
            <ScrollView
              style={{ maxHeight: 110 }}
              showsVerticalScrollIndicator={false}
            >
              {lastUserText ? (
                <View style={styles.transcriptRow}>
                  <Label className="text-white/50 text-[11px] font-bold mr-1">Tú:</Label>
                  <Text className="text-white/90 text-[13px] flex-1 font-medium" numberOfLines={2}>
                    "{lastUserText}"
                  </Text>
                </View>
              ) : null}

              {lastBotText ? (
                <View style={[styles.transcriptRow, { marginTop: 4 }]}>
                  <Label className="text-[#38BDF8] text-[11px] font-bold mr-1">Panda:</Label>
                  <Text className="text-white/95 text-[13px] flex-1 font-medium" numberOfLines={3}>
                    {lastBotText}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        )}

        {/* ── Bottom Controls Dock (ChatGPT / Gemini Live Toolbar) ── */}
        <View style={styles.dock}>
          {/* Switch to Text Chat Button */}
          <Pressable
            onPress={onSwitchToText}
            style={styles.dockSecondaryButton}
            accessibilityLabel="Alternar al chat de texto"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FFFFFF" />
            <Label className="text-white/70 text-[10px] font-semibold mt-1">Texto</Label>
          </Pressable>

          {/* Center: Main Mic Action Button */}
          <View style={styles.micButtonWrapper}>
            <Pressable
              onPressIn={() => {
                if (!isLoading && voiceState === 'idle') {
                  onStartRecording();
                }
              }}
              onPressOut={() => {
                if (isRecording) {
                  onStopRecording();
                }
              }}
              onPress={() => {
                // If tapped instead of held
                if (isRecording) {
                  onStopRecording();
                } else if (voiceState === 'idle' && !isLoading) {
                  onStartRecording();
                }
              }}
              disabled={isLoading}
              style={[
                styles.micMainButton,
                {
                  backgroundColor: isRecording
                    ? '#EF4444'
                    : isLoading
                    ? '#475569'
                    : '#E8533F',
                  shadowColor: isRecording ? '#EF4444' : '#E8533F',
                },
              ]}
              accessibilityLabel={isRecording ? 'Detener grabación' : 'Iniciar grabación de voz'}
            >
              <Ionicons
                name={isRecording ? 'stop' : isLoading ? 'hourglass-outline' : 'mic'}
                size={32}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          {/* Interrupt / Mute Panda or Close Call */}
          {voiceState === 'speaking' ? (
            <Pressable
              onPress={onInterrupt}
              style={[styles.dockSecondaryButton, { backgroundColor: 'rgba(239, 68, 68, 0.25)' }]}
              accessibilityLabel="Interrumpir a Panda"
            >
              <Ionicons name="pause" size={22} color="#EF4444" />
              <Label className="text-red-400 text-[10px] font-bold mt-1">Pausar</Label>
            </Pressable>
          ) : (
            <Pressable
              onPress={onClose}
              style={styles.dockSecondaryButton}
              accessibilityLabel="Finalizar llamada"
            >
              <Ionicons name="call" size={22} color="#EF4444" style={{ transform: [{ rotate: '135deg' }] }} />
              <Label className="text-red-400 text-[10px] font-semibold mt-1">Salir</Label>
            </Pressable>
          )}
        </View>

        {/* ── Voice Personality Selection Sheet / Modal ── */}
        <Modal visible={showVoiceSheet} animationType="slide" transparent>
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheetContent}>
              <View style={styles.sheetHeader}>
                <View>
                  <Label className="text-white text-lg font-bold">Voces de Panda</Label>
                  <Label className="text-white/60 text-xs">Selecciona la voz con IA de ElevenLabs</Label>
                </View>
                <Pressable onPress={() => setShowVoiceSheet(false)} style={styles.iconButton}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 350 }}>
                {VOICE_OPTIONS.map((v) => {
                  const isSelected = selectedVoice === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => {
                        onSelectVoice(v.id);
                        setShowVoiceSheet(false);
                      }}
                      style={[
                        styles.voiceOptionCard,
                        isSelected && { borderColor: v.color, backgroundColor: `${v.color}15` },
                      ]}
                    >
                      <View style={[styles.voiceOptionIcon, { backgroundColor: `${v.color}25` }]}>
                        <Ionicons name={v.icon as any} size={22} color={v.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Label className="text-white font-bold text-sm">{v.name}</Label>
                        <Label className="text-white/60 text-xs mt-0.5">{v.desc}</Label>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color={v.color} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'space-between',
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -100,
    left: width * 0.1,
    width: width * 0.8,
    height: 250,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(232, 83, 63, 0.12)',
  },
  backgroundGlowCenter: {
    position: 'absolute',
    top: height * 0.28,
    left: width * 0.15,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 46,
    paddingBottom: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerToyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  voicePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  orbStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  soundBarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    gap: 5,
    marginTop: 18,
  },
  soundBar: {
    width: 4,
    borderRadius: 2,
  },
  transcriptCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  transcriptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: 12,
  },
  dockSecondaryButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micMainButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#171B26',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  voiceOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#1D2230',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  voiceOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});
