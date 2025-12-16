'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Separator,
  SimpleGrid,
  Image,
} from '@chakra-ui/react';
import { Alert } from '@/components/ui/alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SubscriptionData {
  subscriptionType: 'TRIAL' | 'LIFETIME';
  trialStartDate?: string;
  trialEndDate?: string;
  lifetimeAmount?: number;
  lifetimePaidAt?: string;
  amcRenewalDate?: string;
  amcLastRenewalDate?: string;
  amcAmount: number;
  maxUsers: number;
  activeUserCount: number;
  isActive: boolean;
  deactivatedAt?: string;
  deactivationReason?: string;
  trialDaysRemaining?: number;
  amcDaysRemaining?: number;
  isTrialExpired: boolean;
  isAmcExpired: boolean;
  paymentInfo: {
    trialFee: number;
    lifetimeFee: number;
    amcFee: number;
    upiId: string;
    qrCodeUrl: string;
  };
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      
      // Get shop ID from session
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      
      if (!sessionData.success || !sessionData.data?.user?.shopId) {
        setError('Unable to fetch shop information');
        return;
      }

      const shopId = sessionData.data.user.shopId;
      
      const res = await fetch(`/api/shops/${shopId}/subscription`);
      const data = await res.json();

      if (data.success) {
        setSubscription(data.data);
      } else {
        setError(data.message || 'Failed to fetch subscription');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading subscription details..." />;
  }

  if (error || !subscription) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error || 'Failed to load subscription'}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      </Container>
    );
  }

  const getSubscriptionBadge = () => {
    if (subscription.subscriptionType === 'TRIAL') {
      if (subscription.isTrialExpired) {
        return <Badge colorScheme="red" fontSize="lg" p={2}>TRIAL EXPIRED</Badge>;
      }
      return <Badge colorScheme="blue" fontSize="lg" p={2}>TRIAL</Badge>;
    }
    return <Badge colorScheme="green" fontSize="lg" p={2}>LIFETIME</Badge>;
  };

  const getStatusBadge = () => {
    if (!subscription.isActive) {
      return <Badge colorScheme="red" fontSize="md" p={2}>DEACTIVATED</Badge>;
    }
    if (subscription.isAmcExpired) {
      return <Badge colorScheme="orange" fontSize="md" p={2}>AMC EXPIRED</Badge>;
    }
    return <Badge colorScheme="green" fontSize="md" p={2}>ACTIVE</Badge>;
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align="center">
            <Heading size="lg">Subscription Management</Heading>
            <HStack gap={3}>
              {getSubscriptionBadge()}
              {getStatusBadge()}
            </HStack>
          </HStack>
        </Box>

        {/* Deactivation Warning */}
        {!subscription.isActive && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Shop Deactivated</Alert.Title>
              <Alert.Description>
                {subscription.deactivationReason || 'Your shop has been deactivated.'}
                <br />
                {subscription.isTrialExpired && 'Please upgrade to Lifetime subscription to reactivate.'}
                {subscription.isAmcExpired && 'Please renew AMC to reactivate.'}
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {/* Trial Warning */}
        {subscription.subscriptionType === 'TRIAL' && subscription.trialDaysRemaining !== null && subscription.trialDaysRemaining !== undefined && subscription.trialDaysRemaining > 0 && subscription.trialDaysRemaining <= 3 && (
          <Alert.Root status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Trial Ending Soon</Alert.Title>
              <Alert.Description>
                Your trial expires in {subscription.trialDaysRemaining} days. Upgrade to Lifetime to continue using all features.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {/* AMC Warning */}
        {subscription.amcDaysRemaining !== null && subscription.amcDaysRemaining !== undefined && subscription.amcDaysRemaining > 0 && subscription.amcDaysRemaining <= 30 && (
          <Alert.Root status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>AMC Renewal Due</Alert.Title>
              <Alert.Description>
                Your AMC expires in {subscription.amcDaysRemaining} days. Renew AMC to maintain service.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
          {/* Subscription Details */}
          <Box borderWidth="1px" borderRadius="lg" p={6} bg="white" shadow="sm">
            <Heading size="md" mb={4}>Subscription Details</Heading>
            <VStack align="stretch" gap={4}>
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="gray.500">Current Plan</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {subscription.subscriptionType === 'TRIAL' ? 'Trial Period' : 'Lifetime Subscription'}
                </Text>
              </Box>

              {subscription.subscriptionType === 'TRIAL' && (
                <>
                  <Separator />
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Trial Period</Text>
                    <Text>
                      {subscription.trialStartDate && new Date(subscription.trialStartDate).toLocaleDateString()} - {subscription.trialEndDate && new Date(subscription.trialEndDate).toLocaleDateString()}
                    </Text>
                    {subscription.trialDaysRemaining !== null && subscription.trialDaysRemaining !== undefined && (
                      <Text fontSize="lg" fontWeight="bold" color={subscription.trialDaysRemaining < 0 ? 'red.500' : 'blue.500'}>
                        {subscription.trialDaysRemaining < 0 ? 'Expired' : `${subscription.trialDaysRemaining} days remaining`}
                      </Text>
                    )}
                  </Box>
                </>
              )}

              {subscription.subscriptionType === 'LIFETIME' && subscription.lifetimePaidAt && (
                <>
                  <Separator />
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.500">Activated On</Text>
                    <Text>{new Date(subscription.lifetimePaidAt).toLocaleDateString()}</Text>
                  </Box>
                  {subscription.lifetimeAmount && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="gray.500">Paid Amount</Text>
                      <Text fontSize="xl" fontWeight="bold">₹{subscription.lifetimeAmount.toLocaleString()}</Text>
                    </Box>
                  )}
                </>
              )}

              <Separator />
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="gray.500">AMC Status</Text>
                {subscription.amcRenewalDate ? (
                  <>
                    <Text>Renewal Due: {new Date(subscription.amcRenewalDate).toLocaleDateString()}</Text>
                    {subscription.amcDaysRemaining !== null && subscription.amcDaysRemaining !== undefined && (
                      <Text fontSize="lg" fontWeight="bold" color={subscription.amcDaysRemaining < 0 ? 'red.500' : subscription.amcDaysRemaining <= 30 ? 'orange.500' : 'green.500'}>
                        {subscription.amcDaysRemaining < 0 ? 'Expired' : `${subscription.amcDaysRemaining} days remaining`}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text color="gray.500">Not applicable (upgrade to Lifetime first)</Text>
                )}
              </Box>

              <Separator />
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="gray.500">User Limit</Text>
                <Text fontSize="lg">
                  {subscription.activeUserCount} / {subscription.maxUsers} users active
                </Text>
              </Box>
            </VStack>
          </Box>

          {/* Payment Information */}
          <Box borderWidth="1px" borderRadius="lg" p={6} bg="white" shadow="sm">
            <Heading size="md" mb={4}>Payment Information</Heading>
            <VStack align="stretch" gap={6}>
              {/* Pricing */}
              <Box>
                <Text fontWeight="bold" mb={3}>Subscription Fees:</Text>
                <VStack align="stretch" gap={2}>
                  <HStack justify="space-between">
                    <Text>Trial Period (7 days):</Text>
                    <Text fontWeight="bold">₹{subscription.paymentInfo.trialFee.toLocaleString()}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Lifetime Subscription:</Text>
                    <Text fontWeight="bold">₹{subscription.paymentInfo.lifetimeFee.toLocaleString()}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>AMC Renewal (Annual):</Text>
                    <Text fontWeight="bold">₹{subscription.paymentInfo.amcFee.toLocaleString()}</Text>
                  </HStack>
                </VStack>
              </Box>

              <Separator />

              {/* Payment Instructions */}
              <Box>
                <Text fontWeight="bold" mb={3}>Payment Instructions:</Text>
                <VStack align="stretch" gap={3}>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>1. Make payment via UPI:</Text>
                    <HStack justify="space-between" bg="gray.50" p={3} borderRadius="md">
                      <Text fontWeight="bold" fontSize="lg">{subscription.paymentInfo.upiId}</Text>
                    </HStack>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>2. Or scan QR code:</Text>
                    <Box bg="gray.50" p={4} borderRadius="md" textAlign="center">
                      <Image 
                        src={subscription.paymentInfo.qrCodeUrl} 
                        alt="Payment QR Code" 
                        maxW="200px" 
                        mx="auto"
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      3. After payment, take a screenshot and share with Super Admin for verification.
                    </Text>
                  </Box>

                  <Alert.Root status="info">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Text fontSize="sm">
                        Your subscription will be activated by Super Admin after payment verification. Please allow 24-48 hours for processing.
                      </Text>
                    </Alert.Content>
                  </Alert.Root>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </SimpleGrid>
      </VStack>
    </Container>
  );
}
