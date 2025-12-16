'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Input,
  Textarea,
  SimpleGrid,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogTitle,
  NativeSelectRoot,
  NativeSelectField,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableColumnHeader,
  TableCell,
} from '@chakra-ui/react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/utils/toast';

interface Shop {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  subscriptionType: 'TRIAL' | 'LIFETIME';
  trialStartDate?: string;
  trialEndDate?: string;
  lifetimeAmount?: number;
  lifetimePaidAt?: string;
  amcRenewalDate?: string;
  amcLastRenewalDate?: string;
  amcAmount: number;
  maxUsers: number;
  currentUserCount: number;
  isActive: boolean;
  deactivatedAt?: string;
  deactivationReason?: string;
  activeUserCount: number;
  trialDaysRemaining?: number;
  amcDaysRemaining?: number;
  isTrialExpired: boolean;
  isAmcExpired: boolean;
}

interface Stats {
  total: number;
  trial: number;
  lifetime: number;
  active: number;
  deactivated: number;
}

export default function SuperAdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [action, setAction] = useState<string>('');
  const [lifetimeAmount, setLifetimeAmount] = useState('65000');
  const [extendDays, setExtendDays] = useState('7');
  const [amcDate, setAmcDate] = useState('');
  const [deactivateReason, setDeactivateReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  useEffect(() => {
    fetchShops();
  }, [filter, search]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.append('filter', filter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/super-admin/subscriptions?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setShops(data.data.shops);
        setStats(data.data.stats);
      } else {
        toast.error(data.message || 'Failed to fetch shops');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedShop) return;

    try {
      setActionLoading(true);
      
      const body: any = {
        action,
        shopId: selectedShop.id,
        data: {},
      };

      if (action === 'convertToLifetime') {
        body.data.lifetimeAmount = parseFloat(lifetimeAmount);
      } else if (action === 'extendTrial') {
        body.data.days = parseInt(extendDays);
      } else if (action === 'updateAMC') {
        body.data.amcRenewalDate = amcDate;
      } else if (action === 'deactivate') {
        body.data.reason = deactivateReason;
      }

      const res = await fetch('/api/super-admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Action completed successfully');
        onClose();
        fetchShops();
      } else {
        toast.error(data.message || 'Action failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (shop: Shop, actionType: string) => {
    setSelectedShop(shop);
    setAction(actionType);
    
    // Reset form values
    setLifetimeAmount('65000');
    setExtendDays('7');
    setAmcDate('');
    setDeactivateReason('');
    
    // Set default AMC date to 1 year from now
    if (actionType === 'updateAMC') {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      setAmcDate(futureDate.toISOString().split('T')[0]);
    }
    
    onOpen();
  };

  const getSubscriptionBadge = (shop: Shop) => {
    if (shop.subscriptionType === 'TRIAL') {
      if (shop.isTrialExpired) {
        return <Badge colorScheme="red">TRIAL EXPIRED</Badge>;
      }
      return <Badge colorScheme="blue">TRIAL</Badge>;
    }
    return <Badge colorScheme="green">LIFETIME</Badge>;
  };

  const getStatusBadge = (shop: Shop) => {
    if (!shop.isActive) {
      return <Badge colorScheme="red">DEACTIVATED</Badge>;
    }
    if (shop.isAmcExpired) {
      return <Badge colorScheme="orange">AMC EXPIRED</Badge>;
    }
    return <Badge colorScheme="green">ACTIVE</Badge>;
  };

  if (loading) {
    return <LoadingSpinner text="Loading shops..." />;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Subscription Management</Heading>
        </HStack>

        {/* Stats */}
        {stats && (
          <SimpleGrid columns={{ base: 2, md: 5 }} gap={4}>
            <Box p={4} borderWidth="1px" borderRadius="lg" shadow="sm">
              <VStack align="stretch" gap={1}>
                <Text fontSize="sm" color="gray.600">Total Shops</Text>
                <Text fontSize="2xl" fontWeight="bold">{stats.total}</Text>
              </VStack>
            </Box>
            <Box p={4} borderWidth="1px" borderRadius="lg" shadow="sm">
              <VStack align="stretch" gap={1}>
                <Text fontSize="sm" color="gray.600">Trial</Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">{stats.trial}</Text>
              </VStack>
            </Box>
            <Box p={4} borderWidth="1px" borderRadius="lg" shadow="sm">
              <VStack align="stretch" gap={1}>
                <Text fontSize="sm" color="gray.600">Lifetime</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">{stats.lifetime}</Text>
              </VStack>
            </Box>
            <Box p={4} borderWidth="1px" borderRadius="lg" shadow="sm">
              <VStack align="stretch" gap={1}>
                <Text fontSize="sm" color="gray.600">Active</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">{stats.active}</Text>
              </VStack>
            </Box>
            <Box p={4} borderWidth="1px" borderRadius="lg" shadow="sm">
              <VStack align="stretch" gap={1}>
                <Text fontSize="sm" color="gray.600">Deactivated</Text>
                <Text fontSize="2xl" fontWeight="bold" color="red.500">{stats.deactivated}</Text>
              </VStack>
            </Box>
          </SimpleGrid>
        )}

        {/* Filters */}
        <HStack gap={4}>
          <NativeSelectRoot size="sm" maxW="200px">
            <NativeSelectField value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">All Shops</option>
              <option value="TRIAL">Trial</option>
              <option value="LIFETIME">Lifetime</option>
            </NativeSelectField>
          </NativeSelectRoot>
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </HStack>

        {/* Shops Table */}
        <Box overflowX="auto">
          <TableRoot variant="line">
            <TableHeader>
              <TableRow>
                <TableColumnHeader>Shop Name</TableColumnHeader>
                <TableColumnHeader>Contact</TableColumnHeader>
                <TableColumnHeader>Subscription</TableColumnHeader>
                <TableColumnHeader>Status</TableColumnHeader>
                <TableColumnHeader>Trial/AMC</TableColumnHeader>
                <TableColumnHeader>Users</TableColumnHeader>
                <TableColumnHeader>Actions</TableColumnHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} textAlign="center" py={8}>
                    <Text color="gray.500">No shops found</Text>
                  </TableCell>
                </TableRow>
              ) : (
                shops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell>
                      <VStack align="start" gap={0}>
                        <Text fontWeight="bold">{shop.name}</Text>
                        <Text fontSize="sm" color="gray.500">{shop.city}</Text>
                      </VStack>
                    </TableCell>
                    <TableCell>
                      <VStack align="start" gap={0}>
                        <Text fontSize="sm">{shop.email}</Text>
                        <Text fontSize="sm" color="gray.500">{shop.phone}</Text>
                      </VStack>
                    </TableCell>
                    <TableCell>
                      <VStack align="start" gap={1}>
                        {getSubscriptionBadge(shop)}
                        {shop.subscriptionType === 'LIFETIME' && shop.lifetimeAmount && (
                          <Text fontSize="xs" color="gray.500">₹{shop.lifetimeAmount.toLocaleString()}</Text>
                        )}
                      </VStack>
                    </TableCell>
                    <TableCell>{getStatusBadge(shop)}</TableCell>
                    <TableCell>
                      <VStack align="start" gap={1}>
                        {shop.trialDaysRemaining !== null && shop.trialDaysRemaining !== undefined && (
                          <Text fontSize="sm" color={shop.trialDaysRemaining < 0 ? 'red.500' : 'blue.500'}>
                            Trial: {shop.trialDaysRemaining < 0 ? 'Expired' : `${shop.trialDaysRemaining}d`}
                          </Text>
                        )}
                        {shop.amcDaysRemaining !== null && shop.amcDaysRemaining !== undefined && (
                          <Text fontSize="sm" color={shop.amcDaysRemaining < 0 ? 'red.500' : shop.amcDaysRemaining <= 30 ? 'orange.500' : 'green.500'}>
                            AMC: {shop.amcDaysRemaining < 0 ? 'Expired' : `${shop.amcDaysRemaining}d`}
                          </Text>
                        )}
                      </VStack>
                    </TableCell>
                    <TableCell>
                      <Text fontSize="sm">{shop.activeUserCount}/{shop.maxUsers}</Text>
                    </TableCell>
                    <TableCell>
                      <VStack align="start" gap={1}>
                        {shop.subscriptionType === 'TRIAL' && (
                          <Button
                            size="xs"
                            colorScheme="green"
                            onClick={() => openActionModal(shop, 'convertToLifetime')}
                          >
                            Convert to Lifetime
                          </Button>
                        )}
                        {shop.subscriptionType === 'TRIAL' && (
                          <Button
                            size="xs"
                            colorScheme="blue"
                            onClick={() => openActionModal(shop, 'extendTrial')}
                          >
                            Extend Trial
                          </Button>
                        )}
                        {shop.subscriptionType === 'LIFETIME' && (
                          <Button
                            size="xs"
                            colorScheme="purple"
                            onClick={() => openActionModal(shop, 'updateAMC')}
                          >
                            Update AMC
                          </Button>
                        )}
                        {shop.isActive ? (
                          <Button
                            size="xs"
                            colorScheme="red"
                            onClick={() => openActionModal(shop, 'deactivate')}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            colorScheme="green"
                            onClick={() => openActionModal(shop, 'reactivate')}
                          >
                            Reactivate
                          </Button>
                        )}
                      </VStack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableRoot>
        </Box>
      </VStack>

      {/* Action Modal */}
      <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="md">
        <DialogContent>
          <DialogCloseTrigger />
          <DialogHeader>
            <DialogTitle>
              {action === 'convertToLifetime' && 'Convert to Lifetime'}
              {action === 'extendTrial' && 'Extend Trial Period'}
              {action === 'updateAMC' && 'Update AMC Renewal Date'}
              {action === 'deactivate' && 'Deactivate Shop'}
              {action === 'reactivate' && 'Reactivate Shop'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <Text fontSize="sm">
                Shop: <strong>{selectedShop?.name}</strong>
              </Text>

              {action === 'convertToLifetime' && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Lifetime Amount (with discount)</Text>
                  <Input
                    type="number"
                    value={lifetimeAmount}
                    onChange={(e) => setLifetimeAmount(e.target.value)}
                    min={0}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Standard: ₹65,000. Enter discounted amount if applicable.
                  </Text>
                </Box>
              )}

              {action === 'extendTrial' && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Extend by (days)</Text>
                  <Input
                    type="number"
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    min={1}
                  />
                </Box>
              )}

              {action === 'updateAMC' && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>AMC Renewal Date</Text>
                  <Input
                    type="date"
                    value={amcDate}
                    onChange={(e) => setAmcDate(e.target.value)}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Set the next AMC renewal date. Shop will be deactivated if not renewed by this date.
                  </Text>
                </Box>
              )}

              {action === 'deactivate' && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Deactivation Reason</Text>
                  <Textarea
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    placeholder="Enter reason for deactivation..."
                  />
                </Box>
              )}

              {action === 'reactivate' && (
                <Text>
                  Are you sure you want to reactivate <strong>{selectedShop?.name}</strong>?
                </Text>
              )}
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme={action === 'deactivate' ? 'red' : 'green'}
              onClick={handleAction}
              loading={actionLoading}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Container>
  );
}
