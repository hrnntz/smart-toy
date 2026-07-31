import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rutinaService } from '../../services/api';
import CustomAlert from '../../components/common/CustomAlert';

interface RutinaFormScreenProps {
  navigation: any;
  route?: {
    params?: {
      rutina?: {
        id: number;
        nombre: string;
        hora: string;
        repetir: boolean;
        mensaje: string | null;
        accionAdicional: string | null;
      };
    };
  };
}

export default function RutinaFormScreen({ navigation, route }: RutinaFormScreenProps) {
  const rutina = route?.params?.rutina;
  const isEditing = !!rutina;

  const [nombre, setNombre] = useState(rutina?.nombre || '');
  const [hora, setHora] = useState(rutina?.hora || '');
  const [repetir, setRepetir] = useState(rutina?.repetir || false);
  const [mensaje, setMensaje] = useState(rutina?.mensaje || '');
  const [accionAdicional, setAccionAdicional] = useState(rutina?.accionAdicional || '');
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      showAlert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!hora.trim()) {
      showAlert('Error', 'La hora es obligatoria (HH:MM)');
      return;
    }
    if (!hora.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      showAlert('Error', 'Formato de hora inválido. Usa HH:MM (ej: 08:30)');
      return;
    }

    setLoading(true);

    try {
      const data = {
        nombre: nombre.trim(),
        hora: hora.trim(),
        repetir,
        mensaje: mensaje.trim() || undefined,
        accionAdicional: accionAdicional.trim() || undefined,
      };

      let response;
      if (isEditing) {
        response = await rutinaService.update(rutina.id, data);
      } else {
        response = await rutinaService.create(data);
      }

      if (response.data.success) {
        showAlert('Éxito', isEditing ? 'Rutina actualizada' : 'Rutina creada');
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        showAlert('Error', response.data.message || 'Error al guardar');
      }
    } catch (error: any) {
      console.error('Error saving rutina:', error);
      showAlert('Error', error.response?.data?.message || 'Error al conectar con el servidor');
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
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Rutina' : 'Nueva Rutina'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Despertar, Dormir, etc."
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Hora * (HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 08:30"
          value={hora}
          onChangeText={setHora}
          keyboardType="default"
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Repetir diariamente</Text>
          <Switch
            value={repetir}
            onValueChange={setRepetir}
            trackColor={{ false: '#ddd', true: '#4A90D9' }}
          />
        </View>

        <Text style={styles.label}>Mensaje que dirá Panda</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ej: Es hora de dormir..."
          value={mensaje}
          onChangeText={setMensaje}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Acción adicional</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Reproducir música relajante"
          value={accionAdicional}
          onChangeText={setAccionAdicional}
        />

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Guardar</Text>}
        </TouchableOpacity>
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
});