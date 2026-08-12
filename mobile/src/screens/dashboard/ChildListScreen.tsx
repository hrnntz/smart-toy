import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Alert,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { childService } from '../../services/api';
import { Card, Button, Label, Spinner, useThemeColor } from 'heroui-native';
import { IconButton } from '../../components/ui/IconButton';

interface Child {
  id: number;
  name: string;
  birthDate: string;
  gender?: string;
  createdAt: string;
  toy?: any;
}

export default function ChildListScreen({ navigation }: any) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [primary, success, danger, muted, secondary] = useThemeColor([
    'accent',
    'success',
    'danger',
    'muted',
    'secondary',
  ]);

  const loadChildren = async () => {
    try {
      const response = await childService.getAll();
      if (response.data.success) {
        setChildren(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'No se pudieron cargar los niños');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChildren();
  }, []);

  const deleteChild = (id: number, name: string) => {
    Alert.alert(
      'Eliminar niño',
      `¿Estás seguro que quieres eliminar a ${name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await childService.delete(id);
              if (response.data.success) {
                Alert.alert('Éxito', 'Niño eliminado correctamente');
                await loadChildren();
              } else {
                Alert.alert('Error', response.data.message || 'No se pudo eliminar');
              }
            } catch (error: any) {
              console.error('Error:', error);
              Alert.alert('Error', 'No se pudo eliminar el niño');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Spinner size="lg" color="primary" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-12">
      <View className="flex-row justify-between items-center mb-5">
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Label className="text-2xl font-extrabold text-foreground">Mis Niños</Label>
        <IconButton
          icon="add"
          variant="solid"
          color={primary}
          onPress={() => navigation.navigate('ChildForm')}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        {children.length === 0 ? (
          <View className="items-center mt-16">
            <Ionicons name="people-outline" size={64} color={muted} />
            <Label className="text-base font-bold text-foreground mt-4 mb-4">No tienes niños registrados</Label>
            <Button variant="primary" onPress={() => navigation.navigate('ChildForm')}>
              <Button.Label>Agregar niño</Button.Label>
            </Button>
          </View>
        ) : (
          children.map((child) => (
            <Card key={child.id} variant="default" className="mb-3">
              <Card.Body className="flex-row items-center py-4">
                <View className="w-13 h-13 rounded-full bg-primary/15 justify-center items-center mr-3.5">
                  <Ionicons name="person" size={28} color={primary} />
                </View>
                <View className="flex-1">
                  <Label className="text-base font-bold text-foreground">{child.name}</Label>
                  <Label className="text-[13px] text-muted mt-0.5">
                    {child.birthDate ? `📅 ${child.birthDate}` : 'Sin fecha'}
                  </Label>
                  {child.gender && (
                    <Label className="text-[13px] text-secondary font-medium mt-0.5">⚧ {child.gender}</Label>
                  )}
                  {child.toy && (
                    <Label className="text-[13px] text-success font-semibold mt-0.5">
                      🧸 Juguete: {child.toy.name}
                    </Label>
                  )}
                </View>
                <View className="flex-row gap-1.5 ml-2">
                  <Pressable
                    onPress={() => navigation.navigate('ChildForm', { child })}
                    className="p-1.5"
                  >
                    <Ionicons name="pencil" size={22} color={primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => deleteChild(child.id, child.name)}
                    className="p-1.5"
                  >
                    <Ionicons name="trash" size={22} color={danger} />
                  </Pressable>
                </View>
              </Card.Body>
            </Card>
          ))
        )}
        <View className="h-5" />
      </ScrollView>
    </View>
  );
}