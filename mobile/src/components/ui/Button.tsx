/**
 * Button component — HeroUI Native v1
 *
 * Thin wrapper around heroui-native's Button that preserves the original API
 * (variant names, isLoading, title prop) so existing screens need minimal changes.
 *
 * Variant mapping:
 *  - 'primary'   → heroui 'primary'
 *  - 'secondary' → heroui 'secondary'
 *  - 'outline'   → heroui 'outline'
 *  - 'ghost'     → heroui 'ghost'
 */
import React from 'react';
import { Button as HeroButton, Spinner, useThemeColor } from 'heroui-native';
import type { ButtonRootProps } from 'heroui-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'solid' | 'flat';

interface ButtonProps extends Omit<ButtonRootProps, 'variant' | 'feedbackVariant' | 'animation'> {
  title: string;
  variant?: ButtonVariant;
  isLoading?: boolean;
}

export const Button = ({
  title,
  variant = 'primary',
  isLoading = false,
  className,
  isDisabled,
  ...props
}: ButtonProps) => {
  const accentForeground = useThemeColor('accent-foreground');
  const foreground = useThemeColor('foreground');

  const spinnerColor =
    variant === 'primary' || variant === 'secondary' || variant === 'solid'
      ? accentForeground
      : foreground;

  const mappedVariant =
    variant === 'solid'
      ? 'secondary'
      : variant === 'flat'
        ? 'tertiary'
        : variant;

  return (
    <HeroButton
      variant={mappedVariant}
      isDisabled={isLoading || isDisabled}
      className={className ?? 'w-full'}
      {...props}
    >
      {isLoading ? (
        <Spinner color={spinnerColor} />
      ) : (
        <HeroButton.Label>{title}</HeroButton.Label>
      )}
    </HeroButton>
  );
};
