import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { storyService } from '../../services/api';

interface Historia {
  id: number;
  titulo: string;
  contenido: string;
  imagen: string | null;
  duracion: string;
  createdAt: string;
}

export default function HistoriasScreen({ navigation }: any) {
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'mis' | 'ia' | 'favoritas'>('mis');

  const loadHistorias = async () => {
    try {
      const response = await storyService.getAll();
      if (response.data.success) {
        setHistorias(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando historias:', error);
      Alert.alert('Error', 'No se pudieron cargar las historias');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistorias();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistorias();
  }, []);

  const handleDelete = (id: number, titulo: string) => {
    Alert.alert(
      'Eliminar historia',
      `¿Eliminar "${titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await storyService.delete(id);
              Alert.alert('Éxito', 'Historia eliminada');
              loadHistorias();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const openStoryDetail = (historia: Historia) => {
    navigation.navigate('HistoriaDetalle', { historia });
  };

  const goToGenerate = () => {
    navigation.navigate('GenerarHistoria');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Historias</Text>
        <TouchableOpacity style={styles.generateButtonHeader} onPress={goToGenerate}>
          <Ionicons name="sparkles" size={20} color="white" />
          <Text style={styles.generateButtonHeaderText}>Generar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mis' && styles.tabActive]}
          onPress={() => setActiveTab('mis')}
        >
          <Text style={[styles.tabText, activeTab === 'mis' && styles.tabActiveText]}>
            Mis historias
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ia' && styles.tabActive]}
          onPress={() => setActiveTab('ia')}
        >
          <Text style={[styles.tabText, activeTab === 'ia' && styles.tabActiveText]}>
            IA
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favoritas' && styles.tabActive]}
          onPress={() => setActiveTab('favoritas')}
        >
          <Text style={[styles.tabText, activeTab === 'favoritas' && styles.tabActiveText]}>
            Favoritas
          </Text>
        </TouchableOpacity>
      </View>

      {historias.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No tienes historias guardadas</Text>
          <Text style={styles.emptySub}>Genera una nueva con IA</Text>
        </View>
      ) : (
        historias.map((story) => (
          <TouchableOpacity
            key={story.id}
            style={styles.storyCard}
            onPress={() => openStoryDetail(story)}
            activeOpacity={0.7}
          >
            {story.imagen ? (
              <Image source={{ uri: story.imagen }} style={styles.storyImage} />
            ) : (
              <View style={styles.storyImagePlaceholder}>
                <Ionicons name="book" size={28} color="#E67E22" />
              </View>
            )}
            <View style={styles.storyInfo}>
              <Text style={styles.storyTitle} numberOfLines={1}>
                {story.titulo}
              </Text>
              <Text style={styles.storyDuration}>⏱ {story.duracion}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => openStoryDetail(story)}
                style={styles.actionButton}
              >
                <Ionicons name="eye" size={20} color="#3498DB" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(story.id, story.titulo)}
                style={styles.actionButton}
              >
                <Ionicons name="trash" size={20} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={styles.generateButton} onPress={goToGenerate}>
        <Ionicons name="sparkles" size={20} color="white" />
        <Text style={styles.generateButtonText}>Generar historia con IA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  generateButtonHeader: {
    flexDirection: 'row',
    backgroundColor: '#8E44AD',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  generateButtonHeaderText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  tabActive: {
    backgroundColor: '#4A90D9',
  },
  tabText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  tabActiveText: {
    color: 'white',
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  storyImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  storyImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#FEF5E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyInfo: {
    flex: 1,
    marginRight: 8,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  storyDuration: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#8E44AD',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 20,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});