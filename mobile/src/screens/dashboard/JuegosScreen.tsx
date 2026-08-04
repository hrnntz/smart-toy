import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
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
  { id: 1, name: 'Adivinanzas', desc: 'Ejercita tu mente con adivinanzas', icon: 'bulb-outline', categoria: 'Lógica' },
  { id: 2, name: 'Colores', desc: 'Aprende colores jugando', icon: 'color-palette-outline', categoria: 'Lógica' },
  { id: 3, name: 'Sumas simples', desc: 'Resuelve operaciones básicas', icon: 'calculator-outline', categoria: 'Matemáticas' },
  { id: 4, name: 'Memoria', desc: 'Encuentra las parejas de cartas', icon: 'brain-outline', categoria: 'Memoria' },
  { id: 5, name: 'Ordenar palabras', desc: 'Forma la palabra correcta', icon: 'text-outline', categoria: 'Lectura' },
];

const RIDDLES = [
  { question: 'Tengo hojas y no soy árbol, hablo sin tener voz. ¿Qué soy?', options: ['Un libro', 'Una carta', 'Un periódico'], answer: 0 },
  { question: 'Blanco por dentro, verde por fuera. Si quieres que te lo diga, espera. ¿Qué es?', options: ['Manzana', 'Pera', 'Plátano'], answer: 1 },
  { question: 'Tengo agujas pero no sé coser, tengo números pero no sé leer. ¿Qué soy?', options: ['Reloj', 'Brújula', 'Calculadora'], answer: 0 },
];

const MATH_QUESTIONS = [
  { question: '¿Cuánto es 3 + 5?', options: ['7', '8', '9'], answer: 1 },
  { question: '¿Cuánto es 12 - 4?', options: ['8', '6', '10'], answer: 0 },
  { question: '¿Cuánto es 4 + 4?', options: ['6', '8', '7'], answer: 1 },
];

const PROGRESS_KEY = 'juegos_progreso';

export default function JuegosScreen({ navigation }: any) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria>('Todos');
  const [progreso, setProgreso] = useState<Record<number, boolean>>({});
  const [selectedJuego, setSelectedJuego] = useState<Juego | null>(null);

  // Juego state
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

  const handlePlay = (juego: Juego) => {
    setSelectedJuego(juego);
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameFinished(false);
  };

  const handleAnswer = (optionIndex: number) => {
    const questions = selectedJuego?.categoria === 'Matemáticas' ? MATH_QUESTIONS : RIDDLES;
    const currentQ = questions[currentQuestionIndex];
    
    let newScore = score;
    if (optionIndex === currentQ.answer) {
      newScore += 1;
      setScore(newScore);
    }

    if (currentQuestionIndex + 1 < questions.length) {
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

  const activeQuestions = selectedJuego?.categoria === 'Matemáticas' ? MATH_QUESTIONS : RIDDLES;

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

      {/* Modal Interactivo de Minijuego */}
      <Modal visible={selectedJuego !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedJuego?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedJuego(null)}>
                <Ionicons name="close" size={28} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            {gameFinished ? (
              <View style={styles.resultContainer}>
                <Ionicons name="trophy" size={64} color="#F1C40F" />
                <Text style={styles.resultTitle}>¡Juego completado!</Text>
                <Text style={styles.resultScore}>
                  Puntaje: {score} / {activeQuestions.length}
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
                <Text style={styles.progressText}>
                  Pregunta {currentQuestionIndex + 1} de {activeQuestions.length}
                </Text>
                <Text style={styles.questionText}>
                  {activeQuestions[currentQuestionIndex]?.question}
                </Text>
                {activeQuestions[currentQuestionIndex]?.options.map((option, idx) => (
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  questionContainer: {
    alignItems: 'stretch',
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