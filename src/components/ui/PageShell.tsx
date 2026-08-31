'use client';

import { Box, Stack } from '@chakra-ui/react';
import type { PropsWithChildren } from 'react';

interface PageShellProps {
  /** Max content width. Defaults to 96rem (1536px) — matches the top nav. */
  maxW?: string;
}

/**
 * Centered, responsive page container. Explicit `mx="auto"` + full width so
 * content is horizontally centered regardless of Chakra's Container defaults.
 */
export function PageShell({ children, maxW = '96rem' }: PropsWithChildren<PageShellProps>) {
  return (
    <Box w="100%" mx="auto" maxW={maxW} px={{ base: 4, sm: 5, md: 8, lg: 10 }} py={{ base: 5, md: 7, lg: 9 }}>
      <Stack gap={{ base: 4, md: 6 }}>{children}</Stack>
    </Box>
  );
}

export default PageShell;
