import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InglesScreen({ navigation }: any) {
  const [nivel, setNivel] = useState('A2 - Básico');
  const [planDiario, setPlanDiario] = useState(20);
  const [palabrasAprendidas, setPalabrasAprendidas] = useState(28);
  const [totalPalabras, setTotalPalabras] = useState(50);
  const [racha, setRacha] = useState(5);

  return (
    <View style={styles.container}>
      {/* Header con botón Volver */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aprender Inglés</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Nivel actual */}
        <View style={styles.levelCard}>
          <Text style={styles.levelTitle}>Nivel actual</Text>
          <Text style={styles.levelText}>{nivel}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
          <Text style={styles.progressText}>60% completado</Text>
        </View>

        {/* Plan diario */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="time-outline" size={24} color="#4A90D9" />
            <Text style={styles.cardTitle}>Plan diario</Text>
            <Text style={styles.cardValue}>{planDiario} min</Text>
          </View>
        </View>

        {/* Lección de hoy */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📚 Lección de hoy</Text>
          <Text style={styles.lessonTitle}>Animales</Text>
          <View style={styles.lessonProgress}>
            <Text style={styles.lessonText}>Palabras aprendidas</Text>
            <Text style={styles.lessonCount}>
              {palabrasAprendidas} / {totalPalabras}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(palabrasAprendidas / totalPalabras) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Racha actual */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="flame" size={24} color="#E67E22" />
            <Text style={styles.cardTitle}>Racha actual</Text>
            <Text style={styles.rachaText}>{racha} días</Text>
          </View>
        </View>

        {/* Botón empezar lección */}
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Empezar lección</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  levelCard: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  levelTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressText: {
    color: 'white',
    fontSize: 13,
    marginTop: 6,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90D9',
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 4,
    marginBottom: 8,
  },
  lessonProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  lessonText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  lessonCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  rachaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E67E22',
  },
  startButton: {
    backgroundColor: '#27AE60',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});