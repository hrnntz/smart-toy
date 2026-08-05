import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { storage } from '../../services/storage';
import { useTheme } from '../../hooks/useTheme';

export default function AuthLoadingScreen({ navigation }: any) {
  const { colors, typography } = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getItem('token');
        if (token) {
          // Redirigir a Home
          navigation.replace('Home');
        } else {
          navigation.replace('Welcome');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        navigation.replace('Welcome');
      }
    };
    checkAuth();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.logo, { color: colors.primary, fontSize: typography.size.xxxl }]}>🐼</Text>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontWeight: 'bold',
  },
});