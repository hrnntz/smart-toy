import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storyService } from '../../services/api';
import { Card, Button, Label, TextField, Input, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

export default function GenerarHistoriaScreen({ navigation }: any) {
  const [tema, setTema] = useState('');
  const [duracion, setDuracion] = useState('Media (10 min)');
  const [personajes, setPersonajes] = useState('');
  const [enseñanza, setEnseñanza] = useState('');
  const [loading, setLoading] = useState(false);

  const [primary, secondary, muted, surface] = useThemeColor([
    'accent',
    'secondary',
    'muted',
    'surface',
  ]);

  const duraciones = ['Corta (5 min)', 'Media (10 min)', 'Larga (15 min)'];

  const handleGenerate = async () => {
    if (!tema.trim()) {
      Alert.alert('Error', 'Por favor ingresa un tema');
      return;
    }

    setLoading(true);

    try {
      const response = await storyService.generate({
        tema: tema.trim(),
        duracion,
        personajes: personajes.trim() || undefined,
        enseñanza: enseñanza.trim() || undefined,
      });

      if (response.data.success) {
        const historia = response.data.data;
        navigation.replace('HistoriaDetalle', {
          historia: {
            id: historia.id,
            titulo: historia.titulo,
            contenido: historia.contenido,
            imagen: historia.imagen,
            duracion: historia.duracion,
          },
          isNew: true,
        });
      } else {
        Alert.alert('Error', response.data.message || 'Error al generar la historia');
      }
    } catch (error: any) {
      console.error('Error generando historia:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al generar la historia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-12" showsVerticalScrollIndicator={false}>
      <View className="flex-row justify-between items-center mb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-2xl font-extrabold text-foreground">Generar historia con IA</Label>
        <View className="w-10" />
      </View>

      <Card variant="default" className="p-5 mb-5 border-0">
        <Card.Body className="p-0">
          <Label className="text-sm font-semibold text-foreground mb-1.5">Tema *</Label>
          <TextField className="w-full mb-4">
            <Input
              placeholder="Ej: Un niño que viaja en el tiempo"
              value={tema}
              onChangeText={setTema}
            />
          </TextField>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Duración</Label>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {duraciones.map((d) => (
              <Pressable
                key={d}
                className="px-4 py-2 rounded-full border-2"
                style={{
                  backgroundColor: duracion === d ? 'rgba(74, 144, 217, 0.1)' : surface,
                  borderColor: duracion === d ? primary : 'transparent'
                }}
                onPress={() => setDuracion(d)}
              >
                <Label className={`text-sm ${duracion === d ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {d}
                </Label>
              </Pressable>
            ))}
          </View>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Personajes (opcional)</Label>
          <TextField className="w-full mb-4">
            <Input
              placeholder="Ej: Niño, dinosaurio, robot"
              value={personajes}
              onChangeText={setPersonajes}
            />
          </TextField>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Enseñanza (opcional)</Label>
          <TextField className="w-full mb-6">
            <Input
              placeholder="Ej: La importancia de ser valiente"
              value={enseñanza}
              onChangeText={setEnseñanza}
              multiline
              numberOfLines={3}
              className="min-h-[80px]"
            />
          </TextField>

          <Button
            variant="secondary"
            onPress={handleGenerate}
            isDisabled={loading}
            className="w-full flex-row gap-2"
          >
            {loading ? (
              <Spinner size="sm" color="default" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="white" />
                <Button.Label>Generar historia</Button.Label>
              </>
            )}
          </Button>
        </Card.Body>
      </Card>
      <View className="h-5" />
    </ScrollView>
  );
}