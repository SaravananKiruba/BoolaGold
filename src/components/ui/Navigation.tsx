'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  useOptionalShopContext,
  type UserRole,
} from '@/components/providers/ShopProvider';
import { ShopTypeBadge } from '@/components/ui/ShopTypeBadge';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  desc: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const OWNER_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: '📊', desc: 'Metrics' }],
  },
  {
    title: 'Sales',
    items: [
      { href: '/customers',    label: 'Customers',    icon: '👥', desc: 'Manage' },
      { href: '/sales-orders', label: 'Sales',        icon: '🛒', desc: 'Orders' },
      { href: '/transactions', label: 'Transactions', icon: '💳', desc: 'Ledger' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { href: '/products', label: 'Products', icon: '💍', desc: 'Catalog' },
      { href: '/stock',    label: 'Stock',    icon: '📦', desc: 'Items' },
    ],
  },
  {
    title: 'Procurement',
    items: [
      { href: '/suppliers',       label: 'Suppliers', icon: '🏭', desc: 'Vendors' },
      { href: '/purchase-orders', label: 'Purchase',  icon: '📋', desc: 'Orders' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { href: '/rate-master', label: 'Rates',   icon: '💰', desc: 'Pricing' },
      { href: '/reports',     label: 'Reports', icon: '📈', desc: 'Analytics' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { href: '/users',        label: 'Users',        icon: '👤', desc: 'Shop users' },
      { href: '/subscription', label: 'Subscription', icon: '💎', desc: 'Billing' },
    ],
  },
];

const SALES_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: '📊', desc: 'Metrics' }],
  },
  {
    title: 'Sales',
    items: [
      { href: '/customers',    label: 'Customers', icon: '👥', desc: 'Manage' },
      { href: '/sales-orders', label: 'Sales',     icon: '🛒', desc: 'Orders' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { href: '/products', label: 'Products', icon: '💍', desc: 'Catalog' },
      { href: '/stock',    label: 'Stock',    icon: '📦', desc: 'Items' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { href: '/rate-master', label: 'Rates',   icon: '💰', desc: 'View pricing' },
      { href: '/reports',     label: 'Reports', icon: '📈', desc: 'Sales' },
    ],
  },
];

const ACCOUNTS_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: '📊', desc: 'Metrics' }],
  },
  {
    title: 'Financial',
    items: [
      { href: '/transactions', label: 'Transactions', icon: '💳', desc: 'Ledger' },
    ],
  },
  {
    title: 'Procurement',
    items: [
      { href: '/suppliers',       label: 'Suppliers', icon: '🏭', desc: 'Vendors' },
      { href: '/purchase-orders', label: 'Purchase',  icon: '📋', desc: 'Orders' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { href: '/rate-master', label: 'Rates',   icon: '💰', desc: 'Pricing' },
      { href: '/reports',     label: 'Reports', icon: '📈', desc: 'Finance' },
    ],
  },
];

const SUPER_ADMIN_SECTIONS: NavSection[] = [
  {
    title: 'System',
    items: [
      { href: '/super-admin', label: 'Dashboard', icon: '🎛️', desc: 'System overview' },
      { href: '/shops',       label: 'Shops',     icon: '🏪', desc: 'All shops' },
      { href: '/users',       label: 'Users',     icon: '👥', desc: 'All users' },
    ],
  },
  {
    title: 'Business',
    items: [
      {
        href: '/super-admin/subscriptions',
        label: 'Subscriptions',
        icon: '📊',
        desc: 'Billing & renewals',
      },
    ],
  },
];

function sectionsFor(role: UserRole | undefined | null): NavSection[] {
  switch (role) {
    case 'SUPER_ADMIN': return SUPER_ADMIN_SECTIONS;
    case 'OWNER':       return OWNER_SECTIONS;
    case 'SALES':       return SALES_SECTIONS;
    case 'ACCOUNTS':    return ACCOUNTS_SECTIONS;
    default:            return [];
  }
}

/**
 * Hide entire nav on these routes (auth / block screens).
 */
const HIDDEN_ROUTES = ['/login', '/shop-deactivated'];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const ctx = useOptionalShopContext();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const role = ctx?.user?.role;
  const sections = useMemo(() => sectionsFor(role), [role]);

  if (HIDDEN_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return null;
  }

  // If no user is loaded yet, render a slim header to avoid layout shift.
  const homeHref = role === 'SUPER_ADMIN' ? '/super-admin' : '/dashboard';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/login');
    router.refresh();
  };

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <Box
        as="nav"
        position="sticky"
        top={0}
        zIndex="banner"
        bg="brand.500"
        bgGradient="linear(135deg, brand.500, brand.600)"
        borderBottomWidth="3px"
        borderBottomColor="gold.400"
        shadow="header"
        color="white"
      >
        <Flex
          px={{ base: 3, md: 5, lg: 8 }}
          py={{ base: 2.5, md: 3 }}
          align="center"
          gap={4}
          maxW="8xl"
          mx="auto"
        >
          {/* Logo */}
          <Link href={homeHref} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <HStack gap={2}>
              <Text fontSize={{ base: '1.6rem', md: '1.9rem' }} lineHeight={1}>💎</Text>
              <Text
                fontFamily="heading"
                fontWeight="700"
                fontSize={{ base: 'lg', md: 'xl' }}
                color="white"
                letterSpacing="0.02em"
                display={{ base: 'none', sm: 'inline' }}
              >
                BoolaGold
              </Text>
            </HStack>
          </Link>

          {/* Shop / Role indicator */}
          <HStack gap={2} flexShrink={0} display={{ base: 'none', md: 'flex' }}>
            {ctx?.shop && <ShopTypeBadge type={ctx.shop.shopBusinessType} />}
            {role && (
              <Badge
                variant="subtle"
                colorPalette="whiteAlpha"
                bg="whiteAlpha.300"
                color="white"
                textTransform="uppercase"
                letterSpacing="0.06em"
                fontWeight="600"
              >
                {role.replace('_', ' ')}
              </Badge>
            )}
          </HStack>

          {/* Desktop links */}
          <HStack
            gap={1}
            flex="1"
            overflowX="auto"
            display={{ base: 'none', lg: 'flex' }}
            css={{ scrollbarWidth: 'none', '::-webkit-scrollbar': { display: 'none' } }}
          >
            {sections.flatMap((section, sidx) =>
              section.items.map((item, iidx) => {
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={`${sidx}-${iidx}-${item.href}`}
                    href={item.href}
                    style={{ textDecoration: 'none' }}
                  >
                    <Box
                      px={3}
                      py={2}
                      borderRadius="md"
                      fontSize="sm"
                      fontWeight={active ? '600' : '500'}
                      color={active ? 'brand.700' : 'whiteAlpha.900'}
                      bg={active ? 'white' : 'whiteAlpha.100'}
                      borderWidth={active ? '2px' : '2px'}
                      borderColor={active ? 'gold.400' : 'transparent'}
                      whiteSpace="nowrap"
                      transition="all 0.15s ease"
                      _hover={!active ? { bg: 'whiteAlpha.200', transform: 'translateY(-1px)' } : undefined}
                      title={`${section.title} · ${item.desc}`}
                    >
                      <HStack gap={1.5}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </HStack>
                    </Box>
                  </Link>
                );
              }),
            )}
          </HStack>

          {/* Spacer for tablet layout */}
          <Box flex="1" display={{ base: 'block', lg: 'none' }} />

          {/* User + logout (desktop) */}
          <HStack gap={2} display={{ base: 'none', md: 'flex' }} flexShrink={0}>
            {ctx?.user && (
              <Text
                fontSize="sm"
                color="whiteAlpha.900"
                fontWeight="500"
                maxW="180px"
                truncate
              >
                {ctx.user.name || ctx.user.username}
              </Text>
            )}
            <Button
              size="sm"
              variant="outline"
              color="white"
              borderColor="whiteAlpha.500"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </HStack>

          {/* Mobile / tablet trigger */}
          <IconButton
            aria-label="Open navigation"
            variant="ghost"
            color="white"
            size="md"
            display={{ base: 'inline-flex', lg: 'none' }}
            _hover={{ bg: 'whiteAlpha.200' }}
            onClick={() => setDrawerOpen(true)}
          >
            <Text fontSize="1.6rem" lineHeight={1}>☰</Text>
          </IconButton>
        </Flex>
      </Box>

      {/* Mobile / tablet drawer */}
      {drawerOpen && (
        <Portal>
          <Box
            position="fixed"
            inset={0}
            bg="blackAlpha.600"
            zIndex="overlay"
            onClick={() => setDrawerOpen(false)}
          />
          <Box
            position="fixed"
            top={0}
            right={0}
            bottom={0}
            width={{ base: '85vw', sm: '360px' }}
            maxW="400px"
            bg="app.surface"
            zIndex="modal"
            shadow="cardHover"
            overflowY="auto"
          >
            <Flex
              align="center"
              justify="space-between"
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor="app.border"
              bg="brand.500"
              color="white"
            >
              <HStack gap={2}>
                <Text fontSize="1.4rem" lineHeight={1}>💎</Text>
                <Text fontFamily="heading" fontWeight="700" fontSize="lg">
                  BoolaGold
                </Text>
              </HStack>
              <IconButton
                aria-label="Close navigation"
                size="sm"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setDrawerOpen(false)}
              >
                <Text fontSize="1.2rem" lineHeight={1}>✕</Text>
              </IconButton>
            </Flex>

            <Stack gap={4} p={4}>
              {ctx?.shop && (
                <HStack gap={2} wrap="wrap">
                  <ShopTypeBadge type={ctx.shop.shopBusinessType} />
                  {role && (
                    <Badge variant="subtle" colorPalette="purple">
                      {role.replace('_', ' ')}
                    </Badge>
                  )}
                </HStack>
              )}
              {ctx?.user && (
                <Box>
                  <Text fontSize="xs" color="app.subtle" textTransform="uppercase">
                    Signed in as
                  </Text>
                  <Text fontWeight="600" color="app.text">
                    {ctx.user.name || ctx.user.username}
                  </Text>
                  {ctx.shop?.name && (
                    <Text fontSize="sm" color="app.subtle">
                      {ctx.shop.name}
                    </Text>
                  )}
                </Box>
              )}

              {sections.map((section) => (
                <Box key={section.title}>
                  <Text
                    fontSize="xs"
                    color="app.subtle"
                    textTransform="uppercase"
                    letterSpacing="0.06em"
                    fontWeight="700"
                    mb={2}
                  >
                    {section.title}
                  </Text>
                  <Stack gap={1}>
                    {section.items.map((item) => {
                      const active = isItemActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          style={{ textDecoration: 'none' }}
                        >
                          <Flex
                            align="center"
                            gap={3}
                            px={3}
                            py={2.5}
                            borderRadius="md"
                            bg={active ? 'brand.subtle' : 'transparent'}
                            color={active ? 'brand.fg' : 'app.text'}
                            borderLeftWidth="4px"
                            borderLeftColor={active ? 'brand.solid' : 'transparent'}
                            _hover={{ bg: 'app.muted' }}
                          >
                            <Text fontSize="1.3rem" lineHeight={1}>
                              {item.icon}
                            </Text>
                            <Stack gap={0} flex="1" minW={0}>
                              <Text
                                fontWeight={active ? '600' : '500'}
                                fontSize="sm"
                                color="inherit"
                              >
                                {item.label}
                              </Text>
                              <Text fontSize="xs" color="app.subtle" truncate>
                                {item.desc}
                              </Text>
                            </Stack>
                          </Flex>
                        </Link>
                      );
                    })}
                  </Stack>
                </Box>
              ))}

              <Button
                variant="outline"
                colorPalette="red"
                onClick={handleLogout}
                mt={2}
              >
                Logout
              </Button>
            </Stack>
          </Box>
        </Portal>
      )}
    </>
  );
}
