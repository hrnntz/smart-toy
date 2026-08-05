import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { musicService } from '../../services/api';
import { playAudio, pauseAudio, resumeAudio, stopAudio } from '../../services/audioService';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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
  const { colors, typography, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>('Musica');
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  
  // AI Music Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingMusic, setGeneratingMusic] = useState(false);

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
          color: colors.secondary,
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Text style={[styles.title, { color: colors.text }]}>Música & Sonidos IA</Text>

      {/* Selector de Pestañas */}
      <View style={styles.tabRow}>
        {(['Musica', 'Sonidos', 'Favoritos', 'IA Generador'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              { backgroundColor: activeTab === tab ? colors.primary : colors.surface }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? '#FFFFFF' : colors.textSecondary, fontWeight: activeTab === tab ? '700' : '500' }
            ]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sección Generador de Música IA */}
      {activeTab === 'IA Generador' && (
        <Card variant="outline" style={{ borderColor: colors.secondary + '40', marginBottom: 20 }}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={24} color={colors.secondary} />
            <Text style={[styles.aiTitle, { color: colors.secondary }]}>Generador de Nanas con IA</Text>
          </View>
          <Text style={[styles.aiSubtitle, { color: colors.textSecondary }]}>
            Escribe un prompt para que la IA componga una pista personalizada:
          </Text>

          <Input
            placeholder="Ej: Canción de cuna suave con piano y olas de mar..."
            value={aiPrompt}
            onChangeText={setAiPrompt}
          />

          <Button
            title="Generar Música con IA"
            variant="secondary"
            onPress={() => generateAIMusic()}
            isLoading={generatingMusic}
            disabled={!aiPrompt.trim()}
          />

          <Text style={[styles.presetsTitle, { color: colors.textSecondary }]}>Prompts Sugeridos:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
            {['Arpa relajante para dormir', 'Lluvia suave en el bosque', 'Sonidos del espacio y estrellas', 'Piano suave de cuna'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.presetChip, { backgroundColor: colors.secondary + '15' }]}
                onPress={() => generateAIMusic(p)}
              >
                <Text style={[styles.presetText, { color: colors.secondary }]}>✨ {p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>
      )}

      {/* Lista de Pistas de Audio */}
      {tracksToShow.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="musical-note-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {activeTab === 'Favoritos' ? 'No tienes favoritos todavía. Toca el corazón en una pista.' : 'No hay pistas disponibles en esta categoría.'}
          </Text>
        </View>
      ) : (
        tracksToShow.map((track) => (
          <Card key={track.id} variant="elevated" style={styles.musicCard}>
            <Ionicons name={track.icon as any} size={28} color={track.color} />
            <View style={styles.musicInfo}>
              <Text style={[styles.musicTitle, { color: colors.text }]}>{track.title}</Text>
              <Text style={[styles.musicDuration, { color: colors.textSecondary }]}>{track.duration}</Text>
            </View>
            <TouchableOpacity style={styles.favButton} onPress={() => toggleFavorite(track.id)}>
              <Ionicons
                name={favorites.includes(track.id) ? 'heart' : 'heart-outline'}
                size={24}
                color={favorites.includes(track.id) ? '#EF4444' : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => togglePlay(track)}>
              <Ionicons
                name={playingId === track.id && !isPaused ? 'pause-circle' : 'play-circle'}
                size={36}
                color={playingId === track.id ? (isPaused ? '#F59E0B' : '#10B981') : colors.primary}
              />
            </TouchableOpacity>
          </Card>
        ))
      )}

      {playingId !== null && (
        <Card variant="flat" style={[styles.nowPlaying, { backgroundColor: colors.surface }]}>
          <Ionicons name={isPaused ? "pause" : "volume-high"} size={20} color={isPaused ? "#F59E0B" : colors.success} />
          <Text style={[styles.nowPlayingText, { color: colors.text }]}>
            {isPaused ? 'Pausado: ' : 'Reproduciendo: '}{tracks.find((t) => t.id === playingId)?.title || ''}
          </Text>
        </Card>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabText: {
    fontSize: 13,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  aiTitle: { fontSize: 16, fontWeight: '700' },
  aiSubtitle: { fontSize: 13, marginBottom: 12 },
  presetsTitle: { fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  presetsRow: { flexDirection: 'row' },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  presetText: { fontSize: 12, fontWeight: '600' },
  musicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  musicInfo: {
    flex: 1,
    marginLeft: 12,
  },
  musicTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  musicDuration: {
    fontSize: 12,
    marginTop: 2,
  },
  favButton: {
    padding: 8,
    marginRight: 4,
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  nowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginTop: 8,
    marginBottom: 20,
    gap: 10,
  },
  nowPlayingText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});