/**
 * Card component — HeroUI Native v1
 *
 * Re-exports heroui-native's Card with a compatibility shim for the old API
 * (variant: 'elevated' | 'flat' | 'outline').
 *
 * Variant mapping:
 *  - 'elevated' → heroui 'default'  (surface shadow)
 *  - 'flat'     → heroui 'secondary'
 *  - 'outline'  → heroui 'default' + custom className border
 *
 * Also re-exports Card sub-components for direct use: Card.Header, Card.Body,
 * Card.Footer, Card.Title, Card.Description.
 */
import React from 'react';
import { Card as HeroCard } from 'heroui-native';
import type { ViewProps } from 'react-native';

type OldVariant = 'elevated' | 'flat' | 'outline';
type HeroVariant = 'default' | 'secondary' | 'tertiary' | 'transparent';

const variantMap: Record<OldVariant, HeroVariant> = {
  elevated: 'default',
  flat: 'secondary',
  outline: 'default',
};

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: OldVariant;
  className?: string;
}

export const Card = ({
  children,
  variant = 'elevated',
  className,
  ...props
}: CardProps) => {
  const heroVariant = variantMap[variant];
  const outlineClass = variant === 'outline' ? 'border border-separator' : '';

  return (
    <HeroCard
      variant={heroVariant}
      className={[outlineClass, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </HeroCard>
  );
};

// Re-export sub-components for composition
Card.Header = HeroCard.Header;
Card.Body = HeroCard.Body;
Card.Footer = HeroCard.Footer;
Card.Title = HeroCard.Title;
Card.Description = HeroCard.Description;
