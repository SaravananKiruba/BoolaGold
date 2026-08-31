'use client';

import { Box, Flex, HStack, SimpleGrid, Stack, Table, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Optional secondary label shown on mobile card layout. Defaults to `header`. */
  mobileLabel?: ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Hide this column at the given breakpoint and below. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
  /** Column-specific width on desktop */
  width?: string;
  /** If true, uses this cell as the mobile card headline (no label). */
  primary?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  emptyState?: ReactNode;
  /** Renders a click handler on each row (desktop) / card (mobile). */
  onRowClick?: (row: T) => void;
}

/**
 * Responsive table:
 *  - Desktop / tablet ≥ md: renders a real <table>.
 *  - Mobile < md: renders one card per row using labeled fields.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyState,
  onRowClick,
}: DataTableProps<T>) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <Box
        display={{ base: 'none', md: 'block' }}
        bg="app.surface"
        borderWidth="1px"
        borderColor="app.border"
        borderRadius="lg"
        shadow="card"
        overflow="hidden"
      >
        <Box overflowX="auto">
          <Table.Root size="md" interactive={!!onRowClick} striped>
            <Table.Header>
              <Table.Row>
                {columns.map((col) => (
                  <Table.ColumnHeader
                    key={col.key}
                    textAlign={col.align}
                    width={col.width}
                    hideBelow={col.hideBelow}
                    color="app.subtle"
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.06em"
                    fontWeight="600"
                    bg="app.muted"
                    borderColor="app.border"
                  >
                    {col.header}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((row, i) => (
                <Table.Row
                  key={rowKey(row, i)}
                  cursor={onRowClick ? 'pointer' : 'default'}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <Table.Cell
                      key={col.key}
                      textAlign={col.align}
                      hideBelow={col.hideBelow}
                      borderColor="app.border"
                      color="app.text"
                    >
                      {col.cell(row)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>

      {/* Mobile card list */}
      <SimpleGrid columns={1} gap={3} display={{ base: 'grid', md: 'none' }}>
        {rows.map((row, i) => {
          const primary = columns.find((c) => c.primary);
          const secondary = columns.filter((c) => !c.primary);
          return (
            <Box
              key={rowKey(row, i)}
              bg="app.surface"
              borderWidth="1px"
              borderColor="app.border"
              borderRadius="lg"
              p={4}
              shadow="card"
              onClick={() => onRowClick?.(row)}
              cursor={onRowClick ? 'pointer' : 'default'}
              _active={{ shadow: 'cardHover' }}
            >
              {primary && (
                <Box mb={2} fontWeight="600" color="app.text">
                  {primary.cell(row)}
                </Box>
              )}
              <Stack gap={1.5}>
                {secondary.map((col) => (
                  <Flex key={col.key} justify="space-between" gap={3} align="baseline">
                    <Text fontSize="xs" color="app.subtle" textTransform="uppercase" letterSpacing="0.05em">
                      {col.mobileLabel ?? col.header}
                    </Text>
                    <HStack
                      color="app.text"
                      fontSize="sm"
                      justify="flex-end"
                      textAlign="right"
                      flex="1"
                      minW={0}
                    >
                      <Box>{col.cell(row)}</Box>
                    </HStack>
                  </Flex>
                ))}
              </Stack>
            </Box>
          );
        })}
      </SimpleGrid>
    </>
  );
}

export default DataTable;
