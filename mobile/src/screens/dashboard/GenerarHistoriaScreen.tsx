// mobile/src/screens/dashboard/GenerarHistoriaScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storyService } from '../../services/api';

export default function GenerarHistoriaScreen({ navigation }: any) {
  const [tema, setTema] = useState('');
  const [duracion, setDuracion] = useState('Media (10 min)');
  const [personajes, setPersonajes] = useState('');
  const [enseñanza, setEnseñanza] = useState('');
  const [loading, setLoading] = useState(false);

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generar historia con IA</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Tema *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Un niño que viaja en el tiempo"
          value={tema}
          onChangeText={setTema}
        />

        <Text style={styles.label}>Duración</Text>
        <View style={styles.optionsRow}>
          {duraciones.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.optionButton, duracion === d && styles.optionButtonActive]}
              onPress={() => setDuracion(d)}
            >
              <Text style={[styles.optionText, duracion === d && styles.optionTextActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Personajes (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Niño, dinosaurio, robot"
          value={personajes}
          onChangeText={setPersonajes}
        />

        <Text style={styles.label}>Enseñanza (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ej: La importancia de ser valiente"
          value={enseñanza}
          onChangeText={setEnseñanza}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="sparkles" size={24} color="white" />
              <Text style={styles.generateButtonText}>Generar historia</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#4A90D9',
  },
  optionText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  optionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#8E44AD',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});