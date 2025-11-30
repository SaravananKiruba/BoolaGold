'use client';

import { ChakraProvider as ChakraUIProvider } from '@chakra-ui/react';
import theme from '@/theme/theme';

export function ChakraProvider({ children }: { children: React.ReactNode }) {
  return <ChakraUIProvider value={theme}>{children}</ChakraUIProvider>;
}
