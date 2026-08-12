import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toyService, childService } from '../../services/api';
import { Card, Button, Label, TextField, Input, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

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
        personality?: string;
        context?: string;
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
  const [personality, setPersonality] = useState(toy?.personality || '');
  const [context, setContext] = useState(toy?.context || '');
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(true);

  const [primary, surface] = useThemeColor(['accent', 'surface']);

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
      const data = {
        name: name.trim(),
        serialNumber: serialNumber.trim(),
        childId: childId || undefined,
        personality: personality.trim() || undefined,
        context: context.trim() || undefined,
      };

      let response;
      if (isEditing) {
        response = await toyService.update(toy.id, data);
      } else {
        response = await toyService.create(data);
      }

      if (response.data.success) {
        Alert.alert('Éxito', isEditing ? 'Juguete actualizado' : 'Juguete creado');
        navigation.navigate('ToyList');
      } else {
        Alert.alert('Error', response.data.message || 'Error al guardar');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-12">
      <View className="flex-row justify-between items-center mb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-2xl font-extrabold text-foreground">
          {isEditing ? 'Editar Juguete' : 'Nuevo Juguete'}
        </Label>
        <View className="w-10" />
      </View>

      <Card variant="default" className="p-5 mb-5 border-0">
        <Card.Body className="p-0">
          <Label className="text-sm font-semibold text-foreground mb-1.5">Nombre *</Label>
          <TextField className="w-full mb-4">
            <Input
              placeholder="Nombre del juguete"
              value={name}
              onChangeText={setName}
            />
          </TextField>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Número de serie *</Label>
          <TextField className="w-full mb-4">
            <Input
              placeholder="Ej: TOY-001-ABC"
              value={serialNumber}
              onChangeText={setSerialNumber}
            />
          </TextField>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Asignar a niño (opcional)</Label>
          {loadingChildren ? (
            <View className="py-2 items-start">
              <Spinner size="sm" color="primary" />
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-2 mb-4">
              <Pressable
                className="px-3.5 py-2 rounded-full border-2"
                style={{
                  backgroundColor: childId === undefined ? 'rgba(74, 144, 217, 0.1)' : surface,
                  borderColor: childId === undefined ? primary : 'transparent'
                }}
                onPress={() => setChildId(undefined)}
              >
                <Label className={`text-sm ${childId === undefined ? 'text-primary font-bold' : 'text-foreground'}`}>
                  Sin asignar
                </Label>
              </Pressable>
              {children.map((child) => (
                <Pressable
                  key={child.id}
                  className="px-3.5 py-2 rounded-full border-2"
                  style={{
                    backgroundColor: childId === child.id ? 'rgba(74, 144, 217, 0.1)' : surface,
                    borderColor: childId === child.id ? primary : 'transparent'
                  }}
                  onPress={() => setChildId(child.id)}
                >
                  <Label className={`text-sm ${childId === child.id ? 'text-primary font-bold' : 'text-foreground'}`}>
                    {child.name}
                  </Label>
                </Pressable>
              ))}
            </View>
          )}

          <Label className="text-sm font-semibold text-foreground mb-1.5">Personalidad (para IA)</Label>
          <TextField className="w-full mb-4">
            <Input
              placeholder="Ej: Alegre, curioso, amable..."
              value={personality}
              onChangeText={setPersonality}
              multiline
              numberOfLines={2}
              className="min-h-[60px]"
            />
          </TextField>

          <Label className="text-sm font-semibold text-foreground mb-1.5">Contexto / Historia (para IA)</Label>
          <TextField className="w-full mb-6">
            <Input
              placeholder="Ej: Eres un panda que vive en el bosque..."
              value={context}
              onChangeText={setContext}
              multiline
              numberOfLines={4}
              className="min-h-[100px]"
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
    </ScrollView>
  );
}