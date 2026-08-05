import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/storage';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function MasScreen({ navigation }: any) {
  const { colors, typography, isDark } = useTheme();

  const handleLogout = async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
    navigation.replace('Welcome');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Text style={[styles.title, { color: colors.text }]}>Ajustes & Más</Text>

      {/* Dispositivo Panda */}
      <Card variant="elevated" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dispositivo Panda</Text>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('Configuracion')}
        >
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
          <Text style={[styles.menuText, { color: colors.text }]}>Configuración del dispositivo</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('ToyList')}
        >
          <Ionicons name="game-controller-outline" size={22} color={colors.secondary} />
          <Text style={[styles.menuText, { color: colors.text }]}>Gestionar dispositivos</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      {/* Perfil del niño */}
      <Card variant="elevated" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Familia y Niños</Text>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('ChildList')}
        >
          <Ionicons name="people-outline" size={22} color="#F59E0B" />
          <Text style={[styles.menuText, { color: colors.text }]}>Gestionar perfiles de niños</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('Ingles')}
        >
          <Ionicons name="language-outline" size={22} color="#10B981" />
          <Text style={[styles.menuText, { color: colors.text }]}>Módulo de Inglés</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      {/* Información */}
      <Card variant="elevated" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Información</Text>
        <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
          <Text style={[styles.menuText, { color: colors.textSecondary }]}>Versión de la app: 1.0.0</Text>
        </View>
        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
          <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
          <Text style={[styles.menuText, { color: colors.text }]}>Soporte técnico</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      {/* Botón cerrar sesión */}
      <Button
        title="Cerrar sesión"
        variant="outline"
        onPress={handleLogout}
        style={{ marginVertical: 24, borderColor: colors.error }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
});