import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { storage } from '../../services/storage';

export default function AuthLoadingScreen({ navigation }: any) {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getItem('token');
        if (token) {
          // Redirigir a Home
          navigation.replace('Home');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        navigation.replace('Login');
      }
    };
    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A90D9" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
});