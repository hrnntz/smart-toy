import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import AuthLoadingScreen from '../screens/auth/AuthLoadingScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import TabNavigator from './TabNavigator';

// Pantallas de dashboard
import ChildListScreen from '../screens/dashboard/ChildListScreen';
import ChildFormScreen from '../screens/dashboard/ChildFormScreen';
import ToyListScreen from '../screens/dashboard/ToyListScreen';
import ToyFormScreen from '../screens/dashboard/ToyFormScreen';
import InglesScreen from '../screens/dashboard/InglesScreen';
import JuegosScreen from '../screens/dashboard/JuegosScreen';
import ConversacionesScreen from '../screens/dashboard/ConversacionesScreen';
import PerfilScreen from '../screens/dashboard/PerfilScreen';
import ConfiguracionScreen from '../screens/dashboard/ConfiguracionScreen';
import RutinasScreen from '../screens/dashboard/RutinasScreen';
import RutinaFormScreen from '../screens/dashboard/RutinaFormScreen';
import ChatScreen from '../screens/dashboard/ChatScreen';

import MusicaScreen from '../screens/dashboard/MusicaScreen';

// Pantallas de supervisión por cámara
import SupervisionScreen from '../screens/dashboard/SupervisionScreen';
import CameraBroadcasterScreen from '../screens/dashboard/CameraBroadcasterScreen';

// ✅ Pantallas de historias (nuevas)
import HistoriasScreen from '../screens/dashboard/HistoriasScreen';
import GenerarHistoriaScreen from '../screens/dashboard/GenerarHistoriaScreen';
import HistoriaDetalleScreen from '../screens/dashboard/HistoriaDetalleScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        id="Root"
        initialRouteName="AuthLoading"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={TabNavigator} />

        {/* Pantallas de niños */}
        <Stack.Screen name="ChildList" component={ChildListScreen} />
        <Stack.Screen name="ChildForm" component={ChildFormScreen} />

        {/* Pantallas de juguetes */}
        <Stack.Screen name="ToyList" component={ToyListScreen} />
        <Stack.Screen name="ToyForm" component={ToyFormScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />

        {/* Pantallas de funcionalidades */}
        <Stack.Screen name="Ingles" component={InglesScreen} />
        <Stack.Screen name="Juegos" component={JuegosScreen} />
        <Stack.Screen name="Conversaciones" component={ConversacionesScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
        <Stack.Screen name="Rutinas" component={RutinasScreen} />
        <Stack.Screen name="RutinaForm" component={RutinaFormScreen} />
        <Stack.Screen name="Musica" component={MusicaScreen} />
        <Stack.Screen name="Música" component={MusicaScreen} />

        {/* Pantallas de supervisión por cámara */}
        <Stack.Screen name="Supervision" component={SupervisionScreen} />
        <Stack.Screen name="Supervisión" component={SupervisionScreen} />
        <Stack.Screen name="CameraBroadcaster" component={CameraBroadcasterScreen} />

        {/* ✅ Pantallas de historias */}
        <Stack.Screen name="Historias" component={HistoriasScreen} />
        <Stack.Screen name="GenerarHistoria" component={GenerarHistoriaScreen} />
        <Stack.Screen name="HistoriaDetalle" component={HistoriaDetalleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}