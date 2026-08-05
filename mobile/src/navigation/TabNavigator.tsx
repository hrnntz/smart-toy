import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

import HomeScreen from '../screens/dashboard/HomeScreen';
import RutinasScreen from '../screens/dashboard/RutinasScreen';
import HistoriasScreen from '../screens/dashboard/HistoriasScreen';
import MusicaScreen from '../screens/dashboard/MusicaScreen';
import ConversacionesScreen from '../screens/dashboard/ConversacionesScreen';
import MasScreen from '../screens/dashboard/MasScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      id="Tabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
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

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Rutinas" component={RutinasScreen} />
      <Tab.Screen name="Historias" component={HistoriasScreen} />
      <Tab.Screen name="Música" component={MusicaScreen} />
      <Tab.Screen name="Conversaciones" component={ConversacionesScreen} />
      <Tab.Screen name="Más" component={MasScreen} />
    </Tab.Navigator>
  );
}