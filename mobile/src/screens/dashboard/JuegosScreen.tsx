import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';

type Categoria = 'Todos' | 'Lógica' | 'Memoria' | 'Matemáticas' | 'Lectura';

interface Juego {
  id: number;
  name: string;
  desc: string;
  icon: string;
  categoria: Categoria;
}

const JUEGOS: Juego[] = [
  { id: 1, name: 'Adivinanzas', desc: 'Ejercita tu mente', icon: 'bulb-outline', categoria: 'Lógica' },
  { id: 2, name: 'Colores', desc: 'Aprende jugando', icon: 'color-palette-outline', categoria: 'Lógica' },
  { id: 3, name: 'Sumas simples', desc: 'Matemáticas básicas', icon: 'calculator-outline', categoria: 'Matemáticas' },
  { id: 4, name: 'Memoria', desc: 'Mejora tu memoria', icon: 'brain-outline', categoria: 'Memoria' },
  { id: 5, name: 'Ordenar palabras', desc: 'Forma la palabra correcta', icon: 'text-outline', categoria: 'Lectura' },
  { id: 6, name: 'Secuencias', desc: 'Encuentra el patrón', icon: 'git-compare-outline', categoria: 'Lógica' },
  { id: 7, name: 'Pares iguales', desc: 'Encuentra las parejas', icon: 'grid-outline', categoria: 'Memoria' },
  { id: 8, name: 'Restas', desc: 'Aprende a restar', icon: 'remove-circle-outline', categoria: 'Matemáticas' },
  { id: 9, name: 'Completar palabras', desc: 'Encuentra la letra', icon: 'create-outline', categoria: 'Lectura' },
];

const PROGRESS_KEY = 'juegos_progreso';

export default function JuegosScreen({ navigation }: any) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria>('Todos');
  const [progreso, setProgreso] = useState<Record<number, boolean>>({});

  const categorias: Categoria[] = ['Todos', 'Lógica', 'Memoria', 'Matemáticas', 'Lectura'];

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const saved = await storage.getItem(PROGRESS_KEY);
      if (saved) setProgreso(JSON.parse(saved));
    } catch (error) {
      console.error('Error cargando progreso:', error);
    }
  };

  const saveProgress = async (newProgress: Record<number, boolean>) => {
    try {
      await storage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
    } catch (error) {
      console.error('Error guardando progreso:', error);
    }
  };

  const handlePlay = (juego: Juego) => {
    Alert.alert(
      juego.name,
      `"${juego.name}" estará disponible pronto. ¡Sigue practicando!`,
      [
        { text: 'Cerrar', style: 'cancel' },
        {
          text: 'Marcar como jugado',
          onPress: () => {
            const newProgress = { ...progreso, [juego.id]: true };
            setProgreso(newProgress);
            saveProgress(newProgress);
            Alert.alert('¡Bien!', `Progreso guardado en "${juego.name}"`);
          },
        },
      ]
    );
  };

  const juegosFiltrados = categoriaSeleccionada === 'Todos'
    ? JUEGOS
    : JUEGOS.filter((j) => j.categoria === categoriaSeleccionada);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Juegos Educativos</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categorias.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryButton,
              categoriaSeleccionada === cat && styles.categoryButtonActive,
            ]}
            onPress={() => setCategoriaSeleccionada(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                categoriaSeleccionada === cat && styles.categoryTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {juegosFiltrados.map((juego) => (
          <TouchableOpacity key={juego.id} style={styles.gameCard} onPress={() => handlePlay(juego)}>
            <View style={styles.gameIcon}>
              <Ionicons name={juego.icon as any} size={28} color="#4A90D9" />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameName}>{juego.name}</Text>
              <Text style={styles.gameDesc}>{juego.desc}</Text>
            </View>
            {progreso[juego.id] ? (
              <Ionicons name="checkmark-circle" size={28} color="#27AE60" />
            ) : (
              <Ionicons name="play-circle" size={32} color="#4A90D9" />
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
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
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EBF5FB',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#4A90D9',
  },
  categoryText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  gameCard: {
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
  gameIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF5FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  gameDesc: {
    fontSize: 13,
    color: '#7F8C8D',
  },
});