import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { childService } from '../../services/api';
import CustomAlert from '../../components/common/CustomAlert';
import { Card, Button, Label, TextField, Input, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

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

  const [primary, danger, muted, surface, background] = useThemeColor([
    'accent',
    'danger',
    'muted',
    'surface',
    'background',
  ]);

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
      showAlert('Error', error.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = ['Masculino', 'Femenino', 'Otro'];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-12">
      <View className="flex-row justify-between items-center mb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-2xl font-extrabold text-foreground">
          {isEditing ? 'Editar Niño' : 'Nuevo Niño'}
        </Label>
        <View className="w-10" />
      </View>

      <Card variant="default" className="p-5 mb-5 border-0">
        <Card.Body className="p-0">
          <Label className="text-sm font-semibold text-foreground mb-1.5">Nombre *</Label>
          <TextField className="w-full mb-4">
            <Input
              placeholder="Nombre del niño"
              value={name}
              onChangeText={setName}
            />
          </TextField>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Fecha de nacimiento</Label>
          <Pressable
            className="flex-row items-center border border-separator rounded-xl p-3.5 bg-background mb-4"
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar" size={24} color={primary} />
            <Label className={`flex-1 ml-3 text-[15px] ${birthDate ? 'text-foreground' : 'text-muted'}`}>
              {birthDate || 'Seleccionar fecha'}
            </Label>
            <Ionicons name="chevron-down" size={20} color={muted} />
          </Pressable>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Sexo</Label>
          <View className="flex-row flex-wrap gap-2.5 mb-6">
            {genderOptions.map((option) => (
              <Pressable
                key={option}
                className="px-5 py-2.5 rounded-full border-2"
                style={{
                  backgroundColor: gender === option ? 'rgba(74, 144, 217, 0.1)' : surface,
                  borderColor: gender === option ? primary : 'transparent'
                }}
                onPress={() => setGender(option)}
              >
                <Label className={`text-sm ${gender === option ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {option}
                </Label>
              </Pressable>
            ))}
          </View>

          <Button
            variant="primary"
            onPress={handleSave}
            isDisabled={loading}
            className="w-full"
          >
            {loading ? <Spinner size="sm" color="default" /> : <Button.Label>{isEditing ? 'Actualizar' : 'Guardar'}</Button.Label>}
          </Button>

          {isEditing && (
            <Button
              variant="tertiary"
              onPress={() => {
                Alert.alert('Eliminar', '¿Estás seguro de eliminar este niño?', [
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
                ]);
              }}
              className="w-full mt-3"
            >
              <Button.Label className="text-danger font-semibold">Eliminar niño</Button.Label>
            </Button>
          )}
        </Card.Body>
      </Card>

      {/* Modal del calendario */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="w-full max-w-md bg-surface rounded-3xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <Label className="text-lg font-bold text-foreground">Seleccionar fecha</Label>
              <Pressable onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={28} color={primary} />
              </Pressable>
            </View>

            <View className="mb-3">
              <View className="flex-row justify-between items-center px-2 mb-2">
                <Pressable
                  className="p-2"
                  onPress={() => {
                    if (selectedMonth > 0) {
                      setSelectedMonth(selectedMonth - 1);
                    } else {
                      setSelectedMonth(11);
                      setSelectedYear(selectedYear - 1);
                    }
                  }}
                >
                  <Ionicons name="chevron-back" size={24} color={primary} />
                </Pressable>

                <Label className="text-lg font-bold text-foreground">
                  {monthNames[selectedMonth]} {selectedYear}
                </Label>

                <Pressable
                  className="p-2"
                  onPress={() => {
                    if (selectedMonth < 11) {
                      setSelectedMonth(selectedMonth + 1);
                    } else {
                      setSelectedMonth(0);
                      setSelectedYear(selectedYear + 1);
                    }
                  }}
                >
                  <Ionicons name="chevron-forward" size={24} color={primary} />
                </Pressable>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row px-1">
                {years.map((year) => (
                  <Pressable
                    key={year}
                    className="px-4 py-1.5 rounded-full mx-1"
                    style={{ backgroundColor: selectedYear === year ? primary : surface }}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Label className={`text-sm ${selectedYear === year ? 'text-white font-bold' : 'text-foreground'}`}>
                      {year}
                    </Label>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [birthDate]: { selected: true, selectedColor: primary },
              }}
              maxDate={new Date().toISOString().split('T')[0]}
              current={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`}
              onMonthChange={(month: any) => {
                setSelectedMonth(month.month - 1);
                setSelectedYear(month.year);
              }}
              theme={{
                selectedDayBackgroundColor: primary,
                todayTextColor: primary,
                arrowColor: primary,
                textMonthFontSize: 1, // Hidden header
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
              }}
              hideArrows={true}
            />

            <Button
              variant="tertiary"
              onPress={() => {
                setBirthDate('');
                setShowCalendar(false);
              }}
              className="mt-4"
            >
              <Button.Label className="text-danger font-medium">Limpiar fecha</Button.Label>
            </Button>
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