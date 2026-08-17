import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { gameService } from '../../services/api';
import { Card, Button, Label, Spinner, Chip, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

type Categoria = 'Todos' | 'Lógica' | 'Memoria' | 'Matemáticas' | 'Lectura';
type Dificultad = 'Fácil' | 'Medio' | 'Difícil';

interface Juego {
  id: number;
  name: string;
  desc: string;
  icon: string;
  categoria: Categoria;
  color: string;
}

interface Question {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

const JUEGOS: Juego[] = [
  { id: 1, name: 'Adivinanzas', desc: 'Ejercita la mente con enigmas divertidos', icon: 'bulb-outline', categoria: 'Lógica', color: '#7C3AED' },
  { id: 2, name: 'Colores & Formas', desc: 'Aprende colores y figuras', icon: 'color-palette-outline', categoria: 'Lógica', color: '#7C3AED' },
  { id: 3, name: 'Sumas & Restas', desc: 'Matemáticas básicas para niños', icon: 'calculator-outline', categoria: 'Matemáticas', color: '#3B82F6' },
  { id: 4, name: 'Memoria Panda', desc: 'Encuentra las parejas de cartas', icon: 'brain-outline', categoria: 'Memoria', color: '#10B981' },
  { id: 5, name: 'Ordenar palabras', desc: 'Forma la palabra correcta', icon: 'text-outline', categoria: 'Lectura', color: '#F59E0B' },
  { id: 6, name: 'Secuencias lógicas', desc: 'Encuentra el patrón', icon: 'git-compare-outline', categoria: 'Lógica', color: '#7C3AED' },
  { id: 7, name: 'Multiplicaciones básicas', desc: 'Tablas simples para primaria', icon: 'stats-chart-outline', categoria: 'Matemáticas', color: '#3B82F6' },
  { id: 8, name: 'Lectura comprensiva', desc: 'Comprende historias cortas', icon: 'book-outline', categoria: 'Lectura', color: '#F59E0B' },
];

const PROGRESS_KEY = 'juegos_progreso';

const DIFICULTAD_CONFIG: Record<Dificultad, { color: string; emoji: string }> = {
  'Fácil': { color: '#10B981', emoji: '🌱' },
  'Medio': { color: '#F59E0B', emoji: '⚡' },
  'Difícil': { color: '#EF4444', emoji: '🔥' },
};

export default function JuegosScreen({ navigation }: any) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria>('Todos');
  const [dificultad, setDificultad] = useState<Dificultad>('Fácil');
  const [progreso, setProgreso] = useState<Record<number, boolean>>({});
  const [selectedJuego, setSelectedJuego] = useState<Juego | null>(null);

  const [aiQuestions, setAiQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const [accent, success, danger, warning, muted, surface, foreground, surfaceSecondary] = useThemeColor([
    'accent',
    'success',
    'danger',
    'warning',
    'muted',
    'surface',
    'foreground',
    'surface-secondary',
  ]);

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
  const progressPercent = aiQuestions.length > 0
    ? ((currentQuestionIndex + 1) / aiQuestions.length) * 100
    : 0;

  const totalCompleted = Object.values(progreso).filter(Boolean).length;

  return (
    <View className="flex-1 bg-background">
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-xl font-extrabold text-foreground">Minijuegos IA</Label>
        <View className="bg-success/15 px-3 py-1.5 rounded-full">
          <Label className="text-xs font-bold text-success">{totalCompleted}/{JUEGOS.length} ✓</Label>
        </View>
      </View>

      {/* ── Dificultad Selector ── */}
      <View className="px-4 mb-3">
        <Label className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">Dificultad</Label>
        <View className="flex-row gap-2">
          {dificultades.map((d) => {
            const cfg = DIFICULTAD_CONFIG[d];
            const isActive = dificultad === d;
            return (
              <Pressable
                key={d}
                className="flex-1 py-2.5 rounded-2xl items-center flex-row justify-center gap-1.5"
                style={{
                  backgroundColor: isActive ? cfg.color + '20' : surfaceSecondary,
                  borderWidth: isActive ? 1.5 : 0,
                  borderColor: isActive ? cfg.color : 'transparent',
                }}
                onPress={() => setDificultad(d)}
              >
                <Label
                  className="text-xs font-bold"
                  style={{ color: isActive ? cfg.color : muted } as any}
                >
                  {cfg.emoji} {d}
                </Label>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Categorías Horizontales ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {categorias.map((cat) => {
          const isActive = categoriaSeleccionada === cat;
          return (
            <Pressable
              key={cat}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: isActive ? '#7C3AED' : surfaceSecondary,
              }}
              onPress={() => setCategoriaSeleccionada(cat)}
            >
              <Label
                className="text-xs font-bold"
                style={{ color: isActive ? '#FFFFFF' : muted } as any}
              >
                {cat}
              </Label>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Lista de Juegos ── */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        {juegosFiltrados.map((juego) => {
          const isCompleted = progreso[juego.id];
          return (
            <Pressable key={juego.id} onPress={() => handlePlay(juego)}>
              <Card variant="default" className="mb-3">
                <Card.Body>
                  <View className="flex-row items-center gap-3.5">
                    {/* Icon */}
                    <View
                      className="w-12 h-12 rounded-2xl justify-center items-center"
                      style={{ backgroundColor: juego.color + '18' }}
                    >
                      <Ionicons name={juego.icon as any} size={24} color={juego.color} />
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <Label className="text-base font-bold text-foreground">{juego.name}</Label>
                      <Label className="text-xs text-muted mt-0.5">{juego.desc}</Label>
                      <View className="flex-row items-center gap-1.5 mt-1.5">
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: juego.color + '18' }}
                        >
                          <Label className="text-[10px] font-bold" style={{ color: juego.color } as any}>
                            {juego.categoria}
                          </Label>
                        </View>
                      </View>
                    </View>

                    {/* Action */}
                    {isCompleted ? (
                      <View className="w-10 h-10 rounded-full bg-success/15 items-center justify-center">
                        <Ionicons name="checkmark" size={20} color={success} />
                      </View>
                    ) : (
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: juego.color + '18' }}
                      >
                        <Ionicons name="play" size={18} color={juego.color} />
                      </View>
                    )}
                  </View>
                </Card.Body>
              </Card>
            </Pressable>
          );
        })}
        <View className="h-8" />
      </ScrollView>

      {/* ── Modal de Juego ── */}
      <Modal visible={selectedJuego !== null} animationType="slide" transparent>
        <View className="flex-1 bg-black/65 justify-end">
          <View
            className="bg-surface rounded-t-[32px] p-5"
            style={{ maxHeight: '88%' }}
          >
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1">
                <Label className="text-lg font-extrabold text-foreground">
                  {selectedJuego?.name}
                </Label>
                <View className="flex-row items-center gap-2 mt-0.5">
                  <Label className="text-xs text-muted">
                    {DIFICULTAD_CONFIG[dificultad].emoji} {dificultad}
                  </Label>
                  <Label className="text-xs text-muted">·</Label>
                  <Label className="text-xs text-muted">🤖 Groq IA</Label>
                </View>
              </View>
              <IconButton icon="close" onPress={() => setSelectedJuego(null)} />
            </View>

            {/* Modal Content */}
            {loadingQuestions ? (
              <View className="items-center py-12">
                <Spinner size="lg" color="primary" />
                <Label className="mt-5 text-sm text-center font-semibold text-foreground">
                  Generando 10 preguntas con IA...
                </Label>
                <Label className="mt-1.5 text-xs text-center text-muted">
                  Nivel {dificultad} · {selectedJuego?.categoria}
                </Label>
              </View>
            ) : gameFinished ? (
              <View className="items-center py-8">
                <View className="w-24 h-24 rounded-full bg-warning/15 items-center justify-center mb-4">
                  <Ionicons name="trophy" size={48} color={warning} />
                </View>
                <Label className="text-2xl font-extrabold text-foreground">¡Felicidades!</Label>
                <Label className="text-base text-muted mt-2 mb-2 text-center">
                  Lograste {score} de {aiQuestions.length} aciertos
                </Label>
                <View
                  className="px-5 py-2 rounded-full mb-6"
                  style={{
                    backgroundColor: score >= aiQuestions.length * 0.7 ? '#10B981' + '20' : '#F59E0B' + '20',
                  }}
                >
                  <Label
                    className="text-sm font-bold"
                    style={{
                      color: score >= aiQuestions.length * 0.7 ? success : warning,
                    } as any}
                  >
                    {score >= aiQuestions.length * 0.7 ? '⭐ ¡Excelente!' : '📚 ¡Sigue practicando!'}
                  </Label>
                </View>
                <Button variant="primary" feedbackVariant="scale-ripple" onPress={() => setSelectedJuego(null)} className="w-full">
                  <Button.Label>Volver a los juegos</Button.Label>
                </Button>
              </View>
            ) : currentQ ? (
              <ScrollView className="flex-grow" showsVerticalScrollIndicator={false}>
                {/* Progress Bar */}
                <View className="h-1.5 rounded-full bg-surface-secondary mb-1 overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: selectedJuego?.color || accent,
                      width: `${progressPercent}%`,
                    }}
                  />
                </View>
                <Label className="text-xs text-muted mb-4">
                  Pregunta {currentQuestionIndex + 1} de {aiQuestions.length} · Puntos: {score}
                </Label>

                {/* Question */}
                <Label className="text-[17px] font-bold text-foreground leading-6 mb-5">
                  {currentQ.question}
                </Label>

                {/* Options */}
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedAnswerIndex === idx;
                  const isCorrect = idx === currentQ.answer;

                  let bgColor = surfaceSecondary;
                  let borderColor = 'transparent';
                  let textColor = foreground;

                  if (showExplanation) {
                    if (isCorrect) {
                      bgColor = success + '20';
                      borderColor = success;
                      textColor = success;
                    } else if (isSelected && !isCorrect) {
                      bgColor = danger + '20';
                      borderColor = danger;
                      textColor = danger;
                    }
                  } else if (isSelected) {
                    bgColor = (selectedJuego?.color || accent) + '15';
                    borderColor = selectedJuego?.color || accent;
                  }

                  return (
                    <Pressable
                      key={idx}
                      className="flex-row items-center p-4 rounded-2xl mb-2.5"
                      style={{
                        backgroundColor: bgColor,
                        borderWidth: 1.5,
                        borderColor,
                      }}
                      onPress={() => handleSelectOption(idx)}
                      disabled={showExplanation}
                    >
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center mr-3"
                        style={{
                          backgroundColor: showExplanation && isCorrect
                            ? success
                            : showExplanation && isSelected && !isCorrect
                            ? danger
                            : (selectedJuego?.color || accent) + '20',
                        }}
                      >
                        {showExplanation && isCorrect ? (
                          <Ionicons name="checkmark" size={16} color="white" />
                        ) : showExplanation && isSelected && !isCorrect ? (
                          <Ionicons name="close" size={16} color="white" />
                        ) : (
                          <Label
                            className="text-xs font-extrabold"
                            style={{ color: selectedJuego?.color || accent } as any}
                          >
                            {String.fromCharCode(65 + idx)}
                          </Label>
                        )}
                      </View>
                      <Label
                        className="flex-1 text-[15px] font-semibold"
                        style={{ color: textColor } as any}
                      >
                        {option}
                      </Label>
                    </Pressable>
                  );
                })}

                {/* Explanation Card */}
                {showExplanation && (
                  <Card
                    variant="secondary"
                    className="mt-3 mb-4"
                  >
                    <Card.Body>
                      <View className="flex-row items-center gap-2 mb-2">
                        <Ionicons
                          name={selectedAnswerIndex === currentQ.answer ? 'checkmark-circle' : 'information-circle'}
                          size={20}
                          color={selectedAnswerIndex === currentQ.answer ? success : warning}
                        />
                        <Label
                          className="text-sm font-bold"
                          style={{ color: selectedAnswerIndex === currentQ.answer ? success : warning } as any}
                        >
                          {selectedAnswerIndex === currentQ.answer ? '¡Correcto!' : 'Explicación:'}
                        </Label>
                      </View>
                      <Label className="text-[13px] leading-5 text-foreground mb-4">
                        {currentQ.explanation}
                      </Label>
                      <Button
                        variant="primary"
                        feedbackVariant="scale-ripple"
                        onPress={handleNextQuestion}
                      >
                        <Button.Label>
                          {currentQuestionIndex + 1 < aiQuestions.length
                            ? 'Siguiente →'
                            : 'Ver Resultados 🏆'}
                        </Button.Label>
                      </Button>
                    </Card.Body>
                  </Card>
                )}
                <View className="h-4" />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}