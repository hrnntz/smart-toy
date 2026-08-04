import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { musicService } from '../../services/api';
import { playAudio, pauseAudio, resumeAudio, stopAudio } from '../../services/audioService';

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
  { id: 1, title: 'Piano relajante para cuna', duration: '30 min', icon: 'musical-note', color: '#27AE60', type: 'Musica', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Canciones y nanas de Panda', duration: '45 min', icon: 'musical-notes', color: '#E67E22', type: 'Musica', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 3, title: 'Melodía suave de caja de música', duration: '20 min', icon: 'heart', color: '#E74C3C', type: 'Musica', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
  { id: 4, title: 'Arpa mágica de estrellas', duration: '25 min', icon: 'sparkles', color: '#9B59B6', type: 'Musica', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3' },
  { id: 5, title: 'Lluvia suave en el bosque', duration: '60 min', icon: 'leaf', color: '#3498DB', type: 'Sonidos', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 6, title: 'Olas del mar y brisa pacífica', duration: '45 min', icon: 'water', color: '#2980B9', type: 'Sonidos', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 7, title: 'Ruido blanco para dormir profundo', duration: '30 min', icon: 'moon', color: '#8E44AD', type: 'Sonidos', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 8, title: 'Flauta zen y viento nocturno', duration: '40 min', icon: 'planet', color: '#16A085', type: 'Sonidos', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' },
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
          color: '#8E44AD',
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Música & Sonidos IA</Text>

      {/* Selector de Pestañas */}
      <View style={styles.tabRow}>
        {(['Musica', 'Sonidos', 'Favoritos', 'IA Generador'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabActiveText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sección Generador de Música IA */}
      {activeTab === 'IA Generador' && (
        <View style={styles.aiGeneratorCard}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={24} color="#8E44AD" />
            <Text style={styles.aiTitle}>Generador de Nanas y Sonidos con IA</Text>
          </View>
          <Text style={styles.aiSubtitle}>
            Escribe un prompt para que la IA componga una pista de relajación personalizada para tu hijo:
          </Text>

          <TextInput
            style={styles.aiInput}
            placeholder="Ej: Canción de cuna suave con piano y olas de mar..."
            value={aiPrompt}
            onChangeText={setAiPrompt}
          />

          <TouchableOpacity
            style={[styles.generateBtn, (!aiPrompt.trim() || generatingMusic) && styles.generateBtnDisabled]}
            onPress={() => generateAIMusic()}
            disabled={!aiPrompt.trim() || generatingMusic}
          >
            {generatingMusic ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="color-wand" size={20} color="white" />
                <Text style={styles.generateBtnText}>Generar Música con IA</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.presetsTitle}>Prompts Rápidos Sugeridos:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
            {['Arpa relajante para dormir', 'Lluvia suave en el bosque', 'Sonidos del espacio y estrellas', 'Piano suave de cuna'].map((p) => (
              <TouchableOpacity key={p} style={styles.presetChip} onPress={() => generateAIMusic(p)}>
                <Text style={styles.presetText}>✨ {p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Lista de Pistas de Audio */}
      {tracksToShow.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="musical-note-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {activeTab === 'Favoritos' ? 'No tienes favoritos todavía. Toca el corazón en una pista.' : 'No hay pistas disponibles en esta categoría.'}
          </Text>
        </View>
      ) : (
        tracksToShow.map((track) => (
          <View key={track.id} style={styles.musicCard}>
            <Ionicons name={track.icon as any} size={28} color={track.color} />
            <View style={styles.musicInfo}>
              <Text style={styles.musicTitle}>{track.title}</Text>
              <Text style={styles.musicDuration}>{track.duration}</Text>
            </View>
            <TouchableOpacity style={styles.favButton} onPress={() => toggleFavorite(track.id)}>
              <Ionicons
                name={favorites.includes(track.id) ? 'heart' : 'heart-outline'}
                size={24}
                color={favorites.includes(track.id) ? '#E74C3C' : '#CCC'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => togglePlay(track)}>
              <Ionicons
                name={playingId === track.id && !isPaused ? 'pause-circle' : 'play-circle'}
                size={36}
                color={playingId === track.id ? (isPaused ? '#E67E22' : '#27AE60') : '#4A90D9'}
              />
            </TouchableOpacity>
          </View>
        ))
      )}

      {playingId !== null && (
        <View style={styles.nowPlaying}>
          <Ionicons name={isPaused ? "pause" : "volume-high"} size={20} color={isPaused ? "#E67E22" : "#27AE60"} />
          <Text style={[styles.nowPlayingText, isPaused && { color: "#E67E22" }]}>
            {isPaused ? 'Pausado: ' : 'Reproduciendo: '}{tracks.find((t) => t.id === playingId)?.title || ''}
          </Text>
        </View>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingTop: 45,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
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
    marginRight: 6,
    backgroundColor: '#EBF5FB',
  },
  tabActive: {
    backgroundColor: '#4A90D9',
  },
  tabText: {
    color: '#2C3E50',
    fontSize: 13,
  },
  tabActiveText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  aiGeneratorCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  aiTitle: { fontSize: 16, fontWeight: 'bold', color: '#8E44AD' },
  aiSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  aiInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  generateBtn: {
    flexDirection: 'row',
    backgroundColor: '#8E44AD',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  generateBtnDisabled: { backgroundColor: '#CBD5E1' },
  generateBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  presetsTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 8 },
  presetsRow: { flexDirection: 'row' },
  presetChip: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  presetText: { fontSize: 12, color: '#8E44AD', fontWeight: '500' },
  musicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
  },
  musicInfo: {
    flex: 1,
    marginLeft: 12,
  },
  musicTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  musicDuration: {
    fontSize: 12,
    color: '#7F8C8D',
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
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  nowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    padding: 14,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20,
    gap: 10,
  },
  nowPlayingText: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
    flex: 1,
  },
});