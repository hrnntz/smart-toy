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
type Dificultad = 'Fácil' | 'Medio' | 'Difícil';

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
  explanation: string;
}

const JUEGOS: Juego[] = [
  { id: 1, name: 'Adivinanzas', desc: 'Ejercita la mente con enigmas divertidos', icon: 'bulb-outline', categoria: 'Lógica' },
  { id: 2, name: 'Colores & Formas', desc: 'Aprende colores y figuras', icon: 'color-palette-outline', categoria: 'Lógica' },
  { id: 3, name: 'Sumas & Restas', desc: 'Matemáticas básicas para niños', icon: 'calculator-outline', categoria: 'Matemáticas' },
  { id: 4, name: 'Memoria Panda', desc: 'Encuentra las parejas de cartas', icon: 'brain-outline', categoria: 'Memoria' },
  { id: 5, name: 'Ordenar palabras', desc: 'Forma la palabra correcta', icon: 'text-outline', categoria: 'Lectura' },
  { id: 6, name: 'Secuencias lógicas', desc: 'Encuentra el patrón', icon: 'git-compare-outline', categoria: 'Lógica' },
  { id: 7, name: 'Multiplicaciones básicas', desc: 'Tablas simples para primaria', icon: 'stats-chart-outline', categoria: 'Matemáticas' },
  { id: 8, name: 'Lectura comprensiva', desc: 'Comprende historias cortas', icon: 'book-outline', categoria: 'Lectura' },
];

const PROGRESS_KEY = 'juegos_progreso';

export default function JuegosScreen({ navigation }: any) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria>('Todos');
  const [dificultad, setDificultad] = useState<Dificultad>('Fácil');
  const [progreso, setProgreso] = useState<Record<number, boolean>>({});
  const [selectedJuego, setSelectedJuego] = useState<Juego | null>(null);

  // AI Game state
  const [aiQuestions, setAiQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const categorias: Categoria[] = ['Todos', 'Lógica', 'Memoria', 'Matemáticas', 'Lectura'];
  const dificultades: Dificultad[] = ['Fácil', 'Medio', 'Difícil'];

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
    setSelectedAnswerIndex(null);
    setShowExplanation(false);
    setGameFinished(false);
    setLoadingQuestions(true);

    try {
      // Solicitar 10 preguntas dinámicas con nivel de dificultad e explicaciones
      const res = await gameService.generateQuestions(juego.name, juego.categoria, dificultad, 10);
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setAiQuestions(res.data.data);
      } else {
        throw new Error('Respuesta de IA inválida');
      }
    } catch (error) {
      console.error('Error obteniendo preguntas:', error);
      // Fallback
      setAiQuestions([
        {
          question: '¿De qué color es la manzana madura?',
          options: ['Roja', 'Azul', 'Negra'],
          answer: 0,
          explanation: 'Las manzanas maduras más comunes en los árboles son rojas o verdes.',
        },
        {
          question: '¿Cuánto es 3 + 2?',
          options: ['4', '5', '6'],
          answer: 1,
          explanation: 'Si cuentas 3 dedos y agregas 2 dedos más, en total tienes 5.',
        },
      ]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (selectedAnswerIndex !== null) return; // Evitar múltiples selecciones
    setSelectedAnswerIndex(optionIndex);
    setShowExplanation(true);

    const currentQ = aiQuestions[currentQuestionIndex];
    if (optionIndex === currentQ.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswerIndex(null);
    setShowExplanation(false);

    if (currentQuestionIndex + 1 < aiQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
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

  const currentQ = aiQuestions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minijuegos con IA Groq</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Selector de Dificultad */}
      <View style={styles.difficultyContainer}>
        <Text style={styles.difficultyLabel}>Dificultad:</Text>
        <View style={styles.difficultyRow}>
          {dificultades.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.diffChip,
                dificultad === d && (d === 'Fácil' ? styles.diffEasy : d === 'Medio' ? styles.diffMedium : styles.diffHard),
              ]}
              onPress={() => setDificultad(d)}
            >
              <Text style={[styles.diffText, dificultad === d && styles.diffTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Categorías */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categorias.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryButton, categoriaSeleccionada === cat && styles.categoryButtonActive]}
            onPress={() => setCategoriaSeleccionada(cat)}
          >
            <Text style={[styles.categoryText, categoriaSeleccionada === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de Juegos */}
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

      {/* Modal Interactivo de Preguntas con Explicación de IA */}
      <Modal visible={selectedJuego !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedJuego?.name}</Text>
                <Text style={styles.modalSubtitle}>Nivel {dificultad} • IA Groq</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedJuego(null)}>
                <Ionicons name="close" size={28} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            {loadingQuestions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90D9" />
                <Text style={styles.loadingText}>
                  🤖 Groq IA está creando 10 retos ({dificultad}) con explicaciones...
                </Text>
              </View>
            ) : gameFinished ? (
              <View style={styles.resultContainer}>
                <Ionicons name="trophy" size={64} color="#F1C40F" />
                <Text style={styles.resultTitle}>¡Felicidades!</Text>
                <Text style={styles.resultScore}>
                  Lograste {score} de {aiQuestions.length} aciertos en nivel {dificultad}
                </Text>
                <TouchableOpacity style={styles.closeGameButton} onPress={() => setSelectedJuego(null)}>
                  <Text style={styles.closeGameButtonText}>Volver a los juegos</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.questionContainer}>
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
                <Text style={styles.questionText}>{currentQ?.question}</Text>

                {/* Opciones con Feedback de Colores */}
                {currentQ?.options.map((option, idx) => {
                  let isSelected = selectedAnswerIndex === idx;
                  let isCorrect = idx === currentQ.answer;

                  let btnStyle: any = styles.optionButton;
                  let textStyle: any = styles.optionText;

                  if (showExplanation) {
                    if (isCorrect) {
                      btnStyle = [styles.optionButton, styles.optionCorrect];
                      textStyle = [styles.optionText, styles.optionCorrectText];
                    } else if (isSelected) {
                      btnStyle = [styles.optionButton, styles.optionWrong];
                      textStyle = [styles.optionText, styles.optionWrongText];
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={btnStyle}
                      onPress={() => handleSelectOption(idx)}
                      disabled={showExplanation}
                    >
                      <Text style={textStyle}>{option}</Text>
                      {showExplanation && isCorrect && <Ionicons name="checkmark-circle" size={20} color="white" />}
                      {showExplanation && isSelected && !isCorrect && <Ionicons name="close-circle" size={20} color="white" />}
                    </TouchableOpacity>
                  );
                })}

                {/* Caja de Explicación de la IA si falla o responde */}
                {showExplanation && (
                  <View style={styles.explanationCard}>
                    <View style={styles.explanationHeader}>
                      <Ionicons
                        name={selectedAnswerIndex === currentQ?.answer ? 'checkmark-circle' : 'alert-circle'}
                        size={22}
                        color={selectedAnswerIndex === currentQ?.answer ? '#27AE60' : '#E74C3C'}
                      />
                      <Text
                        style={[
                          styles.explanationTitle,
                          { color: selectedAnswerIndex === currentQ?.answer ? '#27AE60' : '#E74C3C' },
                        ]}
                      >
                        {selectedAnswerIndex === currentQ?.answer ? '¡Correcto!' : '¡Casi lo logras! Explicación Panda IA:'}
                      </Text>
                    </View>
                    <Text style={styles.explanationBody}>{currentQ?.explanation}</Text>

                    <TouchableOpacity style={styles.nextBtn} onPress={handleNextQuestion}>
                      <Text style={styles.nextBtnText}>
                        {currentQuestionIndex + 1 < aiQuestions.length ? 'Siguiente Pregunta ➡️' : 'Ver Resultados 🏆'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingHorizontal: 16, paddingTop: 45 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
  difficultyContainer: { marginBottom: 14 },
  difficultyLabel: { fontSize: 13, color: '#7F8C8D', fontWeight: 'bold', marginBottom: 6 },
  difficultyRow: { flexDirection: 'row', gap: 8 },
  diffChip: { backgroundColor: '#EBF5FB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  diffEasy: { backgroundColor: '#27AE60' },
  diffMedium: { backgroundColor: '#E67E22' },
  diffHard: { backgroundColor: '#E74C3C' },
  diffText: { fontSize: 13, color: '#2C3E50' },
  diffTextActive: { color: 'white', fontWeight: 'bold' },
  categoriesContainer: { marginBottom: 16 },
  categoryButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EBF5FB', marginRight: 6 },
  categoryButtonActive: { backgroundColor: '#4A90D9' },
  categoryText: { fontSize: 13, color: '#2C3E50' },
  categoryTextActive: { color: 'white', fontWeight: '600' },
  gameCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1 },
  gameIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EBF5FB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  gameInfo: { flex: 1 },
  gameName: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  gameDesc: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 18, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  modalSubtitle: { fontSize: 12, color: '#7F8C8D' },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 16, fontSize: 14, color: '#4A90D9', textAlign: 'center' },
  questionContainer: { flexGrow: 1 },
  progressBarBg: { height: 6, backgroundColor: '#EBF5FB', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4A90D9', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#7F8C8D', marginBottom: 8 },
  questionText: { fontSize: 17, fontWeight: '600', color: '#2C3E50', marginBottom: 16 },
  optionButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 14, borderRadius: 12, marginBottom: 10 },
  optionText: { fontSize: 15, color: '#2C3E50', fontWeight: '500' },
  optionCorrect: { backgroundColor: '#27AE60' },
  optionCorrectText: { color: 'white', fontWeight: 'bold' },
  optionWrong: { backgroundColor: '#E74C3C' },
  optionWrongText: { color: 'white', fontWeight: 'bold' },
  explanationCard: { backgroundColor: '#FEF9E7', padding: 14, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#F1C40F', marginTop: 10, marginBottom: 10 },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  explanationTitle: { fontSize: 14, fontWeight: 'bold' },
  explanationBody: { fontSize: 13, color: '#2C3E50', lineHeight: 18, marginBottom: 12 },
  nextBtn: { backgroundColor: '#4A90D9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  nextBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  resultContainer: { alignItems: 'center', paddingVertical: 20 },
  resultTitle: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', marginTop: 12 },
  resultScore: { fontSize: 15, color: '#7F8C8D', marginTop: 8, marginBottom: 20, textAlign: 'center' },
  closeGameButton: { backgroundColor: '#4A90D9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  closeGameButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});