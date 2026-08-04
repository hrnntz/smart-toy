import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { playAudio, pauseAudio, resumeAudio, stopAudio, isAudioPaused } from '../../services/audioService';

type TabType = 'Musica' | 'Sonidos' | 'Favoritos';

interface Track {
  id: number;
  title: string;
  duration: string;
  icon: string;
  color: string;
  type: 'Musica' | 'Sonidos';
  uri: string;
}

const TRACKS: Track[] = [
  { id: 1, title: 'Música relajante', duration: '30 min', icon: 'musical-note', color: '#27AE60', type: 'Musica', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Canciones infantiles', duration: '45 min', icon: 'musical-notes', color: '#E67E22', type: 'Musica', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Sonidos de naturaleza', duration: '60 min', icon: 'leaf', color: '#3498DB', type: 'Sonidos', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 4, title: 'Ruido blanco', duration: '30 min', icon: 'moon', color: '#2C3E50', type: 'Sonidos', uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
];

const FAVORITES_KEY = 'musica_favoritos';

export default function MusicaScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Musica');
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<number[]>([]);

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
    ? TRACKS.filter((t) => favorites.includes(t.id))
    : activeTab === 'Musica'
      ? TRACKS.filter((t) => t.type === 'Musica')
      : TRACKS.filter((t) => t.type === 'Sonidos');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Música y sonidos</Text>

      <View style={styles.tabRow}>
        {(['Musica', 'Sonidos', 'Favoritos'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabActiveText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tracksToShow.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="musical-note-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {activeTab === 'Favoritos' ? 'No tienes favoritos todavía. Toca el corazón en una pista.' : 'No hay pistas en esta categoría.'}
          </Text>
        </View>
      ) : (
        tracksToShow.map((track) => (
          <View key={track.id} style={styles.musicCard}>
            <Ionicons name={track.icon as any} size={32} color={track.color} />
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
          <Ionicons name={isPaused ? "pause" : "volume-high"} size={18} color={isPaused ? "#E67E22" : "#27AE60"} />
          <Text style={[styles.nowPlayingText, isPaused && { color: "#E67E22" }]}>
            {isPaused ? 'Pausado: ' : 'Reproduciendo: '}{TRACKS.find((t) => t.id === playingId)?.title || ''}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#EBF5FB',
  },
  tabActive: {
    backgroundColor: '#4A90D9',
  },
  tabText: {
    color: '#2C3E50',
    fontSize: 14,
  },
  tabActiveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  musicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  musicInfo: {
    flex: 1,
    marginLeft: 12,
  },
  musicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  musicDuration: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  favButton: {
    padding: 8,
    marginRight: 4,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  nowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
  },
  nowPlayingText: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '500',
    flex: 1,
  },
});