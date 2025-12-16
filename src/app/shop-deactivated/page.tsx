'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Text,
  VStack,
  Button,
} from '@chakra-ui/react';
import { Alert } from '@/components/ui/alert';

export default function ShopDeactivatedPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to subscription page after 3 seconds
    const timer = setTimeout(() => {
      router.push('/subscription');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={6}>
        <Alert.Root
          status="error"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          minHeight="300px"
          borderRadius="lg"
        >
          <Alert.Indicator boxSize="40px" mr={0} />
          <Alert.Content>
            <Alert.Title mt={4} mb={1} fontSize="2xl">
              Shop Deactivated
            </Alert.Title>
            <Alert.Description maxWidth="lg" fontSize="lg">
              <VStack spacing={4} mt={4}>
                <Text>
                  Your shop has been deactivated. This could be due to trial expiry or AMC not renewed.
                </Text>
                <Text fontWeight="bold">
                  Please visit the subscription page to make payment and reactivate your shop.
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Redirecting to subscription page in 3 seconds...
                </Text>
              </VStack>
            </Alert.Description>
          </Alert.Content>
          <Button
            colorScheme="blue"
            mt={6}
            size="lg"
            onClick={() => router.push('/subscription')}
          >
            View Subscription Details
          </Button>
        </Alert.Root>
      </VStack>
    </Container>
  );
}
