import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';

export default function MasScreen({ navigation }: any) {
  const handleLogout = async () => {
    await storage.removeItem('token');
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Configuración</Text>

      {/* Dispositivo Panda - navega a la lista de juguetes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dispositivo Panda</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ToyList')}
        >
          <Ionicons name="game-controller" size={22} color="#4A90D9" />
          <Text style={styles.menuText}>Gestionar dispositivos</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" style={styles.menuArrow} />
        </TouchableOpacity>
      </View>

      {/* Perfil del niño - navega a la lista de niños */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perfil del niño</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ChildList')}
        >
          <Ionicons name="people" size={22} color="#E67E22" />
          <Text style={styles.menuText}>Gestionar niños</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" style={styles.menuArrow} />
        </TouchableOpacity>
      </View>

      {/* Información */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>
        <View style={styles.menuItem}>
          <Ionicons name="information-circle" size={22} color="#7F8C8D" />
          <Text style={styles.menuText}>Versión de la app: 1.0.0</Text>
        </View>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle" size={22} color="#7F8C8D" />
          <Text style={styles.menuText}>Soporte técnico</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" style={styles.menuArrow} />
        </TouchableOpacity>
      </View>

      {/* Botón cerrar sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={24} color="white" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: {
    fontSize: 14,
    color: '#34495E',
    flex: 1,
    marginLeft: 12,
  },
  menuArrow: {
    marginLeft: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#E74C3C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});