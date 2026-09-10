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

      <Pressable onPress={() => navigation.navigate('ChildList')}>
        <Card variant="default" className="mb-4">
          <Card.Body>
            <Card.Title>👶 Mis Niños</Card.Title>
            <Card.Description>Agrega y gestiona los perfiles infantiles</Card.Description>
          </Card.Body>
        </Card>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('ToyList')}>
        <Card variant="default" className="mb-4">
          <Card.Body>
            <Card.Title>🧸 Mis Juguetes</Card.Title>
            <Card.Description>Gestiona los dispositivos y abre el control del Panda</Card.Description>
          </Card.Body>
        </Card>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('ToyControl')}>
        <Card variant="default" className="mb-4 bg-accent/10 border border-accent/20">
          <Card.Body>
            <Card.Title>🔋 Telemetría & Control del Panda</Card.Title>
            <Card.Description>Supervisa la batería de 10.000 mAh, sensor TTP223 y abrazos en vivo</Card.Description>
          </Card.Body>
        </Card>
      </Pressable>
    </ScrollView>
  );
}