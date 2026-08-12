import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Label, Spinner } from 'heroui-native';
import { storage } from '../../services/storage';

export default function AuthLoadingScreen({ navigation }: any) {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getItem('token');
        if (token) {
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
    <View className="flex-1 justify-center items-center bg-background gap-5">
      <Label className="text-5xl">🐼</Label>
      <Spinner size="lg" color="default" />
    </View>
  );
}