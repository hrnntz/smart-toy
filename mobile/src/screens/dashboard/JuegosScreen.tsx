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
import { Card, Button, Label, Spinner, useThemeColor } from 'heroui-native';
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

  const [primary, success, danger, warning, muted, surface, text] = useThemeColor([
    'accent',
    'success',
    'danger',
    'warning',
    'muted',
    'surface',
    'foreground'
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

  return (
    <View className="flex-1 bg-background px-4 pt-12">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-xl font-extrabold text-foreground">Minijuegos con IA</Label>
        <View className="w-10" />
      </View>

      {/* Selector de Dificultad */}
      <View className="mb-4">
        <Label className="text-[13px] font-bold text-muted mb-1.5">Dificultad:</Label>
        <View className="flex-row gap-2">
          {dificultades.map((d) => (
            <Pressable
              key={d}
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: dificultad === d ? primary : surface }}
              onPress={() => setDificultad(d)}
            >
              <Label className={`text-[13px] font-semibold ${dificultad === d ? 'text-white' : 'text-foreground'}`}>
                {d}
              </Label>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Categorías */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ paddingRight: 16 }}>
        {categorias.map((cat) => (
          <Pressable
            key={cat}
            className="px-3.5 py-2 rounded-full mr-2"
            style={{ backgroundColor: categoriaSeleccionada === cat ? primary : surface }}
            onPress={() => setCategoriaSeleccionada(cat)}
          >
            <Label className={`text-[13px] ${categoriaSeleccionada === cat ? 'text-white font-bold' : 'text-muted font-medium'}`}>
              {cat}
            </Label>
          </Pressable>
        ))}
      </ScrollView>

      {/* Lista de Juegos */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {juegosFiltrados.map((juego) => (
          <Card key={juego.id} variant="default" className="mb-2">
            <Pressable className="flex-row items-center p-4" onPress={() => handlePlay(juego)}>
              <View className="w-11 h-11 rounded-full bg-primary/15 justify-center items-center mr-3">
                <Ionicons name={juego.icon as any} size={24} color={primary} />
              </View>
              <View className="flex-1 mr-2">
                <Label className="text-base font-bold text-foreground">{juego.name}</Label>
                <Label className="text-xs text-muted mt-0.5">{juego.desc}</Label>
              </View>
              {progreso[juego.id] ? (
                <Ionicons name="checkmark-circle" size={28} color={success} />
              ) : (
                <Ionicons name="play-circle" size={32} color={primary} />
              )}
            </Pressable>
          </Card>
        ))}
        <View className="h-5" />
      </ScrollView>

      {/* Modal Interactivo de Preguntas con Explicación de IA */}
      <Modal visible={selectedJuego !== null} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-center p-4">
          <View className="bg-card rounded-[24px] p-5 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-3.5">
              <View className="flex-1">
                <Label className="text-lg font-extrabold text-foreground">{selectedJuego?.name}</Label>
                <Label className="text-xs text-muted">Nivel {dificultad} • IA Groq</Label>
              </View>
              <IconButton icon="close" onPress={() => setSelectedJuego(null)} />
            </View>

            {loadingQuestions ? (
              <View className="items-center py-10">
                <Spinner size="lg" color="primary" />
                <Label className="mt-4 text-sm text-center font-semibold text-primary">
                  🤖 Groq IA está creando 10 retos ({dificultad}) con explicaciones...
                </Label>
              </View>
            ) : gameFinished ? (
              <View className="items-center py-5">
                <Ionicons name="trophy" size={64} color={warning} />
                <Label className="text-[22px] font-extrabold text-foreground mt-3">¡Felicidades!</Label>
                <Label className="text-[15px] text-muted mt-2 mb-5 text-center">
                  Lograste {score} de {aiQuestions.length} aciertos en nivel {dificultad}
                </Label>
                <Button variant="primary" onPress={() => setSelectedJuego(null)}>
                  <Button.Label>Volver a los juegos</Button.Label>
                </Button>
              </View>
            ) : (
              <ScrollView className="flex-grow">
                <View className="h-1.5 rounded-full bg-surface mb-2.5 overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: primary,
                      width: `${((currentQuestionIndex + 1) / (aiQuestions.length || 1)) * 100}%`
                    }}
                  />
                </View>
                <Label className="text-xs text-muted mb-2">
                  Pregunta {currentQuestionIndex + 1} de {aiQuestions.length}
                </Label>
                <Label className="text-[17px] font-bold text-foreground mb-4">
                  {currentQ?.question}
                </Label>

                {currentQ?.options.map((option, idx) => {
                  let isSelected = selectedAnswerIndex === idx;
                  let isCorrect = idx === currentQ.answer;

                  let bgColor = surface;
                  let textColor = text;

                  if (showExplanation) {
                    if (isCorrect) {
                      bgColor = success;
                      textColor = '#FFFFFF';
                    } else if (isSelected) {
                      bgColor = danger;
                      textColor = '#FFFFFF';
                    }
                  }

                  return (
                    <Pressable
                      key={idx}
                      className="flex-row justify-between items-center p-3.5 rounded-2xl mb-2.5"
                      style={{ backgroundColor: bgColor }}
                      onPress={() => handleSelectOption(idx)}
                      disabled={showExplanation}
                    >
                      <Label className={`text-[15px] ${showExplanation ? 'font-bold' : 'font-medium'}`} style={{ color: textColor }}>
                        {option}
                      </Label>
                      {showExplanation && isCorrect && <Ionicons name="checkmark-circle" size={20} color="white" />}
                      {showExplanation && isSelected && !isCorrect && <Ionicons name="close-circle" size={20} color="white" />}
                    </Pressable>
                  );
                })}

                {showExplanation && (
                  <Card variant="flat" className="p-3.5 rounded-2xl mt-3 mb-2.5 bg-surface border-0">
                    <Card.Body className="p-0">
                      <View className="flex-row items-center gap-1.5 mb-1.5">
                        <Ionicons
                          name={selectedAnswerIndex === currentQ?.answer ? 'checkmark-circle' : 'alert-circle'}
                          size={22}
                          color={selectedAnswerIndex === currentQ?.answer ? success : danger}
                        />
                        <Label
                          className="text-sm font-bold"
                          style={{ color: selectedAnswerIndex === currentQ?.answer ? success : danger }}
                        >
                          {selectedAnswerIndex === currentQ?.answer ? '¡Correcto!' : '¡Casi lo logras! Explicación:'}
                        </Label>
                      </View>
                      <Label className="text-[13px] leading-[18px] text-foreground mb-3">
                        {currentQ?.explanation}
                      </Label>

                      <Button
                        variant="primary"
                        onPress={handleNextQuestion}
                      >
                        <Button.Label>
                          {currentQuestionIndex + 1 < aiQuestions.length ? 'Siguiente Pregunta ➡️' : 'Ver Resultados 🏆'}
                        </Button.Label>
                      </Button>
                    </Card.Body>
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