import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { storage } from '../../services/storage';

export default function SplashScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
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
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
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
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 28,
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
