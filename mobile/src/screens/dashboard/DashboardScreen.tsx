import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export default function HomeScreen({ navigation }: any) {
  const handleLogout = () => {
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Bienvenido</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>👶 Mis Niños</Text>
        <Text style={styles.cardSubtitle}>Agrega y gestiona tus hijos</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧸 Mis Juguetes</Text>
        <Text style={styles.cardSubtitle}>Controla los juguetes inteligentes</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  logout: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});