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
import {
  IconArrowRight,
  IconCoin,
  IconDiamond,
  IconEye,
  IconEyeOff,
  IconLock,
  IconScale,
  IconShieldCheck,
  IconStore,
  IconUser,
} from '@/components/ui/icons';

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
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data: LoginResponse = await res.json();
      if (!data.success || !data.user) {
        setError(data.message || 'Invalid username or password.');
        setLoading(false);
        return;
      }
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
      setError('We couldn’t reach the server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" w="100%" direction={{ base: 'column', lg: 'row' }} bg="app.bg">
      {/* ================= Brand / Hero panel ================= */}
      <Flex
        className="brand-mesh"
        flex={{ base: '0 0 auto', lg: '1 1 55%' }}
        direction="column"
        justify="space-between"
        p={{ base: 6, md: 10, lg: 14 }}
        minH={{ base: '220px', md: '280px', lg: '100vh' }}
      >
        <HStack gap={3} className="enter-up">
          <Flex
            align="center"
            justify="center"
            boxSize={11}
            borderRadius="lg"
            bg="whiteAlpha.200"
            borderWidth="1px"
            borderColor="whiteAlpha.300"
            color="gold.300"
          >
            <IconDiamond size={22} />
          </Flex>
          <Stack gap={0}>
            <Heading
              size={{ base: 'md', md: 'lg' }}
              fontFamily="heading"
              letterSpacing="0.01em"
              color="white"
              lineHeight={1}
            >
              BoolaGold
            </Heading>
            <Text fontSize="xs" color="whiteAlpha.700" letterSpacing="0.14em" textTransform="uppercase">
              Jewelry SaaS · Platform
            </Text>
          </Stack>
        </HStack>

        <Stack
          gap={{ base: 4, lg: 8 }}
          maxW="lg"
          display={{ base: 'none', md: 'flex' }}
          mt={{ md: 6, lg: 0 }}
          className="enter-up"
        >
          <Stack gap={3}>
            <Heading
              size={{ base: 'xl', lg: '2xl' }}
              fontFamily="heading"
              color="white"
              lineHeight={1.1}
              letterSpacing="-0.01em"
            >
              One platform. <Text as="span" color="gold.300">Every jewelry shop.</Text>
            </Heading>
            <Text color="whiteAlpha.900" fontSize={{ base: 'sm', lg: 'md' }} maxW="md">
              Manage many tenants from a single console. Retail runs on cash and INR.
              Wholesale runs on metal weight. Both live side-by-side, isolated per shop.
            </Text>
          </Stack>

          <Stack gap={3}>
            <FeatureTile
              icon={<IconStore size={20} />}
              title="Multi-tenant management"
              body="Provision shops, users, subscriptions and AMC in minutes."
            />
            <FeatureTile
              icon={<IconCoin size={20} />}
              accent="gold"
              title="Retail · cash-first"
              body="Automated pricing, GST invoices, EMI, all denominated in ₹."
            />
            <FeatureTile
              icon={<IconScale size={20} />}
              accent="silver"
              title="Wholesale · metal-first"
              body="Metal-in / metal-out ledger with reference ₹ from live rates."
            />
          </Stack>
        </Stack>

        <HStack
          gap={2}
          color="whiteAlpha.700"
          fontSize="xs"
          display={{ base: 'none', lg: 'flex' }}
          className="enter-up"
        >
          <IconShieldCheck size={14} />
          <Text>Bank-grade JWT auth · per-shop data isolation · full audit trail</Text>
        </HStack>
      </Flex>

      {/* ================= Form panel ================= */}
      <Flex
        flex={{ base: '1', lg: '1 1 45%' }}
        align="center"
        justify="center"
        p={{ base: 5, md: 8, lg: 12 }}
      >
        <Box
          w="100%"
          maxW={{ base: '100%', sm: '440px' }}
          bg="app.canvas"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="app.border"
          shadow="e16"
          p={{ base: 6, md: 8 }}
          className="enter-up"
        >
          <Stack gap={1.5} mb={6}>
            <Text
              fontSize="xs"
              fontWeight="700"
              color="brand.fg"
              textTransform="uppercase"
              letterSpacing="0.12em"
            >
              Welcome back
            </Text>
            <Heading size={{ base: 'xl', md: '2xl' }} color="app.text" fontFamily="heading" letterSpacing="-0.01em">
              Sign in
            </Heading>
            <Text color="app.subtle" fontSize="sm">
              Enter your credentials to continue to the console.
            </Text>
          </Stack>

          <form onSubmit={handleLogin} noValidate>
            <Stack gap={4}>
              <Field
                id="username"
                label="Username"
                icon={<IconUser size={18} />}
              >
                <Input
                  id="username"
                  autoComplete="username"
                  size="lg"
                  h="46px"
                  pl="2.5rem"
                  placeholder="e.g. superadmin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  borderColor="app.border"
                  bg="app.canvas"
                  _hover={{ borderColor: 'app.borderStrong' }}
                  _focus={{
                    borderColor: 'brand.solid',
                    boxShadow: 'focus',
                  }}
                />
              </Field>

              <Field
                id="password"
                label="Password"
                icon={<IconLock size={18} />}
                trailing={
                  <IconButton
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    size="sm"
                    variant="ghost"
                    color="app.subtle"
                    _hover={{ bg: 'app.muted', color: 'app.text' }}
                    borderRadius="md"
                  >
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </IconButton>
                }
              >
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  size="lg"
                  h="46px"
                  pl="2.5rem"
                  pr="3rem"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  borderColor="app.border"
                  bg="app.canvas"
                  _hover={{ borderColor: 'app.borderStrong' }}
                  _focus={{
                    borderColor: 'brand.solid',
                    boxShadow: 'focus',
                  }}
                />
              </Field>

              {error && (
                <Flex
                  role="alert"
                  align="flex-start"
                  gap={2}
                  bg="red.50"
                  borderWidth="1px"
                  borderColor="red.200"
                  color="red.700"
                  borderRadius="md"
                  px={3}
                  py={2.5}
                  fontSize="sm"
                >
                  <Box mt="1px">⚠</Box>
                  <Text>{error}</Text>
                </Flex>
              )}

              <Button
                type="submit"
                size="lg"
                h="46px"
                w="100%"
                bg="brand.solid"
                color="brand.contrast"
                _hover={{ bg: 'brand.600' }}
                _active={{ bg: 'brand.700' }}
                loading={loading}
                loadingText="Signing in…"
                fontWeight="600"
                letterSpacing="0.01em"
                shadow="e4"
                borderRadius="md"
              >
                <HStack gap={2}>
                  <Text>Sign in</Text>
                  <IconArrowRight size={18} />
                </HStack>
              </Button>
            </Stack>
          </form>

          <Box mt={7} pt={5} borderTopWidth="1px" borderColor="app.border">
            <HStack gap={3} align="flex-start">
              <Flex
                align="center"
                justify="center"
                boxSize={9}
                borderRadius="md"
                bg="brand.subtle"
                color="brand.emphasized"
                flexShrink={0}
              >
                <IconShieldCheck size={18} />
              </Flex>
              <Stack gap={0.5}>
                <Text fontSize="sm" fontWeight="600" color="app.text">
                  Platform administrator
                </Text>
                <Text fontSize="xs" color="app.subtle" lineHeight={1.5}>
                  Sign in with your Super Admin account to manage tenants, users
                  and subscriptions. The seed user is{' '}
                  <Text as="span" fontFamily="mono" fontWeight="600" color="app.text">
                    superadmin
                  </Text>
                  . Change the password after first login.
                </Text>
              </Stack>
            </HStack>
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}

interface FieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

function Field({ id, label, icon, trailing, children }: FieldProps) {
  return (
    <Stack gap={1.5}>
      <label htmlFor={id} style={{ display: 'block' }}>
        <Text as="span" fontSize="sm" fontWeight="600" color="app.text">
          {label}
        </Text>
      </label>
      <Box position="relative">
        <Flex
          position="absolute"
          left="0.85rem"
          top="50%"
          transform="translateY(-50%)"
          color="app.subtle"
          pointerEvents="none"
          zIndex={1}
        >
          {icon}
        </Flex>
        {children}
        {trailing && (
          <Box position="absolute" right="0.4rem" top="50%" transform="translateY(-50%)" zIndex={2}>
            {trailing}
          </Box>
        )}
      </Box>
    </Stack>
  );
}

function FeatureTile({
  icon,
  title,
  body,
  accent = 'brand',
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent?: 'brand' | 'gold' | 'silver';
}) {
  const accentBg =
    accent === 'gold'
      ? 'rgba(236,183,97,0.18)'
      : accent === 'silver'
        ? 'rgba(201,212,222,0.18)'
        : 'rgba(255,255,255,0.10)';
  const accentColor =
    accent === 'gold' ? 'gold.200' : accent === 'silver' ? 'metal.100' : 'white';
  return (
    <HStack
      className="mica"
      align="flex-start"
      gap={3}
      p={{ base: 3, lg: 3.5 }}
    >
      <Flex
        align="center"
        justify="center"
        boxSize={9}
        borderRadius="md"
        bg={accentBg}
        color={accentColor}
        flexShrink={0}
      >
        {icon}
      </Flex>
      <Stack gap={0.5}>
        <Text fontWeight="600" color="white" fontSize="sm" letterSpacing="0.01em">
          {title}
        </Text>
        <Text fontSize="xs" color="whiteAlpha.800" lineHeight={1.5}>
          {body}
        </Text>
      </Stack>
    </HStack>
  );
}
