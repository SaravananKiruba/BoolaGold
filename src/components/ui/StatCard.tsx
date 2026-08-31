'use client';

import { Badge, Box, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: { label: string; direction: 'up' | 'down' | 'neutral' };
  accent?: 'brand' | 'retail' | 'wholesale' | 'success' | 'warning' | 'danger' | 'info';
}

const accentTokens: Record<Required<StatCardProps>['accent'], { fg: string; bg: string }> = {
  brand:     { fg: 'brand.fg',           bg: 'brand.subtle' },
  retail:    { fg: 'flow.retail.fg',     bg: 'flow.retail.bg' },
  wholesale: { fg: 'flow.wholesale.fg',  bg: 'flow.wholesale.bg' },
  success:   { fg: 'status.success',     bg: 'green.50' },
  warning:   { fg: 'status.warning',     bg: 'orange.50' },
  danger:    { fg: 'status.danger',      bg: 'red.50' },
  info:      { fg: 'status.info',        bg: 'blue.50' },
};

export function StatCard({ label, value, hint, icon, trend, accent = 'brand' }: StatCardProps) {
  const tokens = accentTokens[accent];
  return (
    <Box
      bg="app.surface"
      borderWidth="1px"
      borderColor="app.border"
      borderRadius="lg"
      p={{ base: 4, md: 5 }}
      shadow="card"
      transition="box-shadow 0.2s ease, transform 0.2s ease"
      _hover={{ shadow: 'cardHover', transform: 'translateY(-1px)' }}
    >
      <Flex align="center" justify="space-between" gap={3} mb={2}>
        <Text
          fontSize="xs"
          textTransform="uppercase"
          letterSpacing="0.06em"
          fontWeight="600"
          color="app.subtle"
        >
          {label}
        </Text>
        {icon && (
          <Flex
            align="center"
            justify="center"
            boxSize={9}
            borderRadius="md"
            bg={tokens.bg}
            color={tokens.fg}
            fontSize="lg"
          >
            {icon}
          </Flex>
        )}
      </Flex>
      <Stack gap={1}>
        <Heading size={{ base: 'lg', md: 'xl' }} color="app.text" fontFamily="heading">
          {value}
        </Heading>
        {(hint || trend) && (
          <Flex align="center" gap={2} wrap="wrap">
            {trend && (
              <Badge
                colorPalette={
                  trend.direction === 'up' ? 'green' : trend.direction === 'down' ? 'red' : 'gray'
                }
                variant="subtle"
              >
                {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '–'}{' '}
                {trend.label}
              </Badge>
            )}
            {hint && (
              <Text fontSize="sm" color="app.subtle">
                {hint}
              </Text>
            )}
          </Flex>
        )}
      </Stack>
    </Box>
  );
}

export default StatCard;
