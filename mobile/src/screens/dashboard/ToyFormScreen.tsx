import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toyService, childService } from '../../services/api';

interface Child {
  id: number;
  name: string;
}

interface ToyFormScreenProps {
  navigation: any;
  route?: {
    params?: {
      toy?: {
        id: number;
        name: string;
        serialNumber: string;
        childId?: number;
      };
    };
  };
}

export default function ToyFormScreen({ navigation, route }: ToyFormScreenProps) {
  const toy = route?.params?.toy;
  const isEditing = !!toy;

  const [name, setName] = useState(toy?.name || '');
  const [serialNumber, setSerialNumber] = useState(toy?.serialNumber || '');
  const [childId, setChildId] = useState<number | undefined>(toy?.childId);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(true);

  const loadChildren = async () => {
    try {
      const response = await childService.getAll();
      if (response.data.success) {
        setChildren(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoadingChildren(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!serialNumber.trim()) {
      Alert.alert('Error', 'El número de serie es obligatorio');
      return;
    }

    setLoading(true);

    try {
      let response;
      const data = {
        name: name.trim(),
        serialNumber: serialNumber.trim(),
        childId: childId || undefined,
      };

      if (isEditing) {
        response = await toyService.update(toy.id, data);
      } else {
        response = await toyService.create(data);
      }

      if (response.data.success) {
        Alert.alert('Éxito', isEditing ? 'Juguete actualizado' : 'Juguete creado');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data.message || 'Error al guardar');
      }
    } catch (error: any) {
      console.error('Error saving toy:', error);
      Alert.alert('Error', error.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Juguete' : 'Nuevo Juguete'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre del juguete"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Número de serie *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: TOY-001-ABC"
          value={serialNumber}
          onChangeText={setSerialNumber}
        />

        <Text style={styles.label}>Asignar a niño (opcional)</Text>
        {loadingChildren ? (
          <ActivityIndicator size="small" color="#4A90D9" />
        ) : (
          <View style={styles.childSelector}>
            <TouchableOpacity
              style={[
                styles.childOption,
                childId === undefined && styles.childOptionSelected,
              ]}
              onPress={() => setChildId(undefined)}
            >
              <Text style={styles.childOptionText}>Sin asignar</Text>
            </TouchableOpacity>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childOption,
                  childId === child.id && styles.childOptionSelected,
                ]}
                onPress={() => setChildId(child.id)}
              >
                <Text style={styles.childOptionText}>{child.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Actualizar' : 'Guardar'}
            </Text>
          )}
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Eliminar',
                '¿Estás seguro de eliminar este juguete?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await toyService.delete(toy.id);
                        Alert.alert('Éxito', 'Juguete eliminado');
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
            <Text style={styles.deleteButtonText}>Eliminar juguete</Text>
          </TouchableOpacity>
        )}
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  childSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  childOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    marginBottom: 8,
  },
  childOptionSelected: {
    backgroundColor: '#4A90D9',
  },
  childOptionText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  saveButton: {
    backgroundColor: '#4A90D9',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
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