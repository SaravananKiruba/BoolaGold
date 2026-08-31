'use client';

import { Box, Flex, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}

export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      align={{ base: 'stretch', md: 'flex-end' }}
      justify="space-between"
      gap={{ base: 3, md: 6 }}
    >
      <Stack gap={1} flex="1" minW={0}>
        {eyebrow && (
          <Box color="app.subtle" fontSize="sm" fontWeight="500">
            {eyebrow}
          </Box>
        )}
        <Heading
          size={{ base: 'lg', md: 'xl' }}
          fontFamily="heading"
          color="app.text"
          lineHeight="1.15"
          truncate
        >
          {title}
        </Heading>
        {description && (
          <Text color="app.subtle" fontSize={{ base: 'sm', md: 'md' }}>
            {description}
          </Text>
        )}
      </Stack>
      {actions && (
        <HStack
          gap={2}
          wrap="wrap"
          justify={{ base: 'flex-start', md: 'flex-end' }}
          flexShrink={0}
        >
          {actions}
        </HStack>
      )}
    </Flex>
  );
}

export default PageHeader;
