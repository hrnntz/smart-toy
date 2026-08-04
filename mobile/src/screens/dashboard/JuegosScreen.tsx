import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { gameService } from '../../services/api';

type Categoria = 'Todos' | 'Lógica' | 'Memoria' | 'Matemáticas' | 'Lectura';

interface Juego {
  id: number;
  name: string;
  desc: string;
  icon: string;
  categoria: Categoria;
}

interface Question {
  question: string;
  options: string[];
  answer: number;
}

const JUEGOS: Juego[] = [
  { id: 1, name: 'Adivinanzas', desc: 'Ejercita tu mente con adivinanzas', icon: 'bulb-outline', categoria: 'Lógica' },
  { id: 2, name: 'Colores', desc: 'Aprende colores jugando', icon: 'color-palette-outline', categoria: 'Lógica' },
  { id: 3, name: 'Sumas simples', desc: 'Resuelve operaciones básicas', icon: 'calculator-outline', categoria: 'Matemáticas' },
  { id: 4, name: 'Memoria', desc: 'Encuentra las parejas de cartas', icon: 'brain-outline', categoria: 'Memoria' },
  { id: 5, name: 'Ordenar palabras', desc: 'Forma la palabra correcta', icon: 'text-outline', categoria: 'Lectura' },
  { id: 6, name: 'Secuencias', desc: 'Encuentra el patrón lógico', icon: 'git-compare-outline', categoria: 'Lógica' },
  { id: 7, name: 'Restas básicas', desc: 'Aprende a restar', icon: 'remove-circle-outline', categoria: 'Matemáticas' },
  { id: 8, name: 'Comprensión lectora', desc: 'Lee y responde correctamente', icon: 'book-outline', categoria: 'Lectura' },
];

const PROGRESS_KEY = 'juegos_progreso';

export default function JuegosScreen({ navigation }: any) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria>('Todos');
  const [progreso, setProgreso] = useState<Record<number, boolean>>({});
  const [selectedJuego, setSelectedJuego] = useState<Juego | null>(null);

  // AI Game state
  const [aiQuestions, setAiQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

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

  const handlePlay = async (juego: Juego) => {
    setSelectedJuego(juego);
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameFinished(false);
    setLoadingQuestions(true);

    try {
      // Solicitar 10 preguntas generadas dinámicamente por la IA de Groq
      const res = await gameService.generateQuestions(juego.name, juego.categoria, 10);
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setAiQuestions(res.data.data);
      } else {
        throw new Error('Respuesta inválida de la IA');
      }
    } catch (error) {
      console.error('Error obteniendo preguntas de la IA:', error);
      // Fallback de preguntas locales
      setAiQuestions([
        { question: `¿Cuál es el primer paso en "${juego.name}"?`, options: ['Observar', 'Correr', 'Dormir'], answer: 0 },
        { question: '¿Cuál es el resultado de 5 + 5?', options: ['8', '10', '12'], answer: 1 },
        { question: '¿Qué animal dice miau?', options: ['Gato', 'Perro', 'Vaca'], answer: 0 },
      ]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const currentQ = aiQuestions[currentQuestionIndex];
    if (!currentQ) return;

    let newScore = score;
    if (optionIndex === currentQ.answer) {
      newScore += 1;
      setScore(newScore);
    }

    if (currentQuestionIndex + 1 < aiQuestions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setGameFinished(true);
      if (selectedJuego) {
        const newProgress = { ...progreso, [selectedJuego.id]: true };
        setProgreso(newProgress);
        saveProgress(newProgress);
      }
    }
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
        <Text style={styles.headerTitle}>Juegos con IA Panda</Text>
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

      {/* Modal Interactivo de Minijuego Generado por IA */}
      <Modal visible={selectedJuego !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedJuego?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedJuego(null)}>
                <Ionicons name="close" size={28} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            {loadingQuestions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90D9" />
                <Text style={styles.loadingText}>
                  🤖 Generando 10 retos con IA para "{selectedJuego?.name}"...
                </Text>
              </View>
            ) : gameFinished ? (
              <View style={styles.resultContainer}>
                <Ionicons name="trophy" size={64} color="#F1C40F" />
                <Text style={styles.resultTitle}>¡Juego completado!</Text>
                <Text style={styles.resultScore}>
                  Puntaje: {score} de {aiQuestions.length} aciertos
                </Text>
                <TouchableOpacity
                  style={styles.closeGameButton}
                  onPress={() => setSelectedJuego(null)}
                >
                  <Text style={styles.closeGameButtonText}>Continuar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.questionContainer}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${((currentQuestionIndex + 1) / (aiQuestions.length || 1)) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  Pregunta {currentQuestionIndex + 1} de {aiQuestions.length}
                </Text>
                <Text style={styles.questionText}>
                  {aiQuestions[currentQuestionIndex]?.question}
                </Text>
                {aiQuestions[currentQuestionIndex]?.options.map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.optionButton}
                    onPress={() => handleAnswer(idx)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#4A90D9',
    textAlign: 'center',
    fontWeight: '500',
  },
  questionContainer: {
    alignItems: 'stretch',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#EBF5FB',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A90D9',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#EBF5FB',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 12,
  },
  resultScore: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 8,
    marginBottom: 20,
  },
  closeGameButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  closeGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});