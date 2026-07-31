import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { childService } from '../../services/api';

export default function PerfilScreen({ navigation, route }: any) {
  const child = route?.params?.child;
  const isEditing = !!child;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: child?.id || 0,
    name: child?.name || '',
    birthDate: child?.birthDate || '',
    // Campos adicionales del perfil (se guardan en la base de datos)
    age: '',
    language: 'Español',
    bedtime: '08:30 PM',
    energyLevel: 'Media',
    personality: 'Amigable y divertido',
  });

  useEffect(() => {
    if (child) {
      setLoading(false);
    }
  }, [child]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      // Actualizar el niño en la base de datos
      const response = await childService.update(formData.id, {
        name: formData.name,
        birthDate: formData.birthDate || undefined,
      });

      if (response.data.success) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data.message || 'No se pudo actualizar');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Nombre del niño"
        />

        <Text style={styles.label}>Fecha de nacimiento</Text>
        <TextInput
          style={styles.input}
          value={formData.birthDate}
          onChangeText={(text) => setFormData({ ...formData, birthDate: text })}
          placeholder="YYYY-MM-DD (ej: 2020-05-15)"
        />

        <Text style={styles.label}>Idioma</Text>
        <TextInput
          style={styles.input}
          value={formData.language}
          onChangeText={(text) => setFormData({ ...formData, language: text })}
          placeholder="Idioma"
        />

        <Text style={styles.label}>Hora de dormir</Text>
        <TextInput
          style={styles.input}
          value={formData.bedtime}
          onChangeText={(text) => setFormData({ ...formData, bedtime: text })}
          placeholder="Ej: 08:30 PM"
        />

        <Text style={styles.label}>Nivel de energía</Text>
        <View style={styles.optionsRow}>
          {['Baja', 'Media', 'Alta'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.optionButton,
                formData.energyLevel === level && styles.optionButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, energyLevel: level })}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.energyLevel === level && styles.optionTextActive,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Personalidad de Panda</Text>
        <View style={styles.optionsRow}>
          {['Amigable y divertido', 'Tranquilo', 'Educativo'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.optionButton,
                formData.personality === type && styles.optionButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, personality: type })}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.personality === type && styles.optionTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar perfil</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Eliminar perfil',
              `¿Estás seguro de eliminar a ${formData.name}?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await childService.delete(formData.id);
                      Alert.alert('Éxito', 'Perfil eliminado');
                      navigation.goBack();
                    } catch (error) {
                      Alert.alert('Error', 'No se pudo eliminar');
                    }
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.deleteButtonText}>Eliminar perfil</Text>
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
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
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
  saveButton: {
    backgroundColor: '#4A90D9',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  deleteButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
  },
});