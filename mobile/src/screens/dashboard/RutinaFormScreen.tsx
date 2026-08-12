import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Switch,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { rutinaService } from '../../services/api';
import CustomAlert from '../../components/common/CustomAlert';
import { Card, Button, Label, TextField, Input, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

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
  const [loading, setLoading] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const [primary, muted, separator, background, surface] = useThemeColor([
    'accent',
    'muted',
    'separator',
    'background',
    'surface',
  ]);

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const getInitialTime = () => {
    if (hora) {
      const [h, m] = hora.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m, 0, 0);
      return date;
    }
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    return date;
  };

  const handleConfirmTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    setHora(`${hours}:${minutes}`);
    setTimePickerVisible(false);
  };

  const handleWebTimeChange = (e: any) => {
    setHora(e.target.value);
  };

  const formatHoraDisplay = (horaStr: string) => {
    if (!horaStr) return 'Seleccionar hora';
    const [h, m] = horaStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      showAlert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!hora.trim()) {
      showAlert('Error', 'Selecciona una hora');
      return;
    }
    if (!hora.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      showAlert('Error', 'Formato de hora inválido');
      return;
    }

    setLoading(true);

    try {
      const data = {
        nombre: nombre.trim(),
        hora: hora.trim(),
        repetir,
        mensaje: mensaje.trim() || undefined,
      };

      let response;
      if (isEditing) {
        response = await rutinaService.update(rutina.id, data);
      } else {
        response = await rutinaService.create(data);
      }

      if (response.data.success) {
        const savedRutina = response.data.data;
        showAlert('Éxito', isEditing ? 'Rutina actualizada' : 'Rutina creada');
        
        try {
          const { requestPermissions, scheduleNotification } = require('../../services/notificationService');
          const hasPerm = await requestPermissions();
          if (hasPerm && savedRutina.hora) {
            const [h, m] = savedRutina.hora.split(':').map(Number);
            await scheduleNotification(
              `⏰ Recordatorio Panda: ${savedRutina.nombre}`,
              savedRutina.mensaje || `Es hora de cumplir con la rutina: ${savedRutina.nombre}`,
              {
                type: 'daily',
                hour: h,
                minute: m,
              } as any
            );
          }
        } catch (err) {
          console.warn('Error al programar alarma de rutina:', err);
        }

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
    <ScrollView className="flex-1 bg-background px-4 pt-12">
      <View className="flex-row justify-between items-center mb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-2xl font-extrabold text-foreground">
          {isEditing ? 'Editar Rutina' : 'Nueva Rutina'}
        </Label>
        <View className="w-10" />
      </View>

      <Card variant="default" className="p-5 mb-5 border-0">
        <Card.Body className="p-0">
          <Label className="text-sm font-semibold text-foreground mb-1.5">Nombre *</Label>
          <TextField className="w-full mb-4">
            <Input
              placeholder="Ej: Despertar, Dormir, etc."
              value={nombre}
              onChangeText={setNombre}
            />
          </TextField>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Hora *</Label>
          {Platform.OS === 'web' ? (
            <View className="flex-row items-center border border-separator rounded-xl px-3.5 bg-background mb-4">
              <Ionicons name="time-outline" size={24} color={primary} className="mr-2" />
              <input
                type="time"
                value={hora}
                onChange={handleWebTimeChange}
                style={{
                  flex: 1,
                  padding: 12,
                  fontSize: 16,
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  minWidth: 0,
                  width: '100%',
                }}
              />
            </View>
          ) : (
            <Pressable
              className="flex-row items-center border border-separator rounded-xl p-3.5 bg-background mb-4"
              onPress={() => setTimePickerVisible(true)}
            >
              <Ionicons name="time-outline" size={24} color={primary} />
              <Label className={`flex-1 ml-3 text-[15px] ${hora ? 'text-foreground' : 'text-muted'}`}>
                {hora ? formatHoraDisplay(hora) : 'Seleccionar hora'}
              </Label>
              <Ionicons name="chevron-down" size={20} color={muted} />
            </Pressable>
          )}

          <View className="flex-row justify-between items-center mt-2 mb-4">
            <Label className="text-sm font-semibold text-foreground">Repetir diariamente</Label>
            <Switch
              value={repetir}
              onValueChange={setRepetir}
              trackColor={{ false: surface, true: primary }}
            />
          </View>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Mensaje que dirá Panda</Label>
          <TextField className="w-full mb-6">
            <Input
              placeholder="Ej: Es hora de dormir..."
              value={mensaje}
              onChangeText={setMensaje}
              multiline
              numberOfLines={3}
              className="min-h-[80px]"
            />
          </TextField>

          <Button
            variant="primary"
            onPress={handleSave}
            isDisabled={loading}
            className="w-full"
          >
            {loading ? <Spinner size="sm" color="default" /> : <Button.Label>Guardar</Button.Label>}
          </Button>
        </Card.Body>
      </Card>

      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleConfirmTime}
        onCancel={() => setTimePickerVisible(false)}
        date={getInitialTime()}
        locale="es_ES"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </ScrollView>
  );
}