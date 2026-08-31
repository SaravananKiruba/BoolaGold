'use client';

import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      bg="app.surface"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="app.border"
      borderRadius="lg"
      py={{ base: 10, md: 14 }}
      px={{ base: 4, md: 8 }}
      textAlign="center"
    >
      {icon && (
        <Box fontSize="3xl" mb={3} color="app.subtle">
          {icon}
        </Box>
      )}
      <Stack gap={1} maxW="md">
        <Heading size="md" color="app.text">
          {title}
        </Heading>
        {description && (
          <Text color="app.subtle" fontSize="sm">
            {description}
          </Text>
        )}
      </Stack>
      {action && <Box mt={5}>{action}</Box>}
    </Flex>
  );
}

export default EmptyState;
