import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Share,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Label, Spinner, useThemeColor, Button } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

const { width } = Dimensions.get('window');

export default function HistoriaDetalleScreen({ navigation, route }: any) {
  const { historia, isNew } = route.params || {};
  const { titulo, contenido, imagen, duracion } = historia || {};
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const [primary, secondary, muted, surface, background] = useThemeColor([
    'accent',
    'accent-soft',
    'muted',
    'surface',
    'background',
  ]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${titulo}\n\n${contenido}`,
        title: titulo,
      });
    } catch (error) {
      console.log('Error al compartir:', error);
    }
  };

  if (!historia) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-4">
        <Label className="text-lg text-muted mb-5">No se encontró la historia</Label>
        <Button variant="primary" onPress={() => navigation.goBack()}>
          <Button.Label>Volver</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-12 pb-4 border-b border-separator bg-card">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-lg font-bold text-foreground flex-1 text-center mx-2">
          {titulo || 'Historia'}
        </Label>
        <Pressable className="p-2" onPress={handleShare}>
          <Ionicons name="share-social" size={24} color={primary} />
        </Pressable>
      </View>

      {/* Imagen */}
      {imagen && !imageError ? (
        <View className="w-full h-52 bg-surface justify-center items-center mt-2 relative">
          <Image
            source={{ uri: imagen }}
            className="w-full h-full rounded-xl mx-4"
            style={{ width: width - 32 }}
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
          {imageLoading && (
            <View className="absolute inset-0 justify-center items-center bg-white/80 rounded-xl mx-4" style={{ width: width - 32 }}>
              <Spinner size="lg" color="secondary" />
            </View>
          )}
        </View>
      ) : (
        <View className="mx-4 h-[150px] bg-surface rounded-xl justify-center items-center mt-2">
          <Ionicons name="book" size={48} color={secondary} />
          <Label className="text-sm text-muted mt-2">Imagen no disponible</Label>
        </View>
      )}

      {/* Contenido */}
      <Card variant="default" className="m-4 p-5 border-0 shadow-sm">
        <Card.Body className="p-0">
          <Label className="text-2xl font-extrabold text-foreground mb-1">{titulo}</Label>
          <Label className="text-sm text-muted mb-3">⏱ {duracion || '10 min'}</Label>
          
          <View className="h-px bg-separator my-3" />
          
          <Label className="text-base leading-6 text-foreground font-medium">{contenido}</Label>
        </Card.Body>
      </Card>

      {isNew && (
        <View className="items-center mb-6 px-4">
          <View className="bg-secondary px-4 py-2 rounded-full">
            <Label className="text-white text-sm font-bold">✨ Nueva historia generada con IA</Label>
          </View>
        </View>
      )}
      
      <View className="h-10" />
    </ScrollView>
  );
}