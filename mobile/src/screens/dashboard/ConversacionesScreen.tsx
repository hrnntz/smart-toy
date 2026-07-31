import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ConversacionesScreen({ navigation }: any) {
  const conversaciones = [
    { id: 1, pregunta: '¿Qué son los dinosaurios?', fecha: 'Hoy, 7:45 PM' },
    { id: 2, pregunta: 'Cuéntame una historia', fecha: 'Hoy, 7:30 PM' },
    { id: 3, pregunta: '¿Por qué llueve?', fecha: 'Hoy, 6:20 PM' },
    { id: 4, pregunta: 'Enséñame en inglés', fecha: 'Ayer, 5:10 PM' },
    { id: 5, pregunta: 'Hablemos de los planetas', fecha: 'Ayer, 4:00 PM' },
  ];

  return (
    <View style={styles.container}>
      {/* Header con botón Volver */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversaciones</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={styles.tabActiveText}>Recientes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Favoritas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {conversaciones.map((conv) => (
          <TouchableOpacity key={conv.id} style={styles.conversationCard}>
            <View style={styles.convIcon}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#4A90D9" />
            </View>
            <View style={styles.convInfo}>
              <Text style={styles.convQuestion}>{conv.pregunta}</Text>
              <Text style={styles.convDate}>{conv.fecha}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#4A90D9',
  },
  tabText: {
    color: '#7F8C8D',
    fontSize: 14,
  },
  tabActiveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  conversationCard: {
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
  convIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF5FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  convInfo: {
    flex: 1,
  },
  convQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  convDate: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
  },
});