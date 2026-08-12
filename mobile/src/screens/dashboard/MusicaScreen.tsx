import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { musicService } from '../../services/api';
import { playAudio, pauseAudio, resumeAudio, stopAudio } from '../../services/audioService';
import { Card, Button, Label, Spinner, useThemeColor, TextField, Input } from 'heroui-native';

type TabType = 'Musica' | 'Sonidos' | 'Favoritos' | 'IA Generador';

interface Track {
  id: number;
  title: string;
  duration: string;
  icon: string;
  color: string;
  type: 'Musica' | 'Sonidos';
  uri: string;
}

const DEFAULT_TRACKS: Track[] = [
  { id: 1, title: 'Caja de Música de Cuna Real', duration: '30 min', icon: 'heart', color: '#EF4444', type: 'Musica', uri: 'https://cdn.freesound.org/previews/462/462092_9159316-lq.mp3' },
  { id: 2, title: 'Piano Suave para Bebés y Cuna', duration: '45 min', icon: 'musical-note', color: '#10B981', type: 'Musica', uri: 'https://cdn.freesound.org/previews/518/518888_11306353-lq.mp3' },
  { id: 3, title: 'Kalimba y Nanas de Panda', duration: '25 min', icon: 'sparkles', color: '#F59E0B', type: 'Musica', uri: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba-Lullaby-Sound.mp3' },
  { id: 4, title: 'Sonido de Lluvia Relajante Real', duration: '60 min', icon: 'leaf', color: '#06B6D4', type: 'Sonidos', uri: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
  { id: 5, title: 'Olas del Mar Pacíficas Reales', duration: '45 min', icon: 'water', color: '#3B82F6', type: 'Sonidos', uri: 'https://actions.google.com/sounds/v1/water/ocean_waves.ogg' },
  { id: 6, title: 'Bosque Silencioso y Pájaros', duration: '40 min', icon: 'planet', color: '#10B981', type: 'Sonidos', uri: 'https://actions.google.com/sounds/v1/ambiences/outdoor_forest.ogg' },
  { id: 7, title: 'Ruido Blanco Puro para Sueño Profundo', duration: '30 min', icon: 'moon', color: '#8B5CF6', type: 'Sonidos', uri: 'https://actions.google.com/sounds/v1/ambiences/white_noise.ogg' },
  { id: 8, title: 'Viento Suave Nocturno', duration: '35 min', icon: 'cloudy-night', color: '#9CA3AF', type: 'Sonidos', uri: 'https://actions.google.com/sounds/v1/weather/wind_synthetic.ogg' },
];

const FAVORITES_KEY = 'musica_favoritos';

export default function MusicaScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Musica');
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  
  // AI Music Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingMusic, setGeneratingMusic] = useState(false);

  const [primary, secondary, muted, surface, success] = useThemeColor([
    'accent',
    'secondary',
    'muted',
    'surface',
    'success'
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
          color: secondary,
          type: 'Musica',
          uri: res.data.data.uri,
        };
        setTracks((prev) => [newTrack, ...prev]);
        setAiPrompt('');
        Alert.alert('¡Música Generada!', `Se ha creado "${newTrack.title}". ¡Presiona Play para escucharla!`);
        togglePlay(newTrack);
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
      const success = await playAudio(track.uri, (status) => {
        if (status.didJustFinish) {
          setPlayingId(null);
          setIsPaused(false);
        }
      });
      if (!success) {
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
    : activeTab === 'Musica'
      ? tracks.filter((t) => t.type === 'Musica')
      : activeTab === 'Sonidos'
        ? tracks.filter((t) => t.type === 'Sonidos')
        : tracks;

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-12" showsVerticalScrollIndicator={false}>
      <Label className="text-2xl font-extrabold text-foreground mb-4">Música & Sonidos IA</Label>

      {/* Selector de Pestañas */}
      <View className="flex-row flex-wrap mb-4 gap-2">
        {(['Musica', 'Sonidos', 'Favoritos', 'IA Generador'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            style={{ backgroundColor: activeTab === tab ? primary : surface }}
            className="px-3.5 py-2 rounded-full"
            onPress={() => setActiveTab(tab)}
          >
            <Label
              style={{ color: activeTab === tab ? '#FFFFFF' : muted }}
              className={`text-[13px] ${activeTab === tab ? 'font-bold' : 'font-medium'}`}
            >
              {tab}
            </Label>
          </Pressable>
        ))}
      </View>

      {/* Sección Generador de Música IA */}
      {activeTab === 'IA Generador' && (
        <Card variant="outline" className="mb-5 border-secondary/40">
          <Card.Body>
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="sparkles" size={24} color={secondary} />
              <Label className="text-base font-bold text-secondary">Generador de Nanas con IA</Label>
            </View>
            <Label className="text-[13px] text-muted mb-3">
              Escribe un prompt para que la IA componga una pista personalizada:
            </Label>

            <TextField className="w-full mb-3">
              <Input
                placeholder="Ej: Canción de cuna suave con piano..."
                value={aiPrompt}
                onChangeText={setAiPrompt}
              />
            </TextField>

            <Button
              variant="secondary"
              onPress={() => generateAIMusic()}
              isDisabled={!aiPrompt.trim() || generatingMusic}
              className="w-full"
            >
              {generatingMusic ? <Spinner size="sm" color="default" /> : <Button.Label>Generar Música con IA</Button.Label>}
            </Button>

            <Label className="text-xs font-bold text-muted mt-4 mb-2">Prompts Sugeridos:</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {['Arpa relajante para dormir', 'Lluvia suave en el bosque', 'Sonidos del espacio y estrellas', 'Piano suave de cuna'].map((p) => (
                <Pressable
                  key={p}
                  className="bg-secondary/15 px-3 py-1.5 rounded-full mr-2"
                  onPress={() => generateAIMusic(p)}
                >
                  <Label className="text-xs font-semibold text-secondary">✨ {p}</Label>
                </Pressable>
              ))}
            </ScrollView>
          </Card.Body>
        </Card>
      )}

      {/* Lista de Pistas de Audio */}
      {tracksToShow.length === 0 ? (
        <View className="items-center mt-10">
          <Ionicons name="musical-note-outline" size={64} color={muted} />
          <Label className="text-sm text-muted mt-4 text-center">
            {activeTab === 'Favoritos' ? 'No tienes favoritos todavía. Toca el corazón en una pista.' : 'No hay pistas disponibles en esta categoría.'}
          </Label>
        </View>
      ) : (
        tracksToShow.map((track) => (
          <Card key={track.id} variant="default" className="mb-2">
            <Card.Body className="flex-row items-center p-4">
              <Ionicons name={track.icon as any} size={28} color={track.color} />
              <View className="flex-1 ml-3">
                <Label className="text-[15px] font-bold text-foreground">{track.title}</Label>
                <Label className="text-xs text-muted mt-0.5">{track.duration}</Label>
              </View>
              <Pressable className="p-2 mr-1" onPress={() => toggleFavorite(track.id)}>
                <Ionicons
                  name={favorites.includes(track.id) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={favorites.includes(track.id) ? '#EF4444' : muted}
                />
              </Pressable>
              <Pressable onPress={() => togglePlay(track)}>
                <Ionicons
                  name={playingId === track.id && !isPaused ? 'pause-circle' : 'play-circle'}
                  size={36}
                  color={playingId === track.id ? (isPaused ? '#F59E0B' : '#10B981') : primary}
                />
              </Pressable>
            </Card.Body>
          </Card>
        ))
      )}

      {playingId !== null && (
        <Card variant="default" className="mt-2 mb-5 bg-surface border border-separator">
          <Card.Body className="flex-row items-center p-3.5 gap-2.5">
            <Ionicons name={isPaused ? "pause" : "volume-high"} size={20} color={isPaused ? "#F59E0B" : success} />
            <Label className="text-sm font-semibold text-foreground flex-1">
              {isPaused ? 'Pausado: ' : 'Reproduciendo: '}{tracks.find((t) => t.id === playingId)?.title || ''}
            </Label>
          </Card.Body>
        </Card>
      )}
      <View className="h-8" />
    </ScrollView>
  );
}