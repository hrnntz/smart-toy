/**
 * Input component — HeroUI Native v1
 *
 * Wraps heroui-native's TextField + Label + Input + FieldError compound pattern.
 * Preserves the original API (label, error props + all TextInputProps) so existing
 * screens need no changes.
 */
import React from 'react';
import {
  TextField,
  Input as HeroInput,
  Label,
  FieldError,
  Description,
} from 'heroui-native';
import type { TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  description?: string;
  isRequired?: boolean;
  className?: string;
  inputClassName?: string;
}

export const Input = ({
  label,
  error,
  description,
  isRequired = false,
  className,
  inputClassName,
  ...props
}: InputProps) => {
  const isInvalid = !!error;

  return (
    <TextField
      isRequired={isRequired}
      isInvalid={isInvalid}
      className={className ?? 'w-full my-1'}
    >
      {label && <Label>{label}</Label>}
      <HeroInput
        className={inputClassName}
        {...props}
      />
      {description && !error && <Description>{description}</Description>}
      {error && <FieldError>{error}</FieldError>}
    </TextField>
  );
};
