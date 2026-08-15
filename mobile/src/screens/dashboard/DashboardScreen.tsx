import React from 'react';
import { ScrollView, Pressable, View } from 'react-native';
import { Label, Card } from 'heroui-native';

export default function DashboardScreen({ navigation }: any) {
  const handleLogout = () => {
    navigation.replace('Login');
  };

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-12">
      <View className="flex-row justify-between items-center mb-5">
        <Label className="text-2xl font-extrabold text-foreground">Bienvenido</Label>
        <Pressable onPress={handleLogout} hitSlop={10}>
          <Label className="text-danger font-semibold">Cerrar sesión</Label>
        </Pressable>
      </View>

      <Card variant="default" className="mb-4">
        <Card.Body>
          <Card.Title>👶 Mis Niños</Card.Title>
          <Card.Description>Agrega y gestiona tus hijos</Card.Description>
        </Card.Body>
      </Card>

      <Card variant="default" className="mb-4">
        <Card.Body>
          <Card.Title>🧸 Mis Juguetes</Card.Title>
          <Card.Description>Controla los juguetes inteligentes</Card.Description>
        </Card.Body>
      </Card>
    </ScrollView>
  );
}