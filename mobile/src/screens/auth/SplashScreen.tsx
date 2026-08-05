import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { storage } from '../../services/storage';

export default function SplashScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animación de entrada suave del isotipo
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

    // Verificación de autenticación y transición limpia
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
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Placeholder Isotipo App */}
        <View style={[styles.isotypeCircle, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
          <Text style={{ fontSize: 72 }}>🐼</Text>
        </View>
        <Text style={[styles.appName, { color: colors.text, fontSize: typography.size.xxl }]}>
          Smart Toy
        </Text>
        <Text style={[styles.appSub, { color: colors.textSecondary }]}>
          Aprende & Juega
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  isotypeCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 20,
  },
  appName: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appSub: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
});
