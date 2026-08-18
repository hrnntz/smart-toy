import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from 'heroui-native';

import HomeScreen from '../screens/dashboard/HomeScreen';
import RutinasScreen from '../screens/dashboard/RutinasScreen';
import HistoriasScreen from '../screens/dashboard/HistoriasScreen';
import MusicaScreen from '../screens/dashboard/MusicaScreen';
import ConversacionesScreen from '../screens/dashboard/ConversacionesScreen';
import MasScreen from '../screens/dashboard/MasScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const [accent, muted, surface, separator] = useThemeColor([
    'accent',
    'muted',
    'surface',
    'separator',
  ]);

  const getFeatureColor = (routeName: string, focused: boolean) => {
    if (!focused) return muted;
    switch (routeName) {
      case 'Inicio': return accent;
      case 'Rutinas': return '#6366F1';
      case 'Historias': return '#F59E0B';
      case 'Música': return '#10B981';
      case 'Conversaciones': return accent;
      case 'Más': return muted;
      default: return accent;
    }
  };

  return (
    <Tab.Navigator
      id="Tabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          let iconName: any = 'home';

          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Rutinas') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Historias') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Música') {
            iconName = focused ? 'musical-notes' : 'musical-notes-outline';
          } else if (route.name === 'Conversaciones') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Más') {
            iconName = focused ? 'grid' : 'grid-outline';
          }

          const color = getFeatureColor(route.name, focused);
          return <Ionicons name={iconName} size={26} color={color} />;
        },
        tabBarInactiveTintColor: muted,
        tabBarStyle: {
          backgroundColor: surface,
          borderTopWidth: 0.5,
          borderTopColor: separator,
          height: 80,
          paddingBottom: 18,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      })}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeScreen} 
        options={{ tabBarActiveTintColor: accent }} 
      />
      <Tab.Screen 
        name="Rutinas" 
        component={RutinasScreen} 
        options={{ tabBarActiveTintColor: '#6366F1' }} 
      />
      <Tab.Screen 
        name="Historias" 
        component={HistoriasScreen} 
        options={{ tabBarActiveTintColor: '#F59E0B' }} 
      />
      <Tab.Screen 
        name="Música" 
        component={MusicaScreen} 
        options={{ tabBarActiveTintColor: '#10B981' }} 
      />
      <Tab.Screen 
        name="Conversaciones" 
        component={ConversacionesScreen} 
        options={{ tabBarActiveTintColor: accent }} 
      />
      <Tab.Screen 
        name="Más" 
        component={MasScreen} 
        options={{ tabBarActiveTintColor: muted }} 
      />
    </Tab.Navigator>
  );
}