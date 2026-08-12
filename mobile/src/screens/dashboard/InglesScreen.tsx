import React, { useState } from 'react';
import {
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Label, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

export default function InglesScreen({ navigation }: any) {
  const [nivel, setNivel] = useState('A2 - Básico');
  const [planDiario, setPlanDiario] = useState(20);
  const [palabrasAprendidas, setPalabrasAprendidas] = useState(28);
  const [totalPalabras, setTotalPalabras] = useState(50);
  const [racha, setRacha] = useState(5);

  const [primary, success, warning, muted, surface, background] = useThemeColor([
    'accent',
    'success',
    'warning',
    'muted',
    'surface',
    'background',
  ]);

  return (
    <View className="flex-1 bg-background px-4 pt-12">
      <View className="flex-row justify-between items-center mb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-2xl font-extrabold text-foreground">Aprender Inglés</Label>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-primary rounded-2xl p-5 mb-4 shadow-md">
          <Label className="text-sm font-medium text-white/80 mb-1">Nivel actual</Label>
          <Label className="text-3xl font-bold text-white mb-3">{nivel}</Label>
          <View className="h-2 bg-white/30 rounded-full overflow-hidden">
            <View className="h-full bg-white rounded-full" style={{ width: '60%' }} />
          </View>
          <Label className="text-[13px] text-white font-medium mt-2">60% completado</Label>
        </View>

        <Card variant="default" className="mb-3 border-0 shadow-sm">
          <Card.Body className="p-4 flex-row items-center gap-3">
            <Ionicons name="time-outline" size={26} color={primary} />
            <Label className="text-base font-semibold text-foreground flex-1">Plan diario</Label>
            <Label className="text-base font-bold text-primary">{planDiario} min</Label>
          </Card.Body>
        </Card>

        <Card variant="default" className="mb-3 border-0 shadow-sm">
          <Card.Body className="p-4">
            <Label className="text-base font-semibold text-foreground mb-1">📚 Lección de hoy</Label>
            <Label className="text-xl font-bold text-foreground mb-2">Animales</Label>
            
            <View className="flex-row justify-between items-center mb-2">
              <Label className="text-sm text-muted">Palabras aprendidas</Label>
              <Label className="text-sm font-semibold text-foreground">
                {palabrasAprendidas} / {totalPalabras}
              </Label>
            </View>
            <View className="h-2 bg-surface rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: primary,
                  width: `${(palabrasAprendidas / totalPalabras) * 100}%`
                }}
              />
            </View>
          </Card.Body>
        </Card>

        <Card variant="default" className="mb-5 border-0 shadow-sm">
          <Card.Body className="p-4 flex-row items-center gap-3">
            <Ionicons name="flame" size={26} color={warning} />
            <Label className="text-base font-semibold text-foreground flex-1">Racha actual</Label>
            <Label className="text-lg font-bold text-warning">{racha} días</Label>
          </Card.Body>
        </Card>

        <Button variant="solid" color={success} className="w-full mb-10">
          <Button.Label>Empezar lección</Button.Label>
        </Button>
      </ScrollView>
    </View>
  );
}