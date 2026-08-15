import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Alert, Pressable, Image } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Label, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';
import { englishService } from '../../services/api';
import { playAudio, stopAudio } from '../../services/audioService';

interface WordItem {
  id: number;
  english: string;
  spanish: string;
  imageUrl: string;
}

type Phase = 'loading' | 'intro' | 'ready' | 'recording' | 'checking' | 'feedback' | 'done' | 'error';

export default function EnglishLessonScreen({ navigation, route }: any) {
  const { themeKey, themeLabel } = route.params || {};

  const [phase, setPhase] = useState<Phase>('loading');
  const [words, setWords] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const isBusyRef = useRef(false);

  const [primary, success, danger, muted, background] = useThemeColor([
    'accent',
    'success',
    'danger',
    'muted',
    'background',
  ]);

  useEffect(() => {
    loadTheme();
    return () => {
      stopAudio();
    };
  }, []);

  const loadTheme = async () => {
    try {
      setPhase('loading');
      const res = await englishService.getThemeContent(themeKey);
      if (res.data.success) {
        setWords(res.data.data.words);
        setCurrentIndex(0);
        setCorrectCount(0);
        playWordIntro(res.data.data.words[0]);
      }
    } catch (err) {
      console.error('Error cargando lección:', err);
      setPhase('error');
    }
  };

  const currentWord = words[currentIndex];

  const playWordIntro = async (word: WordItem) => {
    setPhase('intro');
    try {
      const text = `${word.english}. ${word.english}. Significa ${word.spanish} en español. Repite conmigo: ${word.english}.`;
      const res = await englishService.speak(text);
      const audioUrl = res.data?.data?.audioUrl;
      if (audioUrl) await playAudio(audioUrl);
    } catch (err) {
      console.error('Error reproduciendo la palabra:', err);
    } finally {
      setPhase('ready');
    }
  };

  const replayWord = () => {
    if (currentWord) playWordIntro(currentWord);
  };

  const startRecording = async () => {
    if (isBusyRef.current) return;
    try {
      await stopAudio();
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos el micrófono para que puedas practicar en voz alta.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setPhase('recording');
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
    }
  };

  const stopRecording = async () => {
    if (!recording || isBusyRef.current || !currentWord) return;
    isBusyRef.current = true;
    setPhase('checking');

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });

      if (!uri) {
        isBusyRef.current = false;
        setPhase('ready');
        return;
      }

      const res = await englishService.checkPronunciation(uri, currentWord.english);
      const { correct, feedbackText, feedbackAudioUrl } = res.data.data;

      setFeedback({ correct, text: feedbackText });
      setPhase('feedback');
      if (correct) setCorrectCount((c) => c + 1);

      if (feedbackAudioUrl) await playAudio(feedbackAudioUrl);

      if (correct) {
        setTimeout(() => goNext(), 1200);
      }
    } catch (err) {
      console.error('Error verificando pronunciación:', err);
      Alert.alert('Error', 'No se pudo verificar tu pronunciación. Intenta de nuevo.');
      setPhase('ready');
    } finally {
      isBusyRef.current = false;
    }
  };

  const goNext = () => {
    setFeedback(null);
    const next = currentIndex + 1;
    if (next < words.length) {
      setCurrentIndex(next);
      playWordIntro(words[next]);
    } else {
      finishLesson();
    }
  };

  const finishLesson = async () => {
    setPhase('done');
    try {
      await englishService.completeTheme(themeKey, correctCount, words.length);
    } catch (err) {
      console.error('Error guardando el progreso:', err);
    }
  };

  if (phase === 'loading') {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={40} color={danger} />
        <Label className="text-base text-center text-foreground mt-3 mb-4">
          No se pudo cargar la lección. Revisa que el backend esté encendido.
        </Label>
        <Button variant="secondary" onPress={loadTheme}>
          <Button.Label>Reintentar</Button.Label>
        </Button>
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Label className="text-5xl mb-3">🎉</Label>
        <Label className="text-2xl font-bold text-foreground mb-2">¡Lección terminada!</Label>
        <Label className="text-base text-muted mb-6">
          {correctCount} de {words.length} palabras correctas
        </Label>
        <Button variant="primary" onPress={() => navigation.goBack()}>
          <Button.Label>Volver a Inglés</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-12">
      <View className="flex-row justify-between items-center mb-4">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-lg font-bold text-foreground">{themeLabel}</Label>
        <Label className="text-sm font-semibold text-muted">
          {currentIndex + 1}/{words.length}
        </Label>
      </View>

      <View className="h-2 bg-surface rounded-full overflow-hidden mb-6">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${((currentIndex + (feedback?.correct ? 1 : 0)) / words.length) * 100}%` }}
        />
      </View>

      {currentWord && (
        <Card variant="default" className="items-center p-6 mb-6 border-0 shadow-md">
          <View className="w-48 h-48 rounded-2xl overflow-hidden bg-surface mb-4 items-center justify-center">
            {currentWord.imageUrl ? (
              <Image source={{ uri: currentWord.imageUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Ionicons name="image-outline" size={48} color={muted} />
            )}
          </View>
          <Label className="text-3xl font-extrabold text-foreground mb-1">{currentWord.english}</Label>
          <Label className="text-base text-muted">{currentWord.spanish}</Label>

          <Pressable
            className="flex-row items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-surface"
            onPress={replayWord}
            disabled={phase === 'intro'}
          >
            <Ionicons name="volume-high" size={18} color={primary} />
            <Label className="text-sm font-semibold text-primary">Escuchar de nuevo</Label>
          </Pressable>
        </Card>
      )}

      {feedback && (
        <View
          className={`flex-row items-center justify-center gap-2 p-3 rounded-2xl mb-4 ${
            feedback.correct ? 'bg-success/10' : 'bg-warning/10'
          }`}
        >
          <Ionicons
            name={feedback.correct ? 'checkmark-circle' : 'refresh-circle'}
            size={22}
            color={feedback.correct ? success : primary}
          />
          <Label className={`font-semibold ${feedback.correct ? 'text-success' : 'text-foreground'}`}>
            {feedback.text}
          </Label>
        </View>
      )}

      <View className="items-center mt-2">
        <Pressable
          className={`w-20 h-20 rounded-full justify-center items-center shadow-md ${
            phase === 'recording' ? 'bg-danger' : phase === 'intro' || phase === 'checking' ? 'bg-muted' : 'bg-success'
          }`}
          onPressIn={phase === 'ready' || phase === 'feedback' ? startRecording : undefined}
          onPressOut={phase === 'recording' ? stopRecording : undefined}
          disabled={phase === 'intro' || phase === 'checking'}
        >
          <Ionicons
            name={phase === 'checking' ? 'hourglass' : phase === 'recording' ? 'stop-circle' : 'mic'}
            size={34}
            color="white"
          />
        </Pressable>
        <Label className="text-sm text-muted mt-2">
          {phase === 'recording'
            ? 'Grabando... suelta cuando termines'
            : phase === 'checking'
            ? 'Escuchando lo que dijiste...'
            : 'Mantén presionado y repite la palabra'}
        </Label>

        {feedback && !feedback.correct && (
          <Button variant="secondary" className="mt-4" onPress={goNext}>
            <Button.Label>Saltar a la siguiente</Button.Label>
          </Button>
        )}
      </View>
    </View>
  );
}
