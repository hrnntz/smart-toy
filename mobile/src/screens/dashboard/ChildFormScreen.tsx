import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { childService } from '../../services/api';
import CustomAlert from '../../components/common/CustomAlert';

interface ChildFormScreenProps {
  navigation: any;
  route?: {
    params?: {
      child?: {
        id: number;
        name: string;
        birthDate?: string;
        gender?: string;
      };
    };
  };
}

export default function ChildFormScreen({ navigation, route }: ChildFormScreenProps) {
  const child = route?.params?.child;
  const isEditing = !!child;

  const [name, setName] = useState(child?.name || '');
  const [birthDate, setBirthDate] = useState(child?.birthDate || '');
  const [gender, setGender] = useState(child?.gender || '');
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleDateSelect = (day: any) => {
    setBirthDate(day.dateString);
    setShowCalendar(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Error', 'El nombre es obligatorio');
      return;
    }

    setLoading(true);

    try {
      const data = {
        name: name.trim(),
        birthDate: birthDate || undefined,
        gender: gender || undefined,
      };

      let response;
      if (isEditing) {
        response = await childService.update(child.id, data);
      } else {
        response = await childService.create(data);
      }

      if (response.data.success) {
        showAlert('Éxito', isEditing ? 'Niño actualizado' : 'Niño creado');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showAlert('Error', response.data.message || 'Error al guardar');
      }
    } catch (error: any) {
      console.error('Error saving child:', error);
      showAlert('Error', error.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = ['Masculino', 'Femenino', 'Otro'];

  // Obtener año actual para el selector de años
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Niño' : 'Nuevo Niño'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre del niño"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Fecha de nacimiento</Text>
        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowCalendar(true)}
        >
          <Ionicons name="calendar" size={24} color="#4A90D9" />
          <Text style={birthDate ? styles.dateText : styles.datePlaceholder}>
            {birthDate || 'Seleccionar fecha'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" style={styles.dateArrow} />
        </TouchableOpacity>

        <Text style={styles.label}>Sexo</Text>
        <View style={styles.genderContainer}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.genderOption,
                gender === option && styles.genderOptionActive,
              ]}
              onPress={() => setGender(option)}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === option && styles.genderTextActive,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
                '¿Estás seguro de eliminar este niño?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await childService.delete(child.id);
                        Alert.alert('Éxito', 'Niño eliminado');
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
            <Text style={styles.deleteButtonText}>Eliminar niño</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal del calendario mejorado */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar fecha</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={28} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            {/* Selector de mes y año */}
            <View style={styles.monthYearSelector}>
              <View style={styles.selectorRow}>
                <TouchableOpacity
                  style={styles.selectorButton}
                  onPress={() => {
                    if (selectedMonth > 0) {
                      setSelectedMonth(selectedMonth - 1);
                    } else {
                      setSelectedMonth(11);
                      setSelectedYear(selectedYear - 1);
                    }
                  }}
                >
                  <Ionicons name="chevron-back" size={24} color="#4A90D9" />
                </TouchableOpacity>

                <Text style={styles.monthYearText}>
                  {monthNames[selectedMonth]} {selectedYear}
                </Text>

                <TouchableOpacity
                  style={styles.selectorButton}
                  onPress={() => {
                    if (selectedMonth < 11) {
                      setSelectedMonth(selectedMonth + 1);
                    } else {
                      setSelectedMonth(0);
                      setSelectedYear(selectedYear + 1);
                    }
                  }}
                >
                  <Ionicons name="chevron-forward" size={24} color="#4A90D9" />
                </TouchableOpacity>
              </View>

              {/* Selector de año con botones rápidos */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearSelector}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearButton,
                      selectedYear === year && styles.yearButtonActive,
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text
                      style={[
                        styles.yearButtonText,
                        selectedYear === year && styles.yearButtonTextActive,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [birthDate]: {
                  selected: true,
                  selectedColor: '#4A90D9',
                },
              }}
              maxDate={new Date().toISOString().split('T')[0]}
              current={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`}
              onMonthChange={(month: any) => {
                setSelectedMonth(month.month - 1);
                setSelectedYear(month.year);
              }}
              theme={{
                selectedDayBackgroundColor: '#4A90D9',
                todayTextColor: '#4A90D9',
                arrowColor: '#4A90D9',
                monthTextColor: '#2C3E50',
                textMonthFontWeight: 'bold',
                textMonthFontSize: 1, // Ocultamos el header del calendario
                textDayHeaderFontWeight: '600',
                textDayHeaderFontSize: 14,
                textDayFontSize: 16,
                textDayFontWeight: '400',
              }}
              hideArrows={true}
            />

            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => {
                setBirthDate('');
                setShowCalendar(false);
              }}
            >
              <Text style={styles.clearDateText}>Limpiar fecha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9F9F9',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  dateArrow: {
    marginLeft: 'auto',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  genderOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderOptionActive: {
    backgroundColor: '#EBF5FB',
    borderColor: '#4A90D9',
  },
  genderText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  genderTextActive: {
    color: '#4A90D9',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  monthYearSelector: {
    marginBottom: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  selectorButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  yearSelector: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  yearButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 4,
  },
  yearButtonActive: {
    backgroundColor: '#4A90D9',
  },
  yearButtonText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  yearButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  clearDateButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  clearDateText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '500',
  },
});