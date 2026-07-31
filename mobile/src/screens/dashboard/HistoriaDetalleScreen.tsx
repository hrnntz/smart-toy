import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HistoriaDetalleScreen({ navigation, route }: any) {
  const { historia, isNew } = route.params || {};
  const { titulo, contenido, imagen, duracion } = historia || {};
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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
      <View style={styles.center}>
        <Text style={styles.centerText}>No se encontró la historia</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonCenter}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {titulo || 'Historia'}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-social" size={24} color="#2C3E50" />
        </TouchableOpacity>
      </View>

      {/* Imagen - ahora con tamaño controlado y sin parpadeos */}
      {imagen && !imageError ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imagen }}
            style={styles.storyImage}
            resizeMode="contain"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
          {imageLoading && (
            <View style={styles.imageLoader}>
              <ActivityIndicator size="large" color="#8E44AD" />
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.imageContainer, styles.imagePlaceholder]}>
          <Ionicons name="book" size={48} color="#8E44AD" />
          <Text style={styles.imagePlaceholderText}>Imagen no disponible</Text>
        </View>
      )}

      {/* Contenido */}
      <View style={styles.contentContainer}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.duracion}>⏱ {duracion || '10 min'}</Text>
        <View style={styles.divider} />
        <Text style={styles.contenido}>{contenido}</Text>
      </View>

      {isNew && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badge}>✨ Nueva historia generada con IA</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centerText: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 20,
  },
  backButtonCenter: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
    textAlign: 'center',
  },
  shareButton: { padding: 4 },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 8,
  },
  storyImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  imagePlaceholder: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    marginHorizontal: 16,
    width: width - 32,
    height: 150,
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  contentContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  duracion: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  contenido: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2C3E50',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#8E44AD',
    color: 'white',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600',
  },
});