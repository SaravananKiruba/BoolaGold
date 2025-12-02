'use client';

import { ChakraProvider as ChakraUIProvider } from '@chakra-ui/react';
import { system } from '@/theme/theme';

export function ChakraProvider({ children }: { children: React.ReactNode }) {
  return <ChakraUIProvider value={system}>{children}</ChakraUIProvider>;
}
