import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceOrbProps {
  state: VoiceState;
  onPress?: () => void;
  size?: number;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  onPress,
  size = 220,
}) => {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ripple1Anim = useRef(new Animated.Value(0)).current;
  const ripple2Anim = useRef(new Animated.Value(0)).current;
  const ripple3Anim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  // Continuous rotation for "thinking" state
  useEffect(() => {
    let rotateLoop: Animated.CompositeAnimation | null = null;
    if (state === 'thinking') {
      rotateLoop = Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateLoop.start();
    } else {
      rotationAnim.setValue(0);
    }
    return () => {
      rotateLoop?.stop();
    };
  }, [state]);

  // Main pulse & ripple effect based on state
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let rippleLoop: Animated.CompositeAnimation | null = null;

    if (state === 'listening') {
      // Fast, responsive pulse for capturing microphone audio
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.98,
            duration: 500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

      // Waves emitting outwards
      rippleLoop = Animated.loop(
        Animated.stagger(280, [
          Animated.sequence([
            Animated.timing(ripple1Anim, {
              toValue: 1,
              duration: 1100,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(ripple1Anim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ripple2Anim, {
              toValue: 1,
              duration: 1100,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(ripple2Anim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ripple3Anim, {
              toValue: 1,
              duration: 1100,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(ripple3Anim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );

      pulseLoop.start();
      rippleLoop.start();
    } else if (state === 'speaking') {
      // Dynamic bouncing waves when AI Panda speaks
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 350,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.92,
            duration: 350,
            easing: Easing.in(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 300,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      rippleLoop = Animated.loop(
        Animated.stagger(320, [
          Animated.sequence([
            Animated.timing(ripple1Anim, {
              toValue: 1,
              duration: 1300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(ripple1Anim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ripple2Anim, {
              toValue: 1,
              duration: 1300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(ripple2Anim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );

      pulseLoop.start();
      rippleLoop.start();
    } else if (state === 'thinking') {
      // Slow undulating breath
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.94,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      // 'idle': Gentle, calm living respiration
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.96,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      ripple1Anim.setValue(0);
      ripple2Anim.setValue(0);
      ripple3Anim.setValue(0);
    }

    return () => {
      pulseLoop?.stop();
      rippleLoop?.stop();
    };
  }, [state]);

  // Color schemes for each state
  const colors = {
    idle: {
      core: '#E8533F',
      outer: '#FF8A7A',
      halo: 'rgba(232, 83, 63, 0.22)',
      ripple: 'rgba(232, 83, 63, 0.35)',
      icon: 'sparkles',
    },
    listening: {
      core: '#10B981',
      outer: '#34D399',
      halo: 'rgba(16, 185, 129, 0.30)',
      ripple: 'rgba(16, 185, 129, 0.45)',
      icon: 'mic',
    },
    thinking: {
      core: '#8B5CF6',
      outer: '#A78BFA',
      halo: 'rgba(139, 92, 246, 0.30)',
      ripple: 'rgba(139, 92, 246, 0.45)',
      icon: 'sync-outline',
    },
    speaking: {
      core: '#F59E0B',
      outer: '#FBBF24',
      halo: 'rgba(245, 158, 11, 0.30)',
      ripple: 'rgba(245, 158, 11, 0.45)',
      icon: 'volume-high',
    },
  }[state];

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const coreSize = size * 0.62;

  // Helper for ripple styles
  const getRippleStyle = (animVal: Animated.Value) => {
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: colors.outer,
      position: 'absolute' as const,
      transform: [
        {
          scale: animVal.interpolate({
            inputRange: [0, 1],
            outputRange: [0.65, 1.45],
          }),
        },
      ],
      opacity: animVal.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0.7, 0.4, 0],
      }),
    };
  };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { width: size * 1.5, height: size * 1.5 }]}
      accessibilityRole="button"
      accessibilityLabel={`Estado de voz: ${state}`}
    >
      {/* Outer ambient glow halo */}
      <Animated.View
        style={[
          styles.halo,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: (size * 1.2) / 2,
            backgroundColor: colors.halo,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Pulsing sound wave ripples */}
      <Animated.View style={getRippleStyle(ripple1Anim)} />
      <Animated.View style={getRippleStyle(ripple2Anim)} />
      <Animated.View style={getRippleStyle(ripple3Anim)} />

      {/* Middle energy ring */}
      <Animated.View
        style={[
          styles.middleRing,
          {
            width: size * 0.88,
            height: size * 0.88,
            borderRadius: (size * 0.88) / 2,
            borderColor: colors.outer,
            transform: [
              { scale: pulseAnim },
              { rotate: state === 'thinking' ? spin : '0deg' },
            ],
          },
        ]}
      />

      {/* Core Glowing Orb */}
      <Animated.View
        style={[
          styles.core,
          {
            width: coreSize,
            height: coreSize,
            borderRadius: coreSize / 2,
            backgroundColor: colors.core,
            shadowColor: colors.core,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {/* Soft highlight reflection */}
        <View
          style={[
            styles.highlight,
            {
              width: coreSize * 0.45,
              height: coreSize * 0.28,
              borderRadius: coreSize * 0.25,
            },
          ]}
        />

        {/* Center state icon */}
        <Ionicons name={colors.icon as any} size={coreSize * 0.34} color="white" />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  halo: {
    position: 'absolute',
  },
  middleRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  core: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 28,
    elevation: 18,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 14,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    transform: [{ rotate: '-30deg' }],
  },
});
