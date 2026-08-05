import React, { useState, useCallback } from 'react';
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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { storyService } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Historia {
  id: number;
  titulo: string;
  contenido: string;
  imagen: string | null;
  duracion: string;
  createdAt: string;
}

export default function HistoriasScreen({ navigation }: any) {
  const { colors, typography, isDark } = useTheme();

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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Cuentos e Historias</Text>
        <TouchableOpacity
          style={[styles.generateButtonHeader, { backgroundColor: colors.secondary }]}
          onPress={goToGenerate}
        >
          <Ionicons name="sparkles" size={18} color="white" />
          <Text style={styles.generateButtonHeaderText}>Crear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {(['mis', 'ia', 'favoritas'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              { backgroundColor: activeTab === tab ? colors.primary : colors.surface }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? '#FFFFFF' : colors.textSecondary, fontWeight: activeTab === tab ? '700' : '500' }
            ]}>
              {tab === 'mis' ? 'Mis historias' : tab === 'ia' ? 'IA Cuentos' : 'Favoritas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {historias.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No tienes historias guardadas</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Genera una nueva cuento mágico con IA</Text>
        </View>
      ) : (
        historias.map((story) => (
          <Card key={story.id} variant="elevated" style={styles.storyCard}>
            <TouchableOpacity
              style={styles.storyCardInner}
              onPress={() => openStoryDetail(story)}
              activeOpacity={0.8}
            >
              {story.imagen ? (
                <Image source={{ uri: story.imagen }} style={styles.storyImage} />
              ) : (
                <View style={[styles.storyImagePlaceholder, { backgroundColor: colors.secondary + '15' }]}>
                  <Ionicons name="book" size={26} color={colors.secondary} />
                </View>
              )}
              <View style={styles.storyInfo}>
                <Text style={[styles.storyTitle, { color: colors.text }]} numberOfLines={1}>
                  {story.titulo}
                </Text>
                <Text style={[styles.storyDuration, { color: colors.textSecondary }]}>⏱ {story.duracion}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => openStoryDetail(story)}
                  style={styles.actionButton}
                >
                  <Ionicons name="eye" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(story.id, story.titulo)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Card>
        ))
      )}

      <Button
        title="Generar historia con IA"
        variant="secondary"
        onPress={goToGenerate}
        style={{ marginVertical: 20 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  generateButtonHeader: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  generateButtonHeaderText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
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
  },
  tabText: {
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    marginTop: 4,
  },
  storyCard: {
    marginBottom: 12,
    padding: 0,
  },
  storyCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  storyImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  storyImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyInfo: {
    flex: 1,
    marginRight: 8,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  storyDuration: {
    fontSize: 13,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    padding: 6,
  },
});