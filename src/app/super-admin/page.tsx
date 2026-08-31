'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonStatGrid, SkeletonTable } from '@/components/ui/Skeletons';
import { CTAButton } from '@/components/ui/CTAButton';
import {
  IconAlert,
  IconChevronRight,
  IconPlus,
  IconRefresh,
  IconShieldCheck,
  IconSparkle,
  IconStore,
  IconTrendUp,
  IconUser,
  IconUsers,
} from '@/components/ui/icons';

interface Shop {
  id: string;
  name: string;
  city: string;
  state: string;
  isActive: boolean;
  createdAt: string;
  _count: { users: number };
}

interface DashboardStats {
  totalShops: number;
  activeShops: number;
  totalUsers: number;
  activeUsers: number;
  shops: Shop[];
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/super-admin/dashboard', { cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setStats(data.data);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const shopActivationRate = stats && stats.totalShops > 0
    ? Math.round((stats.activeShops / stats.totalShops) * 100)
    : 0;
  const userEngagementRate = stats && stats.totalUsers > 0
    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
    : 0;

  const columns: DataTableColumn<Shop>[] = [
    {
      key: 'name',
      header: 'Shop',
      primary: true,
      cell: (row) => (
        <HStack gap={3} align="center">
          <Flex
            align="center"
            justify="center"
            boxSize={9}
            borderRadius="md"
            bg="brand.subtle"
            color="brand.emphasized"
            flexShrink={0}
          >
            <IconStore size={18} />
          </Flex>
          <Stack gap={0} minW={0}>
            <Text fontWeight="600" color="app.text" truncate>{row.name}</Text>
            <Text fontSize="xs" color="app.subtle" truncate>
              {row.city}{row.state ? `, ${row.state}` : ''}
            </Text>
          </Stack>
        </HStack>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      mobileLabel: 'Location',
      hideBelow: 'lg',
      cell: (row) => (
        <Text fontSize="sm" color="app.text">
          {row.city}{row.state ? `, ${row.state}` : ''}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge
          variant="subtle"
          bg={row.isActive ? 'green.50' : 'red.50'}
          color={row.isActive ? 'status.success' : 'status.danger'}
          borderWidth="1px"
          borderColor={row.isActive ? 'green.200' : 'red.200'}
          borderRadius="pill"
          px={2.5}
          py={0.5}
          textTransform="uppercase"
          letterSpacing="0.06em"
          fontSize="10px"
          fontWeight="700"
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'users',
      header: 'Users',
      align: 'right',
      hideBelow: 'md',
      cell: (row) => (
        <HStack gap={1.5} justify="flex-end">
          <IconUsers size={14} />
          <Text fontVariantNumeric="tabular-nums" fontWeight="600" color="app.text">
            {row._count.users}
          </Text>
        </HStack>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      hideBelow: 'md',
      cell: (row) => (
        <Text fontSize="sm" color="app.subtle" fontVariantNumeric="tabular-nums">
          {new Date(row.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <CTAButton
          size="sm"
          variant="ghost"
          color="brand.emphasized"
          trailingIcon={<IconChevronRight size={14} />}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            router.push('/shops');
          }}
        >
          Manage
        </CTAButton>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={
          <HStack gap={2}>
            <IconShieldCheck size={14} />
            <Text>SaaS Platform · Super Admin</Text>
          </HStack>
        }
        title="Tenant console"
        description="Overview of every jewelry shop, user, and platform health metric."
        actions={
          <>
            <CTAButton
              variant="secondary"
              icon={<IconRefresh size={16} />}
              onClick={fetchDashboardData}
              loading={loading && !!stats}
            >
              Refresh
            </CTAButton>
            <CTAButton
              variant="secondary"
              icon={<IconUser size={16} />}
              onClick={() => router.push('/users')}
            >
              New user
            </CTAButton>
            <CTAButton
              variant="primary"
              icon={<IconPlus size={16} />}
              onClick={() => router.push('/shops')}
            >
              New shop
            </CTAButton>
          </>
        }
      />

      {error && (
        <Flex
          role="alert"
          align="flex-start"
          gap={3}
          p={4}
          bg="red.50"
          borderWidth="1px"
          borderColor="red.200"
          borderRadius="lg"
          color="red.700"
        >
          <Box mt={0.5}><IconAlert size={20} /></Box>
          <Stack gap={0.5} flex="1">
            <Text fontWeight="600">Couldn't load the dashboard</Text>
            <Text fontSize="sm">{error}</Text>
          </Stack>
          <CTAButton
            size="sm"
            variant="ghost"
            icon={<IconRefresh size={14} />}
            onClick={fetchDashboardData}
            color="red.700"
            _hover={{ bg: 'red.100' }}
          >
            Retry
          </CTAButton>
        </Flex>
      )}

      {loading && !stats ? (
        <>
          <SkeletonStatGrid columns={4} />
          <SkeletonTable rows={5} />
        </>
      ) : stats ? (
        <>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: 3, md: 4 }}>
            <StatCard
              accent="brand"
              icon={<IconStore size={18} />}
              label="Total shops"
              value={stats.totalShops}
              hint={
                <HStack gap={1}>
                  <Text color="status.success" fontWeight="600">{stats.activeShops} active</Text>
                  <Text>·</Text>
                  <Text>{stats.totalShops - stats.activeShops} inactive</Text>
                </HStack>
              }
            />
            <StatCard
              accent="success"
              icon={<IconShieldCheck size={18} />}
              label="Active shops"
              value={stats.activeShops}
              hint={`${shopActivationRate}% activation rate`}
            />
            <StatCard
              accent="info"
              icon={<IconUsers size={18} />}
              label="System users"
              value={stats.totalUsers}
              hint={
                <HStack gap={1}>
                  <Text color="status.info" fontWeight="600">{stats.activeUsers} active</Text>
                  <Text>·</Text>
                  <Text>{stats.totalUsers - stats.activeUsers} disabled</Text>
                </HStack>
              }
            />
            <StatCard
              accent="warning"
              icon={<IconTrendUp size={18} />}
              label="User engagement"
              value={`${userEngagementRate}%`}
              hint="Active vs. total users"
            />
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <QuickAction
              icon={<IconStore size={22} />}
              accent="brand"
              title="Create a new shop"
              description="Set up shop profile, GST/PAN, invoice branding, retail vs wholesale flow, and bank details."
              cta="Open shops"
              onClick={() => router.push('/shops')}
            />
            <QuickAction
              icon={<IconUser size={22} />}
              accent="gold"
              title="Add a shop owner"
              description="Provision a shop-scoped OWNER user or platform SUPER_ADMIN. Roles and permissions are enforced everywhere."
              cta="Open users"
              onClick={() => router.push('/users')}
            />
          </SimpleGrid>

          <Box
            bg="app.canvas"
            borderWidth="1px"
            borderColor="app.border"
            borderRadius="lg"
            shadow="e2"
            overflow="hidden"
          >
            <Flex
              px={{ base: 4, md: 6 }}
              py={4}
              borderBottomWidth="1px"
              borderColor="app.border"
              justify="space-between"
              align={{ base: 'flex-start', md: 'center' }}
              direction={{ base: 'column', md: 'row' }}
              gap={3}
            >
              <Stack gap={0.5}>
                <Heading size={{ base: 'md', md: 'lg' }} color="app.text" fontFamily="heading">
                  Shops overview
                </Heading>
                <Text fontSize="sm" color="app.subtle">
                  Every jewelry shop on the platform. Click a row to manage the tenant.
                </Text>
              </Stack>
              <HStack gap={2}>
                <Badge variant="subtle" bg="app.muted" color="app.text" borderRadius="pill" px={2.5}>
                  {stats.shops.length} total
                </Badge>
                <CTAButton
                  size="sm"
                  variant="primary"
                  icon={<IconPlus size={14} />}
                  onClick={() => router.push('/shops')}
                >
                  New shop
                </CTAButton>
              </HStack>
            </Flex>

            <Box p={{ base: 4, md: 6 }}>
              <DataTable
                columns={columns}
                rows={stats.shops}
                rowKey={(row) => row.id}
                onRowClick={() => router.push('/shops')}
                emptyState={
                  <EmptyState
                    icon={<IconSparkle size={26} />}
                    title="No shops yet"
                    description="Create your first tenant to see it here — you'll manage its users, subscription and shop-type flow from one place."
                    action={
                      <CTAButton
                        variant="primary"
                        icon={<IconPlus size={16} />}
                        onClick={() => router.push('/shops')}
                      >
                        Create your first shop
                      </CTAButton>
                    }
                  />
                }
              />
            </Box>
          </Box>
        </>
      ) : null}
    </PageShell>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  accent: 'brand' | 'gold';
}

function QuickAction({ icon, title, description, cta, onClick, accent }: QuickActionProps) {
  // Gold CTA uses gold.800 so the arrow-text stays legible on white; icon tile stays soft.
  const tokens =
    accent === 'gold'
      ? { bg: 'flow.retail.bg', fg: 'gold.800', border: 'gold.300', tile: 'gold.600' }
      : { bg: 'brand.subtle', fg: 'brand.emphasized', border: 'brand.muted', tile: 'brand.emphasized' };

  return (
    <Box
      as="button"
      textAlign="left"
      onClick={onClick}
      bg="app.canvas"
      borderWidth="1px"
      borderColor="app.border"
      borderRadius="lg"
      p={{ base: 4, md: 5 }}
      shadow="e2"
      transition="all 0.2s ease"
      _hover={{ shadow: 'e8', transform: 'translateY(-2px)', borderColor: tokens.border }}
      _active={{ transform: 'translateY(0)' }}
      cursor="pointer"
    >
      <HStack align="flex-start" gap={4}>
        <Flex
          align="center"
          justify="center"
          boxSize={11}
          borderRadius="md"
          bg={tokens.bg}
          color={tokens.tile}
          flexShrink={0}
        >
          {icon}
        </Flex>
        <Stack gap={1} flex="1">
          <Text fontWeight="700" color="app.text" fontSize="md">
            {title}
          </Text>
          <Text fontSize="sm" color="app.subtle" lineHeight={1.55}>
            {description}
          </Text>
          <HStack gap={1} mt={2} color={tokens.fg} fontWeight="700" fontSize="sm">
            <Text>{cta}</Text>
            <IconChevronRight size={16} />
          </HStack>
        </Stack>
      </HStack>
    </Box>
  );
}
