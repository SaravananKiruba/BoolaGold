'use client';

import { Badge } from '@chakra-ui/react';
import type { ShopBusinessType } from '@/components/providers/ShopProvider';

interface ShopTypeBadgeProps {
  type: ShopBusinessType | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

export function ShopTypeBadge({ type, size = 'sm' }: ShopTypeBadgeProps) {
  if (!type) return null;
  if (type === 'WHOLESALE') {
    return (
      <Badge
        variant="subtle"
        colorPalette="gray"
        size={size}
        bg="flow.wholesale.bg"
        color="flow.wholesale.fg"
        fontWeight="600"
        textTransform="uppercase"
        letterSpacing="0.04em"
      >
        ⚖ Wholesale · Metal
      </Badge>
    );
  }
  return (
    <Badge
      variant="subtle"
      colorPalette="yellow"
      size={size}
      bg="flow.retail.bg"
      color="flow.retail.fg"
      fontWeight="600"
      textTransform="uppercase"
      letterSpacing="0.04em"
    >
      ₹ Retail · Cash
    </Badge>
  );
}

export default ShopTypeBadge;
