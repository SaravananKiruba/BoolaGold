'use client';

import { Container, Stack } from '@chakra-ui/react';
import type { PropsWithChildren } from 'react';

interface PageShellProps {
  maxW?: string;
}

export function PageShell({ children, maxW = '7xl' }: PropsWithChildren<PageShellProps>) {
  return (
    <Container
      maxW={maxW}
      px={{ base: 3, sm: 4, md: 6, lg: 8 }}
      py={{ base: 4, md: 6, lg: 8 }}
    >
      <Stack gap={{ base: 4, md: 6 }}>{children}</Stack>
    </Container>
  );
}

export default PageShell;
