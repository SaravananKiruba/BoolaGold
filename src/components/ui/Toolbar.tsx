'use client';

import { Box, HStack, Stack } from '@chakra-ui/react';
import type { PropsWithChildren, ReactNode } from 'react';

interface ToolbarProps {
  primary?: ReactNode;
  filters?: ReactNode;
}

/**
 * Responsive toolbar: filters wrap on mobile, primary actions stick to the end.
 * Use above a DataTable or list.
 */
export function Toolbar({
  primary,
  filters,
  children,
}: PropsWithChildren<ToolbarProps>) {
  return (
    <Box
      bg="app.surface"
      borderWidth="1px"
      borderColor="app.border"
      borderRadius="lg"
      p={{ base: 3, md: 4 }}
      shadow="card"
    >
      <Stack
        direction={{ base: 'column', md: 'row' }}
        gap={3}
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
      >
        <HStack
          gap={2}
          wrap="wrap"
          flex="1"
          minW={0}
          align="center"
        >
          {filters ?? children}
        </HStack>
        {primary && (
          <HStack gap={2} wrap="wrap" justify={{ base: 'flex-start', md: 'flex-end' }}>
            {primary}
          </HStack>
        )}
      </Stack>
    </Box>
  );
}

export default Toolbar;
