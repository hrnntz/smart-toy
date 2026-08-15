import React, { useCallback, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Label, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';
import { englishService } from '../../services/api';

interface ThemeItem {
  key: string;
  label: string;
  emoji: string;
  order: number;
  unlocked: boolean;
  completed: boolean;
}

interface Progress {
  nivel: string;
  palabrasAprendidas: number;
  racha: number;
  planDiarioMin: number;
  currentThemeIndex: number;
}

export default function InglesScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [primary, success, warning, muted, surface, background] = useThemeColor([
    'accent',
    'success',
    'warning',
    'muted',
    'surface',
    'background',
  ]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await englishService.getThemes();
      if (res.data.success) {
        setThemes(res.data.data.themes);
        setProgress(res.data.data.progress);
      }
    } catch (err: any) {
      console.error('Error cargando temas de inglés:', err);
      setError(
        err?.response?.status === 404
          ? 'Primero crea un perfil de niño para poder empezar a aprender inglés.'
          : 'No se pudo conectar con el servidor. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarga cada vez que se vuelve a esta pantalla (ej. al terminar una lección)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const nextTheme = themes.find((t) => t.unlocked && !t.completed);

  return (
    <View className="flex-1 bg-background px-4 pt-12">
      <View className="flex-row justify-between items-center mb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-2xl font-extrabold text-foreground">Aprender Inglés</Label>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={40} color={warning} />
          <Label className="text-base text-center text-foreground mt-3 mb-4">{error}</Label>
          <Button variant="secondary" onPress={load}>
            <Button.Label>Reintentar</Button.Label>
          </Button>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="bg-primary rounded-2xl p-5 mb-4 shadow-md">
            <Label className="text-sm font-medium text-white/80 mb-1">Nivel actual</Label>
            <Label className="text-3xl font-bold text-white mb-3">{progress?.nivel}</Label>
            <Label className="text-[13px] text-white font-medium">
              {progress?.palabrasAprendidas || 0} palabras aprendidas
            </Label>
          </View>

          <View className="flex-row gap-3 mb-5">
            <Card variant="default" className="flex-1 border-0 shadow-sm">
              <Card.Body className="p-4 items-center">
                <Ionicons name="flame" size={26} color={warning} />
                <Label className="text-lg font-bold text-warning mt-1">{progress?.racha || 0}</Label>
                <Label className="text-xs text-muted">días seguidos</Label>
              </Card.Body>
            </Card>
            <Card variant="default" className="flex-1 border-0 shadow-sm">
              <Card.Body className="p-4 items-center">
                <Ionicons name="time-outline" size={26} color={primary} />
                <Label className="text-lg font-bold text-primary mt-1">{progress?.planDiarioMin || 20}</Label>
                <Label className="text-xs text-muted">min al día</Label>
              </Card.Body>
            </Card>
          </View>

          <Label className="text-base font-semibold text-foreground mb-2">Temas</Label>

          {themes.map((theme) => (
            <Pressable
              key={theme.key}
              disabled={!theme.unlocked}
              onPress={() =>
                navigation.navigate('EnglishLesson', { themeKey: theme.key, themeLabel: theme.label })
              }
            >
              <Card variant="default" className={`mb-3 border-0 shadow-sm ${!theme.unlocked ? 'opacity-50' : ''}`}>
                <Card.Body className="p-4 flex-row items-center gap-3">
                  <Label className="text-3xl">{theme.emoji}</Label>
                  <View className="flex-1">
                    <Label className="text-base font-semibold text-foreground">{theme.label}</Label>
                    <Label className="text-xs text-muted mt-0.5">
                      {theme.completed ? 'Completado' : theme.unlocked ? 'Disponible' : 'Bloqueado'}
                    </Label>
                  </View>
                  <Ionicons
                    name={theme.completed ? 'checkmark-circle' : theme.unlocked ? 'chevron-forward' : 'lock-closed'}
                    size={22}
                    color={theme.completed ? success : theme.unlocked ? primary : muted}
                  />
                </Card.Body>
              </Card>
            </Pressable>
          ))}

          <Button
            variant="secondary"
            className="w-full mb-10 mt-2"
            disabled={!nextTheme}
            onPress={() =>
              nextTheme &&
              navigation.navigate('EnglishLesson', { themeKey: nextTheme.key, themeLabel: nextTheme.label })
            }
          >
            <Button.Label>{nextTheme ? `Empezar: ${nextTheme.label}` : '¡Completaste todos los temas!'}</Button.Label>
          </Button>
        </ScrollView>
      )}
    </View>
  );
}
