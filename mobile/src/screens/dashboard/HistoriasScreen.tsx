import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HistoriasScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Historias</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={styles.tabActiveText}>Mis historias</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>IA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Favoritas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.storyCard}>
        <Ionicons name="book" size={40} color="#E67E22" />
        <View style={styles.storyInfo}>
          <Text style={styles.storyTitle}>La tortuga y la liebre</Text>
          <Text style={styles.storyDuration}>15 min</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="play-circle" size={32} color="#4A90D9" />
        </TouchableOpacity>
      </View>

      <View style={styles.storyCard}>
        <Ionicons name="rocket" size={40} color="#3498DB" />
        <View style={styles.storyInfo}>
          <Text style={styles.storyTitle}>Aventuras en el espacio</Text>
          <Text style={styles.storyDuration}>18 min</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="play-circle" size={32} color="#4A90D9" />
        </TouchableOpacity>
      </View>

      <View style={styles.storyCard}>
        <Ionicons name="leaf" size={40} color="#27AE60" />
        <View style={styles.storyInfo}>
          <Text style={styles.storyTitle}>El bosque encantado</Text>
          <Text style={styles.storyDuration}>12 min</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="play-circle" size={32} color="#4A90D9" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.generateButton}>
        <Ionicons name="sparkles" size={20} color="white" />
        <Text style={styles.generateButtonText}>Generar historia con IA</Text>
      </TouchableOpacity>
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
  storyCard: {
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
  storyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  storyDuration: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#8E44AD',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 20,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});