import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { gameService } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';

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
  const { colors, typography, isDark } = useTheme();

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
      const res = await gameService.generateQuestions(juego.name, juego.categoria, dificultad, 10);
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setAiQuestions(res.data.data);
      } else {
        throw new Error('Respuesta de IA inválida');
      }
    } catch (error) {
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
    if (selectedAnswerIndex !== null) return;
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Minijuegos con IA</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Selector de Dificultad */}
      <View style={styles.difficultyContainer}>
        <Text style={[styles.difficultyLabel, { color: colors.textSecondary }]}>Dificultad:</Text>
        <View style={styles.difficultyRow}>
          {dificultades.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.diffChip,
                { backgroundColor: dificultad === d ? colors.primary : colors.surface },
              ]}
              onPress={() => setDificultad(d)}
            >
              <Text style={[styles.diffText, { color: dificultad === d ? '#FFFFFF' : colors.text }]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Categorías */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categorias.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryButton,
              { backgroundColor: categoriaSeleccionada === cat ? colors.primary : colors.surface }
            ]}
            onPress={() => setCategoriaSeleccionada(cat)}
          >
            <Text style={[
              styles.categoryText,
              { color: categoriaSeleccionada === cat ? '#FFFFFF' : colors.textSecondary, fontWeight: categoriaSeleccionada === cat ? '700' : '500' }
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de Juegos */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {juegosFiltrados.map((juego) => (
          <Card key={juego.id} variant="elevated" style={styles.gameCard}>
            <TouchableOpacity style={styles.gameCardInner} onPress={() => handlePlay(juego)}>
              <View style={[styles.gameIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={juego.icon as any} size={28} color={colors.primary} />
              </View>
              <View style={styles.gameInfo}>
                <Text style={[styles.gameName, { color: colors.text }]}>{juego.name}</Text>
                <Text style={[styles.gameDesc, { color: colors.textSecondary }]}>{juego.desc}</Text>
              </View>
              {progreso[juego.id] ? (
                <Ionicons name="checkmark-circle" size={28} color={colors.success} />
              ) : (
                <Ionicons name="play-circle" size={32} color={colors.primary} />
              )}
            </TouchableOpacity>
          </Card>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal Interactivo de Preguntas con Explicación de IA */}
      <Modal visible={selectedJuego !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedJuego?.name}</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Nivel {dificultad} • IA Groq</Text>
              </View>
              <IconButton icon="close" onPress={() => setSelectedJuego(null)} />
            </View>

            {loadingQuestions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.primary }]}>
                  🤖 Groq IA está creando 10 retos ({dificultad}) con explicaciones...
                </Text>
              </View>
            ) : gameFinished ? (
              <View style={styles.resultContainer}>
                <Ionicons name="trophy" size={64} color="#F59E0B" />
                <Text style={[styles.resultTitle, { color: colors.text }]}>¡Felicidades!</Text>
                <Text style={[styles.resultScore, { color: colors.textSecondary }]}>
                  Lograste {score} de {aiQuestions.length} aciertos en nivel {dificultad}
                </Text>
                <Button title="Volver a los juegos" onPress={() => setSelectedJuego(null)} />
              </View>
            ) : (
              <ScrollView style={styles.questionContainer}>
                <View style={[styles.progressBarBg, { backgroundColor: colors.surface }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${((currentQuestionIndex + 1) / (aiQuestions.length || 1)) * 100}%`
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                  Pregunta {currentQuestionIndex + 1} de {aiQuestions.length}
                </Text>
                <Text style={[styles.questionText, { color: colors.text }]}>{currentQ?.question}</Text>

                {currentQ?.options.map((option, idx) => {
                  let isSelected = selectedAnswerIndex === idx;
                  let isCorrect = idx === currentQ.answer;

                  let bgColor = colors.surface;
                  let textColor = colors.text;

                  if (showExplanation) {
                    if (isCorrect) {
                      bgColor = colors.success;
                      textColor = '#FFFFFF';
                    } else if (isSelected) {
                      bgColor = colors.error;
                      textColor = '#FFFFFF';
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.optionButton, { backgroundColor: bgColor }]}
                      onPress={() => handleSelectOption(idx)}
                      disabled={showExplanation}
                    >
                      <Text style={[styles.optionText, { color: textColor, fontWeight: showExplanation ? '700' : '500' }]}>{option}</Text>
                      {showExplanation && isCorrect && <Ionicons name="checkmark-circle" size={20} color="white" />}
                      {showExplanation && isSelected && !isCorrect && <Ionicons name="close-circle" size={20} color="white" />}
                    </TouchableOpacity>
                  );
                })}

                {showExplanation && (
                  <Card variant="flat" style={[styles.explanationCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.explanationHeader}>
                      <Ionicons
                        name={selectedAnswerIndex === currentQ?.answer ? 'checkmark-circle' : 'alert-circle'}
                        size={22}
                        color={selectedAnswerIndex === currentQ?.answer ? colors.success : colors.error}
                      />
                      <Text
                        style={[
                          styles.explanationTitle,
                          { color: selectedAnswerIndex === currentQ?.answer ? colors.success : colors.error },
                        ]}
                      >
                        {selectedAnswerIndex === currentQ?.answer ? '¡Correcto!' : '¡Casi lo logras! Explicación:'}
                      </Text>
                    </View>
                    <Text style={[styles.explanationBody, { color: colors.text }]}>{currentQ?.explanation}</Text>

                    <Button
                      title={currentQuestionIndex + 1 < aiQuestions.length ? 'Siguiente Pregunta ➡️' : 'Ver Resultados 🏆'}
                      onPress={handleNextQuestion}
                    />
                  </Card>
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
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  difficultyContainer: { marginBottom: 14 },
  difficultyLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  difficultyRow: { flexDirection: 'row', gap: 8 },
  diffChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  diffText: { fontSize: 13, fontWeight: '600' },
  categoriesContainer: { marginBottom: 16 },
  categoryButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  categoryText: { fontSize: 13 },
  gameCard: { marginBottom: 8, padding: 0 },
  gameCardInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  gameIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  gameInfo: { flex: 1 },
  gameName: { fontSize: 16, fontWeight: '700' },
  gameDesc: { fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  modalContent: { borderRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSubtitle: { fontSize: 12 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 16, fontSize: 14, textAlign: 'center', fontWeight: '600' },
  questionContainer: { flexGrow: 1 },
  progressBarBg: { height: 6, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, marginBottom: 8 },
  questionText: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  optionButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10 },
  optionText: { fontSize: 15 },
  explanationCard: { padding: 14, borderRadius: 16, marginTop: 12, marginBottom: 10 },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  explanationTitle: { fontSize: 14, fontWeight: '700' },
  explanationBody: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  resultContainer: { alignItems: 'center', paddingVertical: 20 },
  resultTitle: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  resultScore: { fontSize: 15, marginTop: 8, marginBottom: 20, textAlign: 'center' },
});