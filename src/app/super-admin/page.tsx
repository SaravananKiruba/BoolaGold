'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  Badge,
  Button,
} from '@chakra-ui/react';

interface DashboardStats {
  totalShops: number;
  activeShops: number;
  totalUsers: number;
  activeUsers: number;
  shops: Array<{
    id: string;
    name: string;
    isActive: boolean;
    _count: {
      users: number;
      customers: number;
      products: number;
      salesOrders: number;
    };
  }>;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/dashboard');
      
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Loading Super Admin Dashboard...</Text>
      </Container>
    );
  }

  if (error || !stats) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text color="red.500">Error: {error || 'Failed to load dashboard'}</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        {/* Header */}
        <Box mb={6}>
          <Heading size="lg" mb={2}>
            🎛️ Super Admin Dashboard
          </Heading>
          <Text color="gray.600">SaaS Provider - System Overview</Text>
        </Box>

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
          <Box p={6} bg="white" borderWidth="1px" borderRadius="lg" borderColor="gray.200">
            <Text fontSize="sm" color="gray.600" mb={2}>Total Shops</Text>
            <Text fontSize="3xl" fontWeight="bold" mb={1}>{stats.totalShops}</Text>
            <Text fontSize="sm" color="gray.500">{stats.activeShops} active</Text>
          </Box>

          <Box p={6} bg="white" borderWidth="1px" borderRadius="lg" borderColor="gray.200">
            <Text fontSize="sm" color="gray.600" mb={2}>Total Users</Text>
            <Text fontSize="3xl" fontWeight="bold" mb={1}>{stats.totalUsers}</Text>
            <Text fontSize="sm" color="gray.500">{stats.activeUsers} active</Text>
          </Box>

          <Box p={6} bg="white" borderWidth="1px" borderRadius="lg" borderColor="gray.200">
            <Text fontSize="sm" color="gray.600" mb={2}>Total Products</Text>
            <Text fontSize="3xl" fontWeight="bold" mb={1}>
              {stats.shops.reduce((sum, shop) => sum + shop._count.products, 0)}
            </Text>
            <Text fontSize="sm" color="gray.500">Across all shops</Text>
          </Box>

          <Box p={6} bg="white" borderWidth="1px" borderRadius="lg" borderColor="gray.200">
            <Text fontSize="sm" color="gray.600" mb={2}>Total Sales</Text>
            <Text fontSize="3xl" fontWeight="bold" mb={1}>
              {stats.shops.reduce((sum, shop) => sum + shop._count.salesOrders, 0)}
            </Text>
            <Text fontSize="sm" color="gray.500">All time</Text>
          </Box>
        </SimpleGrid>

        {/* Shops Overview */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md">Shops Overview</Heading>
            <Button colorScheme="blue" onClick={() => router.push('/shops')}>
              Manage Shops
            </Button>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {stats.shops.map((shop) => (
              <Box key={shop.id} p={6} bg="white" borderWidth="1px" borderRadius="lg" borderColor="gray.200">
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                  <Heading size="sm">{shop.name}</Heading>
                  <Badge colorScheme={shop.isActive ? 'green' : 'red'}>
                    {shop.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Box>

                <Box mb={4} fontSize="sm">
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Text color="gray.600">Users:</Text>
                    <Text fontWeight="bold">{shop._count.users}</Text>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Text color="gray.600">Customers:</Text>
                    <Text fontWeight="bold">{shop._count.customers}</Text>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Text color="gray.600">Products:</Text>
                    <Text fontWeight="bold">{shop._count.products}</Text>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Text color="gray.600">Sales:</Text>
                    <Text fontWeight="bold">{shop._count.salesOrders}</Text>
                  </Box>
                </Box>

                <Button size="sm" variant="outline" width="100%" onClick={() => router.push(`/shops`)}>
                  View Details
                </Button>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Box>
    </Container>
  );
}
