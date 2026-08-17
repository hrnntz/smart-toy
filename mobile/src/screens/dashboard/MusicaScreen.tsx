import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Pressable,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { musicService } from '../../services/api';
import { playAudio, pauseAudio, resumeAudio, stopAudio } from '../../services/audioService';
import { Card, Button, Label, Spinner, useThemeColor, TextField, Input } from 'heroui-native';

type TabType = 'Música' | 'Sonidos' | 'Favoritos' | 'IA Generador';

interface Track {
  id: number;
  title: string;
  duration: string;
  icon: string;
  color: string;
  type: 'Música' | 'Sonidos';
  uri: string;
}

const DEFAULT_TRACKS: Track[] = [
  { id: 1, title: 'Caja de Música de Cuna Real', duration: '30 min', icon: 'heart', color: '#EF4444', type: 'Música', uri: 'https://cdn.freesound.org/previews/462/462092_9159316-lq.mp3' },
  { id: 2, title: 'Piano Suave para Bebés y Cuna', duration: '45 min', icon: 'musical-note', color: '#10B981', type: 'Música', uri: 'https://cdn.freesound.org/previews/518/518888_11306353-lq.mp3' },
  { id: 3, title: 'Kalimba y Nanas de Panda', duration: '25 min', icon: 'sparkles', color: '#F59E0B', type: 'Música', uri: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba-Lullaby-Sound.mp3' },
  { id: 4, title: 'Sonido de Lluvia Relajante Real', duration: '60 min', icon: 'leaf', color: '#06B6D4', type: 'Sonidos', uri: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
  { id: 5, title: 'Olas del Mar Pacíficas Reales', duration: '45 min', icon: 'water', color: '#3B82F6', type: 'Sonidos', uri: 'https://actions.google.com/sounds/v1/water/ocean_waves.ogg' },
  { id: 6, title: 'Bosque Silencioso y Pájaros', duration: '40 min', icon: 'planet', color: '#10B981', type: 'Sonidos', uri: 'https://actions.google.com/sounds/v1/ambiences/outdoor_forest.ogg' },
  { id: 7, title: 'Ruido Blanco Puro para Sueño', duration: '30 min', icon: 'moon', color: '#8B5CF6', type: 'Sonidos', uri: 'https://actions.google.com/sounds/v1/ambiences/white_noise.ogg' },
  { id: 8, title: 'Viento Suave Nocturno', duration: '35 min', icon: 'cloudy-night', color: '#9CA3AF', type: 'Sonidos', uri: 'https://actions.google.com/sounds/v1/weather/wind_synthetic.ogg' },
];

const FAVORITES_KEY = 'musica_favoritos';

const TABS: TabType[] = ['Música', 'Sonidos', 'Favoritos', 'IA Generador'];

const TAB_ICONS: Record<TabType, string> = {
  'Música': 'musical-notes',
  'Sonidos': 'leaf',
  'Favoritos': 'heart',
  'IA Generador': 'sparkles',
};

export default function MusicaScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Música');
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingMusic, setGeneratingMusic] = useState(false);

  const [accent, muted, surface, success, surfaceSecondary] = useThemeColor([
    'accent',
    'muted',
    'surface',
    'success',
    'surface-secondary',
  ]);

  useEffect(() => {
    loadFavorites();
    return () => {
      stopAudio();
    };
  }, []);

  const loadFavorites = async () => {
    try {
      const saved = await storage.getItem(FAVORITES_KEY);
      if (saved) setFavorites(JSON.parse(saved));
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    }
  };

  const saveFavorites = async (newFavs: number[]) => {
    try {
      await storage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
    } catch (error) {
      console.error('Error guardando favoritos:', error);
    }
  };

  const generateAIMusic = async (presetPrompt?: string) => {
    const promptToUse = presetPrompt || aiPrompt.trim();
    if (!promptToUse) return;

    setGeneratingMusic(true);
    try {
      const res = await musicService.generateMusic(promptToUse);
      if (res.data.success && res.data.data) {
        const newTrack: Track = {
          id: Date.now(),
          title: res.data.data.title,
          duration: res.data.data.duration || '15 min',
          icon: 'sparkles',
          color: '#10B981',
          type: 'Música',
          uri: res.data.data.uri,
        };
        setTracks((prev) => [newTrack, ...prev]);
        setAiPrompt('');
        Alert.alert('¡Música Generada!', `Se ha creado "${newTrack.title}". ¡Presiona Play!`);
        togglePlay(newTrack);
        setActiveTab('Música');
      }
    } catch (error) {
      console.error('Error generando música:', error);
      Alert.alert('Error', 'No se pudo generar la música con IA.');
    } finally {
      setGeneratingMusic(false);
    }
  };

  const togglePlay = async (track: Track) => {
    if (playingId === track.id) {
      if (isPaused) {
        await resumeAudio();
        setIsPaused(false);
      } else {
        await pauseAudio();
        setIsPaused(true);
      }
    } else {
      setPlayingId(track.id);
      setIsPaused(false);
      const ok = await playAudio(track.uri, (status) => {
        if (status.didJustFinish) {
          setPlayingId(null);
          setIsPaused(false);
        }
      });
      if (!ok) {
        Alert.alert('Error', 'No se pudo reproducir el audio.');
        setPlayingId(null);
        setIsPaused(false);
      }
    }
  };

  const toggleFavorite = (id: number) => {
    const newFavs = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(newFavs);
    saveFavorites(newFavs);
  };

  const tracksToShow = activeTab === 'Favoritos'
    ? tracks.filter((t) => favorites.includes(t.id))
    : activeTab === 'Música'
    ? tracks.filter((t) => t.type === 'Música')
    : activeTab === 'Sonidos'
    ? tracks.filter((t) => t.type === 'Sonidos')
    : tracks;

  const currentlyPlaying = tracks.find((t) => t.id === playingId);

  return (
    <View className="flex-1 bg-background">
      {/* ── Header ── */}
      <View className="px-4 pt-14 pb-4">
        <Label className="text-2xl font-extrabold text-foreground">Música & Sonidos</Label>
        <Label className="text-sm text-muted mt-0.5">Nanas y sonidos relajantes con IA</Label>
      </View>

      {/* ── Tab Selector ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4 max-h-12"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-full"
              style={{
                backgroundColor: isActive ? '#10B981' + '20' : surfaceSecondary,
                borderWidth: isActive ? 1.5 : 0,
                borderColor: isActive ? '#10B981' : 'transparent',
              }}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons
                name={TAB_ICONS[tab] as any}
                size={14}
                color={isActive ? '#10B981' : muted}
              />
              <Label
                className="text-xs font-bold"
                style={{ color: isActive ? '#10B981' : muted } as any}
              >
                {tab}
              </Label>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        {/* ── IA Generator Section ── */}
        {activeTab === 'IA Generador' && (
          <Card variant="default" className="mb-5">
            <Card.Body>
              <View className="flex-row items-center gap-2 mb-3">
                <View className="w-9 h-9 rounded-full bg-success/15 items-center justify-center">
                  <Ionicons name="sparkles" size={18} color="#10B981" />
                </View>
                <View>
                  <Label className="text-base font-bold text-foreground">Generador de Nanas IA</Label>
                  <Label className="text-xs text-muted">Powered by Groq AI</Label>
                </View>
              </View>

              <TextField className="w-full mb-3">
                <Input
                  placeholder="Ej: Canción de cuna suave con piano y lluvia..."
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                />
              </TextField>

              <Button
                variant="primary"
                feedbackVariant="scale-ripple"
                onPress={() => generateAIMusic()}
                isDisabled={!aiPrompt.trim() || generatingMusic}
                className="w-full mb-4"
                style={{ backgroundColor: '#10B981' } as any}
              >
                {generatingMusic
                  ? <Spinner size="sm" color="default" />
                  : <Button.Label>✨ Generar Música con IA</Button.Label>
                }
              </Button>

              <Label className="text-xs font-bold text-muted mb-2">Prompts sugeridos:</Label>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                  'Arpa relajante para dormir',
                  'Lluvia suave en el bosque',
                  'Sonidos del espacio',
                  'Piano suave de cuna',
                  'Olas del mar tranquilo',
                ].map((p) => (
                  <Pressable
                    key={p}
                    className="mr-2 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: '#10B981' + '15' }}
                    onPress={() => generateAIMusic(p)}
                  >
                    <Label className="text-xs font-semibold" style={{ color: '#10B981' } as any}>
                      ✨ {p}
                    </Label>
                  </Pressable>
                ))}
              </ScrollView>
            </Card.Body>
          </Card>
        )}

        {/* ── Track List ── */}
        {tracksToShow.length === 0 ? (
          <View className="items-center mt-16 mb-8">
            <View className="w-20 h-20 rounded-full bg-surface-secondary items-center justify-center mb-4">
              <Ionicons name="musical-note-outline" size={36} color={muted} />
            </View>
            <Label className="text-base font-bold text-foreground mb-1">
              {activeTab === 'Favoritos' ? 'Sin favoritos' : 'Sin pistas'}
            </Label>
            <Label className="text-sm text-muted text-center px-8">
              {activeTab === 'Favoritos'
                ? 'Toca el corazón en una pista para guardarla aquí.'
                : 'No hay pistas disponibles en esta categoría.'}
            </Label>
          </View>
        ) : (
          tracksToShow.map((track) => {
            const isPlaying = playingId === track.id;
            const isThisPaused = isPlaying && isPaused;
            return (
              <Pressable key={track.id} onPress={() => togglePlay(track)}>
                <Card
                  variant="default"
                  className="mb-2.5"
                  style={isPlaying ? { borderWidth: 1.5, borderColor: track.color + '60' } as any : undefined}
                >
                  <Card.Body>
                    <View className="flex-row items-center gap-3.5">
                      {/* Icon */}
                      <View
                        className="w-12 h-12 rounded-2xl items-center justify-center"
                        style={{ backgroundColor: track.color + '20' }}
                      >
                        <Ionicons
                          name={isPlaying && !isThisPaused ? 'pause' : (track.icon as any)}
                          size={22}
                          color={track.color}
                        />
                      </View>

                      {/* Info */}
                      <View className="flex-1">
                        <Text
                          className="text-[15px] font-bold text-foreground"
                          numberOfLines={1}
                          style={{ fontSize: 15, fontWeight: 'bold', color: '#101218' }}
                        >
                          {track.title}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-0.5">
                          <Label className="text-xs text-muted">⏱ {track.duration}</Label>
                          {isPlaying && (
                            <View
                              className="px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: track.color + '20' }}
                            >
                              <Label className="text-[10px] font-bold" style={{ color: track.color } as any}>
                                {isThisPaused ? '⏸ Pausado' : '▶ Reproduciendo'}
                              </Label>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Favorite */}
                      <Pressable
                        className="p-2"
                        onPress={(e) => {
                          e.stopPropagation?.();
                          toggleFavorite(track.id);
                        }}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={favorites.includes(track.id) ? 'heart' : 'heart-outline'}
                          size={22}
                          color={favorites.includes(track.id) ? '#EF4444' : muted}
                        />
                      </Pressable>
                    </View>
                  </Card.Body>
                </Card>
              </Pressable>
            );
          })
        )}

        <View className="h-8" />
      </ScrollView>

      {/* ── Mini Player Bar ── */}
      {playingId !== null && currentlyPlaying && (
        <View
          className="mx-4 mb-4 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: currentlyPlaying.color + '15',
            borderWidth: 1,
            borderColor: currentlyPlaying.color + '40',
          }}
        >
          <Pressable
            className="flex-row items-center px-4 py-3 gap-3"
            onPress={() => togglePlay(currentlyPlaying)}
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: currentlyPlaying.color + '25' }}
            >
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={18}
                color={currentlyPlaying.color}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-sm font-bold text-foreground"
                numberOfLines={1}
                style={{ fontSize: 14, fontWeight: 'bold', color: '#101218' }}
              >
                {currentlyPlaying.title}
              </Text>
              <Label className="text-xs" style={{ color: currentlyPlaying.color } as any}>
                {isPaused ? 'Pausado' : '▶ Reproduciendo'}
              </Label>
            </View>
            <Pressable
              onPress={() => {
                stopAudio();
                setPlayingId(null);
                setIsPaused(false);
              }}
              hitSlop={8}
            >
              <Ionicons name="stop-circle-outline" size={24} color={muted} />
            </Pressable>
          </Pressable>
        </View>
      )}
    </View>
  );
}