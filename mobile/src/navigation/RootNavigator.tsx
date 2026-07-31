import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import AuthLoadingScreen from '../screens/auth/AuthLoadingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import TabNavigator from './TabNavigator';

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

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthLoading" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={TabNavigator} />
        <Stack.Screen name="ChildList" component={ChildListScreen} />
        <Stack.Screen name="ChildForm" component={ChildFormScreen} />
        <Stack.Screen name="ToyList" component={ToyListScreen} />
        <Stack.Screen name="ToyForm" component={ToyFormScreen} />
        <Stack.Screen name="Ingles" component={InglesScreen} />
        <Stack.Screen name="Juegos" component={JuegosScreen} />
        <Stack.Screen name="Conversaciones" component={ConversacionesScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
        <Stack.Screen name="Rutinas" component={RutinasScreen} />
<Stack.Screen name="RutinaForm" component={RutinaFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}