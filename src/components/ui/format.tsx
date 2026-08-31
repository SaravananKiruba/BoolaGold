'use client';

import { Text, type TextProps } from '@chakra-ui/react';

interface MoneyProps extends Omit<TextProps, 'children'> {
  value: number | string | null | undefined;
  currency?: string;
  locale?: string;
  fractionDigits?: number;
  compact?: boolean;
  zeroDash?: boolean;
}

/** Formats an amount as localized currency (default INR). */
export function Money({
  value,
  currency = 'INR',
  locale = 'en-IN',
  fractionDigits = 2,
  compact = false,
  zeroDash = false,
  ...rest
}: MoneyProps) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (numeric === null || numeric === undefined || Number.isNaN(numeric)) {
    return (
      <Text as="span" color="app.subtle" {...rest}>
        —
      </Text>
    );
  }
  if (zeroDash && numeric === 0) {
    return (
      <Text as="span" color="app.subtle" {...rest}>
        —
      </Text>
    );
  }
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    notation: compact ? 'compact' : 'standard',
  });
  return (
    <Text as="span" fontVariantNumeric="tabular-nums" {...rest}>
      {formatter.format(numeric)}
    </Text>
  );
}

interface WeightProps extends Omit<TextProps, 'children'> {
  value: number | string | null | undefined;
  unit?: 'g' | 'kg' | 'oz';
  fractionDigits?: number;
  locale?: string;
  zeroDash?: boolean;
}

/** Formats a weight (default grams, 3 dp — matches Prisma precision). */
export function Weight({
  value,
  unit = 'g',
  fractionDigits = 3,
  locale = 'en-IN',
  zeroDash = false,
  ...rest
}: WeightProps) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (numeric === null || numeric === undefined || Number.isNaN(numeric)) {
    return (
      <Text as="span" color="app.subtle" {...rest}>
        —
      </Text>
    );
  }
  if (zeroDash && numeric === 0) {
    return (
      <Text as="span" color="app.subtle" {...rest}>
        —
      </Text>
    );
  }
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(numeric);
  return (
    <Text as="span" fontVariantNumeric="tabular-nums" {...rest}>
      {formatted}
      {' '}
      <Text as="span" color="app.subtle" fontSize="0.85em">
        {unit}
      </Text>
    </Text>
  );
}
