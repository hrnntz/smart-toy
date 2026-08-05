import React from 'react';
import { TouchableOpacity, StyleSheet, TouchableOpacityProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface IconButtonProps extends TouchableOpacityProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  variant?: 'solid' | 'outline' | 'ghost';
  buttonStyle?: ViewStyle;
}

export const IconButton = ({ icon, size = 24, color, variant = 'ghost', buttonStyle, ...props }: IconButtonProps) => {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'solid': return colors.surface;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return 'transparent';
    }
  };

  const getIconColor = () => {
    if (color) return color;
    return colors.text;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
        },
        buttonStyle,
      ]}
      {...props}
    >
      <Ionicons name={icon} size={size} color={getIconColor()} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
