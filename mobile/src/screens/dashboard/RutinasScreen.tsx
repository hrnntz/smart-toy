import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RutinasScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Rutinas</Text>
      <Text style={styles.subtitle}>Diarias</Text>

      <View style={styles.routineCard}>
        <Ionicons name="sunny" size={24} color="#F39C12" />
        <View style={styles.routineInfo}>
          <Text style={styles.routineTitle}>Despertar y estirarse</Text>
          <Text style={styles.routineTime}>7:00 AM</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="checkbox-outline" size={24} color="#27AE60" />
        </TouchableOpacity>
      </View>

      <View style={styles.routineCard}>
        <Ionicons name="restaurant" size={24} color="#E67E22" />
        <View style={styles.routineInfo}>
          <Text style={styles.routineTitle}>Desayunar</Text>
          <Text style={styles.routineTime}>8:00 AM</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="checkbox-outline" size={24} color="#27AE60" />
        </TouchableOpacity>
      </View>

      <View style={styles.routineCard}>
        <Ionicons name="book" size={24} color="#3498DB" />
        <View style={styles.routineInfo}>
          <Text style={styles.routineTitle}>Hacer tareas</Text>
          <Text style={styles.routineTime}>10:00 AM</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="checkbox-outline" size={24} color="#27AE60" />
        </TouchableOpacity>
      </View>

      <View style={styles.routineCard}>
        <Ionicons name="brush" size={24} color="#1ABC9C" />
        <View style={styles.routineInfo}>
          <Text style={styles.routineTitle}>Cepillarse los dientes</Text>
          <Text style={styles.routineTime}>8:30 PM</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="checkbox-outline" size={24} color="#27AE60" />
        </TouchableOpacity>
      </View>

      <View style={styles.routineCard}>
        <Ionicons name="moon" size={24} color="#2C3E50" />
        <View style={styles.routineInfo}>
          <Text style={styles.routineTitle}>Dormir</Text>
          <Text style={styles.routineTime}>9:00 PM</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="checkbox-outline" size={24} color="#27AE60" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Agregar rutina</Text>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 20,
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  routineInfo: {
    flex: 1,
    marginLeft: 12,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  routineTime: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90D9',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});