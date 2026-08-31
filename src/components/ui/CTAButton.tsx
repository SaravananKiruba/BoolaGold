'use client';

import { Button, HStack, type ButtonProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface CTAButtonProps extends Omit<ButtonProps, 'variant'> {
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

/**
 * Standardized action button. Guarantees visible, on-brand contrast for
 * primary CTAs (deep brand purple with white text + Fluent elevation).
 */
export function CTAButton({
  icon,
  trailingIcon,
  children,
  variant = 'primary',
  ...rest
}: CTAButtonProps) {
  const base = {
    primary: {
      bg: 'brand.600',
      color: 'white',
      borderWidth: '1px',
      borderColor: 'brand.700',
      _hover: { bg: 'brand.700', borderColor: 'brand.800' },
      _active: { bg: 'brand.800' },
      shadow: 'e4',
    },
    secondary: {
      bg: 'app.canvas',
      color: 'app.text',
      borderWidth: '1px',
      borderColor: 'app.border',
      _hover: { bg: 'app.muted', borderColor: 'app.borderStrong' },
      shadow: 'e2',
    },
    ghost: {
      bg: 'transparent',
      color: 'app.text',
      borderWidth: '1px',
      borderColor: 'transparent',
      _hover: { bg: 'app.muted' },
    },
    danger: {
      bg: 'status.danger',
      color: 'white',
      borderWidth: '1px',
      borderColor: 'red.700',
      _hover: { bg: 'red.700' },
      shadow: 'e4',
    },
  } as const;

  const tokens = base[variant];

  return (
    <Button
      borderRadius="md"
      fontWeight="600"
      letterSpacing="0.01em"
      {...tokens}
      {...rest}
    >
      <HStack gap={2}>
        {icon}
        <span>{children}</span>
        {trailingIcon}
      </HStack>
    </Button>
  );
}

export default CTAButton;
