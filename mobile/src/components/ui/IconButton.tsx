/**
 * IconButton component — HeroUI Native v1
 *
 * Wraps heroui-native's Button with isIconOnly, preserving the original API
 * (icon, size, color, variant).
 *
 * Variant mapping:
 *  - 'solid'   → heroui 'secondary'
 *  - 'outline' → heroui 'outline'
 *  - 'ghost'   → heroui 'ghost'
 */
import React from 'react';
import { Button as HeroButton, useThemeColor } from 'heroui-native';
import { Ionicons } from '@expo/vector-icons';
import type { ButtonRootProps } from 'heroui-native';

type IconButtonVariant = 'solid' | 'outline' | 'ghost';

type HeroVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';

const variantMap: Record<IconButtonVariant, HeroVariant> = {
  solid: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
};

interface IconButtonProps extends Omit<ButtonRootProps, 'variant' | 'children' | 'size' | 'feedbackVariant' | 'animation'> {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  variant?: IconButtonVariant;
}

export const IconButton = ({
  icon,
  size = 22,
  color,
  variant = 'ghost',
  className,
  ...props
}: IconButtonProps) => {
  const foreground = useThemeColor('foreground');
  const iconColor = color ?? foreground;
  const heroVariant = variantMap[variant];

  return (
    <HeroButton
      variant={heroVariant}
      isIconOnly
      size="md"
      className={className}
      {...props}
    >
      <Ionicons name={icon} size={size} color={iconColor} />
    </HeroButton>
  );
};
