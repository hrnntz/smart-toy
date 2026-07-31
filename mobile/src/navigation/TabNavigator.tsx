import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/dashboard/HomeScreen';
import RutinasScreen from '../screens/dashboard/RutinasScreen';
import HistoriasScreen from '../screens/dashboard/HistoriasScreen';
import MusicaScreen from '../screens/dashboard/MusicaScreen';
import ConversacionesScreen from '../screens/dashboard/ConversacionesScreen';
import MasScreen from '../screens/dashboard/MasScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
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
        tabBarActiveTintColor: '#4A90D9',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
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