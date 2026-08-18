import React from 'react';
import { ScrollView, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { ListGroup, Label, Button, Separator, useThemeColor } from 'heroui-native';

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type MenuItem = {
  icon: string;
  iconColor: string;
  label: string;
  description?: string;
  action: () => void;
  isDanger?: boolean;
};

export default function MasScreen({ navigation }: any) {
  const [accent, muted] = useThemeColor(['accent', 'muted']);

  const handleLogout = async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
    navigation.replace('Welcome');
  };

  const sections: MenuSection[] = [
    {
      title: 'Dispositivo',
      items: [
        {
          icon: 'settings-outline',
          iconColor: accent,
          label: 'Configuración del dispositivo',
          description: 'Personaliza tu Panda AI',
          action: () => navigation.navigate('Configuracion'),
        },
        {
          icon: 'game-controller-outline',
          iconColor: '#F59E0B',
          label: 'Gestionar juguetes',
          description: 'Agrega o edita dispositivos',
          action: () => navigation.navigate('ToyList'),
        },
      ],
    },
    {
      title: 'Familia',
      items: [
        {
          icon: 'people-outline',
          iconColor: '#7C3AED',
          label: 'Perfiles de niños',
          description: 'Gestiona los perfiles de tus hijos',
          action: () => navigation.navigate('ChildList'),
        },
        {
          icon: 'language-outline',
          iconColor: '#10B981',
          label: 'Módulo de Inglés',
          description: 'Aprende inglés con Panda',
          action: () => navigation.navigate('Ingles'),
        },
      ],
    },
    {
      title: 'Cuenta',
      items: [
        {
          icon: 'person-outline',
          iconColor: '#3B82F6',
          label: 'Mi Perfil',
          description: 'Información de tu cuenta',
          action: () => navigation.navigate('Perfil'),
        },
      ],
    },
    {
      title: 'Información',
      items: [
        {
          icon: 'help-circle-outline',
          iconColor: muted,
          label: 'Soporte técnico',
          action: () => {},
        },
        {
          icon: 'information-circle-outline',
          iconColor: muted,
          label: 'Versión 1.0.0',
          action: () => {},
        },
      ],
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View className="px-4 pt-14 pb-6">
        <Label className="text-2xl font-extrabold text-foreground">Ajustes & Más</Label>
        <Label className="text-sm text-muted mt-0.5">Configuración y gestión de la app</Label>
      </View>

      <View className="px-4">
        {sections.map((section, sIdx) => (
          <View key={section.title} className="mb-5">
            <Label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 ml-1">
              {section.title}
            </Label>
            <ListGroup variant="default">
              {section.items.map((item, iIdx) => (
                <ListGroup.Item
                  key={item.label}
                  onPress={item.action}
                >
                  <ListGroup.ItemPrefix>
                    <View
                      className="w-9 h-9 rounded-xl items-center justify-center"
                      style={{ backgroundColor: item.iconColor + '18' }}
                    >
                      <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
                    </View>
                  </ListGroup.ItemPrefix>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>
                      <Label
                        className="text-sm font-semibold"
                        style={{ color: item.isDanger ? '#EF4444' : undefined } as any}
                      >
                        {item.label}
                      </Label>
                    </ListGroup.ItemTitle>
                    {item.description && (
                      <ListGroup.ItemDescription>
                        <Label className="text-xs text-muted">{item.description}</Label>
                      </ListGroup.ItemDescription>
                    )}
                  </ListGroup.ItemContent>
                  {!item.isDanger && item.action.toString() !== '() => {}' && (
                    <ListGroup.ItemSuffix>
                      <Ionicons name="chevron-forward" size={16} color={muted} />
                    </ListGroup.ItemSuffix>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </View>
        ))}

        {/* ── Logout ── */}
        <Button
          variant="primary"
          feedbackVariant="scale-ripple"
          onPress={handleLogout}
          className="w-full mb-10"
          style={{ backgroundColor: '#EF4444' } as any}
        >
          <Button.Label>Cerrar sesión</Button.Label>
        </Button>
      </View>
    </ScrollView>
  );
}