import React, { useEffect, useRef } from 'react';
import { View, Image, Animated } from 'react-native';
import { Label, Spinner } from 'heroui-native';
import { storage } from '../../services/storage';

export default function SplashScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animación de entrada (preservada intacta)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      try {
        const token = await storage.getItem('token');
        if (token) {
          navigation.replace('Home');
        } else {
          navigation.replace('Welcome');
        }
      } catch (error) {
        navigation.replace('Welcome');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-background">
      <Animated.View
        style={{
          alignItems: 'center',
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Image
          source={require('../../../assets/logo.jpg')}
          style={{ width: 140, height: 140, borderRadius: 28, marginBottom: 20 }}
          resizeMode="contain"
        />

        <Label className="text-3xl font-extrabold text-foreground tracking-wide">
          Smart Toy
        </Label>
        <Label className="text-sm font-medium text-muted mt-1">
          Aprende &amp; Juega
        </Label>

        <Spinner
          size="sm"
          color="default"
          className="mt-8"
        />
      </Animated.View>
    </View>
  );
}
