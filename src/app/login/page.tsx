'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useOptionalShopContext } from '@/components/providers/ShopProvider';

interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
    name: string;
    role: 'SUPER_ADMIN' | 'OWNER' | 'SALES' | 'ACCOUNTS';
    shopId: string | null;
    shopName: string | null;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const ctx = useOptionalShopContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });
      const data: LoginResponse = await res.json();

      if (!data.success || !data.user) {
        setError(data.message || 'Invalid username or password');
        setLoading(false);
        return;
      }

      // Refresh the shop context so Navigation + guards pick up the new role.
      await ctx?.refresh();

      const dest =
        data.user.role === 'SUPER_ADMIN'
          ? '/super-admin'
          : data.user.role === 'ACCOUNTS'
            ? '/transactions'
            : '/dashboard';
      router.push(dest);
      router.refresh();
    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      w="100%"
      direction={{ base: 'column', lg: 'row' }}
      bg="app.bg"
    >
      {/* Left / hero panel — collapses to slim banner on mobile */}
      <Flex
        flex={{ base: '0 0 auto', lg: '1' }}
        direction="column"
        justify={{ base: 'center', lg: 'space-between' }}
        p={{ base: 6, md: 10, lg: 14 }}
        color="white"
        bgGradient="linear(135deg, brand.500, brand.700)"
        position="relative"
        overflow="hidden"
        minH={{ base: '160px', lg: '100vh' }}
        _before={{
          content: '""',
          position: 'absolute',
          inset: 0,
          bgGradient: 'radial(circle at 20% 20%, rgba(236,183,97,0.25), transparent 55%)',
          pointerEvents: 'none',
        }}
      >
        <Box position="relative" zIndex={1}>
          <HStack gap={2} mb={{ base: 2, lg: 6 }}>
            <Text fontSize={{ base: '2rem', lg: '2.4rem' }} lineHeight={1}>💎</Text>
            <Heading
              size={{ base: 'lg', lg: '2xl' }}
              fontFamily="heading"
              letterSpacing="0.02em"
            >
              BoolaGold
            </Heading>
          </HStack>
          <Text
            fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
            color="whiteAlpha.900"
            maxW="lg"
            display={{ base: 'none', md: 'block' }}
          >
            Multi-tenant SaaS platform for jewelry stores. Retail (cash) and
            wholesale (metal-exchange) flows in one place.
          </Text>
        </Box>

        <Stack
          gap={4}
          position="relative"
          zIndex={1}
          display={{ base: 'none', lg: 'flex' }}
          mt="auto"
        >
          <Feature
            icon="🏪"
            title="Multi-shop management"
            body="One deployment serves many tenants — data isolated per shop."
          />
          <Feature
            icon="₹"
            title="Retail · cash-first"
            body="Invoices, EMI, GST — everything in INR with automated pricing."
          />
          <Feature
            icon="⚖"
            title="Wholesale · metal-first"
            body="Metal-in / metal-out ledger with reference ₹ values from live rates."
          />
        </Stack>

        <Text
          fontSize="xs"
          color="whiteAlpha.700"
          display={{ base: 'none', lg: 'block' }}
          mt={6}
          position="relative"
          zIndex={1}
        >
          © {new Date().getFullYear()} BoolaGold. All rights reserved.
        </Text>
      </Flex>

      {/* Right / form panel */}
      <Flex
        flex={{ base: '1', lg: '1' }}
        align="center"
        justify="center"
        p={{ base: 5, md: 8, lg: 12 }}
      >
        <Box
          w="100%"
          maxW={{ base: '100%', sm: '440px' }}
          bg="app.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="app.border"
          shadow="card"
          p={{ base: 6, md: 8 }}
        >
          <Stack gap={1} mb={6}>
            <Heading size={{ base: 'lg', md: 'xl' }} color="app.text">
              Sign in
            </Heading>
            <Text color="app.subtle" fontSize="sm">
              Enter your credentials to continue.
            </Text>
          </Stack>

          <form onSubmit={handleLogin}>
            <Stack gap={4}>
              <Stack gap={1.5}>
                <label htmlFor="username" style={{ display: 'block' }}>
                  <Text as="span" fontSize="sm" fontWeight="600" color="app.text">
                    Username
                  </Text>
                </label>
                <Input
                  id="username"
                  autoComplete="username"
                  size="lg"
                  placeholder="e.g. superadmin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  borderColor="app.border"
                  _focus={{
                    borderColor: 'brand.solid',
                    boxShadow: '0 0 0 3px var(--chakra-colors-brand-100)',
                  }}
                />
              </Stack>

              <Stack gap={1.5}>
                <Flex justify="space-between" align="baseline">
                  <label htmlFor="password" style={{ display: 'block' }}>
                    <Text as="span" fontSize="sm" fontWeight="600" color="app.text">
                      Password
                    </Text>
                  </label>
                </Flex>
                <Box position="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    size="lg"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    pr="3rem"
                    borderColor="app.border"
                    _focus={{
                      borderColor: 'brand.solid',
                      boxShadow: '0 0 0 3px var(--chakra-colors-brand-100)',
                    }}
                  />
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    size="sm"
                    variant="ghost"
                    position="absolute"
                    right="0.5rem"
                    top="50%"
                    transform="translateY(-50%)"
                    color="app.subtle"
                    _hover={{ bg: 'app.muted' }}
                  >
                    <Text fontSize="lg">{showPassword ? '🙈' : '👁️'}</Text>
                  </IconButton>
                </Box>
              </Stack>

              {error && (
                <Box
                  role="alert"
                  bg="red.50"
                  borderWidth="1px"
                  borderColor="red.200"
                  color="red.700"
                  borderRadius="md"
                  px={3}
                  py={2}
                  fontSize="sm"
                >
                  {error}
                </Box>
              )}

              <Button
                type="submit"
                size="lg"
                w="100%"
                bg="brand.solid"
                color="brand.contrast"
                _hover={{ bg: 'brand.600' }}
                _active={{ bg: 'brand.700' }}
                loading={loading}
                loadingText="Signing in…"
                fontWeight="600"
              >
                Sign in
              </Button>
            </Stack>
          </form>

          <Box
            mt={6}
            p={4}
            bg="brand.subtle"
            borderRadius="md"
            borderWidth="1px"
            borderColor="brand.muted"
          >
            <Text
              fontSize="xs"
              fontWeight="700"
              color="brand.emphasized"
              textTransform="uppercase"
              letterSpacing="0.08em"
              mb={1}
            >
              Platform administrator
            </Text>
            <Text fontSize="sm" color="app.text">
              Sign in with your <strong>Super Admin</strong> account to manage
              tenants, subscriptions and users.
            </Text>
            <Text fontSize="xs" color="app.subtle" mt={2}>
              Default seed user: <code>superadmin</code>. Change the password after first login.
            </Text>
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <HStack align="flex-start" gap={3}>
      <Flex
        align="center"
        justify="center"
        boxSize={10}
        borderRadius="md"
        bg="whiteAlpha.200"
        color="white"
        fontSize="lg"
        flexShrink={0}
      >
        {icon}
      </Flex>
      <Stack gap={0.5} flex="1">
        <Text fontWeight="600" color="white" fontSize="sm">
          {title}
        </Text>
        <Text fontSize="xs" color="whiteAlpha.800">
          {body}
        </Text>
      </Stack>
    </HStack>
  );
}
