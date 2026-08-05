import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'flat' | 'outline';
}

export const Card = ({ children, style, variant = 'elevated', ...props }: CardProps) => {
  const { colors, borderRadius, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.xxl,
        },
        variant === 'elevated' && shadows,
        variant === 'outline' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginVertical: 8,
  },
});
