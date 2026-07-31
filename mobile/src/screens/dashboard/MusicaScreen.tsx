import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MusicaScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Música y sonidos</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={styles.tabActiveText}>Música</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Sonidos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Favoritos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.musicCard}>
        <Ionicons name="musical-note" size={32} color="#27AE60" />
        <View style={styles.musicInfo}>
          <Text style={styles.musicTitle}>Música relajante</Text>
          <Text style={styles.musicDuration}>30 min</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="play-circle" size={32} color="#4A90D9" />
        </TouchableOpacity>
      </View>

      <View style={styles.musicCard}>
        <Ionicons name="musical-notes" size={32} color="#E67E22" />
        <View style={styles.musicInfo}>
          <Text style={styles.musicTitle}>Canciones infantiles</Text>
          <Text style={styles.musicDuration}>45 min</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="play-circle" size={32} color="#4A90D9" />
        </TouchableOpacity>
      </View>

      <View style={styles.musicCard}>
        <Ionicons name="leaf" size={32} color="#3498DB" />
        <View style={styles.musicInfo}>
          <Text style={styles.musicTitle}>Sonidos de naturaleza</Text>
          <Text style={styles.musicDuration}>60 min</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="play-circle" size={32} color="#4A90D9" />
        </TouchableOpacity>
      </View>

      <View style={styles.musicCard}>
        <Ionicons name="moon" size={32} color="#2C3E50" />
        <View style={styles.musicInfo}>
          <Text style={styles.musicTitle}>Ruido blanco</Text>
          <Text style={styles.musicDuration}>30 min</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="play-circle" size={32} color="#4A90D9" />
        </TouchableOpacity>
      </View>
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
  },
  tabActive: {
    backgroundColor: '#4A90D9',
  },
  tabText: {
    color: '#7F8C8D',
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
});