'use client';

import { Skeleton, SkeletonText, SimpleGrid, Stack } from '@chakra-ui/react';

export function SkeletonStatGrid({ columns = 4 }: { columns?: number }) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: columns }} gap={4}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height="120px" borderRadius="lg" />
      ))}
    </SimpleGrid>
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <Stack gap={2}>
      <Skeleton height="44px" borderRadius="md" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height="52px" borderRadius="md" />
      ))}
    </Stack>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <Stack gap={4}>
      {Array.from({ length: fields }).map((_, i) => (
        <Stack key={i} gap={2}>
          <SkeletonText noOfLines={1} width="120px" />
          <Skeleton height="40px" borderRadius="md" />
        </Stack>
      ))}
    </Stack>
  );
}
