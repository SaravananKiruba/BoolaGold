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
import {
  IconClose,
  IconDiamond,
  IconLogout,
  IconMenu,
} from '@/components/ui/icons';

interface NavItem {
  href: string;
  label: string;
  desc: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const OWNER_SECTIONS: NavSection[] = [
  { title: 'Overview',    items: [{ href: '/dashboard', label: 'Dashboard', desc: 'Business metrics' }] },
  {
    title: 'Sales',
    items: [
      { href: '/customers',    label: 'Customers',    desc: 'Directory' },
      { href: '/sales-orders', label: 'Sales orders', desc: 'Invoices' },
      { href: '/transactions', label: 'Transactions', desc: 'Ledger' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { href: '/products', label: 'Products', desc: 'Catalog' },
      { href: '/stock',    label: 'Stock',    desc: 'Items in hand' },
    ],
  },
  {
    title: 'Procurement',
    items: [
      { href: '/suppliers',       label: 'Suppliers', desc: 'Vendors' },
      { href: '/purchase-orders', label: 'Purchase',  desc: 'Orders' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { href: '/rate-master', label: 'Rates',   desc: 'Live pricing' },
      { href: '/reports',     label: 'Reports', desc: 'Analytics' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { href: '/users',        label: 'Users',        desc: 'Shop users' },
      { href: '/subscription', label: 'Subscription', desc: 'Billing' },
    ],
  },
];

const SALES_SECTIONS: NavSection[] = [
  { title: 'Overview', items: [{ href: '/dashboard', label: 'Dashboard', desc: 'Sales metrics' }] },
  {
    title: 'Sales',
    items: [
      { href: '/customers',    label: 'Customers',    desc: 'Directory' },
      { href: '/sales-orders', label: 'Sales orders', desc: 'Invoices' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { href: '/products', label: 'Products', desc: 'Catalog' },
      { href: '/stock',    label: 'Stock',    desc: 'Items in hand' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { href: '/rate-master', label: 'Rates',   desc: 'View pricing' },
      { href: '/reports',     label: 'Reports', desc: 'Sales' },
    ],
  },
];

const ACCOUNTS_SECTIONS: NavSection[] = [
  { title: 'Overview', items: [{ href: '/dashboard', label: 'Dashboard', desc: 'Metrics' }] },
  {
    title: 'Financial',
    items: [{ href: '/transactions', label: 'Transactions', desc: 'Ledger' }],
  },
  {
    title: 'Procurement',
    items: [
      { href: '/suppliers',       label: 'Suppliers', desc: 'Vendors' },
      { href: '/purchase-orders', label: 'Purchase',  desc: 'Orders' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { href: '/rate-master', label: 'Rates',   desc: 'Pricing' },
      { href: '/reports',     label: 'Reports', desc: 'Finance' },
    ],
  },
];

const SUPER_ADMIN_SECTIONS: NavSection[] = [
  {
    title: 'System',
    items: [
      { href: '/super-admin', label: 'Dashboard', desc: 'System overview' },
      { href: '/shops',       label: 'Shops',     desc: 'Tenants' },
      { href: '/users',       label: 'Users',     desc: 'All users' },
    ],
  },
  {
    title: 'Business',
    items: [
      { href: '/super-admin/subscriptions', label: 'Subscriptions', desc: 'Billing & renewals' },
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

  const homeHref = role === 'SUPER_ADMIN' ? '/super-admin' : '/dashboard';
  const flatItems = sections.flatMap((s) => s.items);
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <Box
        as="nav"
        position="sticky"
        top={0}
        zIndex="banner"
        bg="app.canvas"
        borderBottomWidth="1px"
        borderBottomColor="app.border"
        shadow="e2"
      >
        <Flex
          maxW="8xl"
          mx="auto"
          px={{ base: 3, md: 5, lg: 8 }}
          h={{ base: '56px', md: '60px' }}
          align="center"
          gap={{ base: 2, md: 4 }}
        >
          {/* Logo */}
          <Link href={homeHref} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <HStack gap={2}>
              <Flex
                align="center"
                justify="center"
                boxSize={9}
                borderRadius="md"
                bg="brand.subtle"
                color="brand.emphasized"
              >
                <IconDiamond size={20} />
              </Flex>
              <Stack gap={0} display={{ base: 'none', sm: 'flex' }}>
                <Text
                  fontFamily="heading"
                  fontWeight="700"
                  fontSize={{ base: 'md', md: 'lg' }}
                  color="app.text"
                  lineHeight={1}
                >
                  BoolaGold
                </Text>
                <Text fontSize="10px" color="app.subtle" letterSpacing="0.14em" textTransform="uppercase">
                  {role === 'SUPER_ADMIN' ? 'Platform Console' : 'Shop Console'}
                </Text>
              </Stack>
            </HStack>
          </Link>

          {/* Shop / role chips (desktop + tablet) */}
          <HStack gap={2} display={{ base: 'none', md: 'flex' }} flexShrink={0}>
            {ctx?.shop && <ShopTypeBadge type={ctx.shop.shopBusinessType} />}
            {role && (
              <Badge
                variant="subtle"
                bg="brand.subtle"
                color="brand.emphasized"
                borderWidth="1px"
                borderColor="brand.muted"
                textTransform="uppercase"
                letterSpacing="0.06em"
                fontWeight="600"
                px={2}
                py={1}
                borderRadius="pill"
              >
                {role.replace('_', ' ')}
              </Badge>
            )}
          </HStack>

          {/* Desktop menu */}
          <HStack
            gap={1}
            flex="1"
            overflowX="auto"
            display={{ base: 'none', lg: 'flex' }}
            css={{ scrollbarWidth: 'none', '::-webkit-scrollbar': { display: 'none' } }}
          >
            {flatItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                  <Box
                    px={3}
                    h="36px"
                    display="inline-flex"
                    alignItems="center"
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight={active ? '600' : '500'}
                    color={active ? 'brand.emphasized' : 'app.text'}
                    bg={active ? 'brand.subtle' : 'transparent'}
                    position="relative"
                    _hover={active ? undefined : { bg: 'app.muted' }}
                    transition="background 0.15s ease"
                    title={item.desc}
                  >
                    {item.label}
                    {active && (
                      <Box
                        position="absolute"
                        bottom="-1px"
                        left="12px"
                        right="12px"
                        h="2px"
                        borderRadius="pill"
                        bg="brand.solid"
                      />
                    )}
                  </Box>
                </Link>
              );
            })}
          </HStack>

          <Box flex="1" display={{ base: 'block', lg: 'none' }} />

          {/* User + logout (md+) */}
          <HStack gap={2} display={{ base: 'none', md: 'flex' }} flexShrink={0}>
            {ctx?.user && (
              <Text fontSize="sm" color="app.subtle" fontWeight="500" maxW="180px" truncate>
                {ctx.user.name || ctx.user.username}
              </Text>
            )}
            <Button
              size="sm"
              variant="ghost"
              color="app.text"
              _hover={{ bg: 'app.muted' }}
              onClick={handleLogout}
            >
              <HStack gap={1.5}>
                <IconLogout size={16} />
                <Text display={{ base: 'none', lg: 'inline' }}>Sign out</Text>
              </HStack>
            </Button>
          </HStack>

          {/* Mobile / tablet trigger */}
          <IconButton
            aria-label="Open navigation"
            variant="ghost"
            size="md"
            color="app.text"
            display={{ base: 'inline-flex', lg: 'none' }}
            _hover={{ bg: 'app.muted' }}
            onClick={() => setDrawerOpen(true)}
          >
            <IconMenu size={22} />
          </IconButton>
        </Flex>
      </Box>

      {drawerOpen && (
        <Portal>
          <Box
            position="fixed"
            inset={0}
            bg="rgba(28,27,38,0.55)"
            zIndex="overlay"
            onClick={() => setDrawerOpen(false)}
            style={{ backdropFilter: 'blur(2px)' }}
          />
          <Box
            position="fixed"
            top={0}
            right={0}
            bottom={0}
            width={{ base: '85vw', sm: '360px' }}
            maxW="400px"
            bg="app.canvas"
            zIndex="modal"
            shadow="e28"
            overflowY="auto"
            className="enter-up"
          >
            <Flex
              align="center"
              justify="space-between"
              px={4}
              h="56px"
              borderBottomWidth="1px"
              borderColor="app.border"
            >
              <HStack gap={2}>
                <Flex
                  align="center"
                  justify="center"
                  boxSize={8}
                  borderRadius="md"
                  bg="brand.subtle"
                  color="brand.emphasized"
                >
                  <IconDiamond size={18} />
                </Flex>
                <Text fontFamily="heading" fontWeight="700" fontSize="lg" color="app.text">
                  BoolaGold
                </Text>
              </HStack>
              <IconButton
                aria-label="Close navigation"
                size="sm"
                variant="ghost"
                color="app.text"
                _hover={{ bg: 'app.muted' }}
                onClick={() => setDrawerOpen(false)}
              >
                <IconClose size={20} />
              </IconButton>
            </Flex>

            <Stack gap={5} p={4}>
              {ctx?.user && (
                <Box
                  p={3}
                  bg="brand.subtle"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="brand.muted"
                >
                  <Text fontSize="xs" color="brand.emphasized" textTransform="uppercase" letterSpacing="0.08em" fontWeight="700">
                    Signed in as
                  </Text>
                  <Text fontWeight="600" color="app.text" fontSize="sm" mt={0.5}>
                    {ctx.user.name || ctx.user.username}
                  </Text>
                  {ctx.shop?.name && (
                    <Text fontSize="xs" color="app.subtle">
                      {ctx.shop.name}
                    </Text>
                  )}
                  <HStack gap={2} mt={2} wrap="wrap">
                    {ctx.shop && <ShopTypeBadge type={ctx.shop.shopBusinessType} />}
                    {role && (
                      <Badge variant="subtle" bg="brand.muted" color="brand.emphasized" borderRadius="pill" px={2}>
                        {role.replace('_', ' ')}
                      </Badge>
                    )}
                  </HStack>
                </Box>
              )}

              {sections.map((section) => (
                <Box key={section.title}>
                  <Text
                    fontSize="xs"
                    color="app.subtle"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                    fontWeight="700"
                    mb={2}
                  >
                    {section.title}
                  </Text>
                  <Stack gap={0.5}>
                    {section.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                          <Flex
                            align="center"
                            justify="space-between"
                            gap={3}
                            px={3}
                            py={2.5}
                            borderRadius="md"
                            bg={active ? 'brand.subtle' : 'transparent'}
                            color={active ? 'brand.emphasized' : 'app.text'}
                            _hover={active ? undefined : { bg: 'app.muted' }}
                          >
                            <Stack gap={0} flex="1" minW={0}>
                              <Text fontWeight={active ? '600' : '500'} fontSize="sm">
                                {item.label}
                              </Text>
                              <Text fontSize="xs" color="app.subtle" truncate>
                                {item.desc}
                              </Text>
                            </Stack>
                            {active && (
                              <Box boxSize={2} borderRadius="pill" bg="brand.solid" />
                            )}
                          </Flex>
                        </Link>
                      );
                    })}
                  </Stack>
                </Box>
              ))}

              <Button
                variant="outline"
                borderColor="app.border"
                color="app.text"
                _hover={{ bg: 'app.muted' }}
                onClick={handleLogout}
              >
                <HStack gap={2}>
                  <IconLogout size={16} />
                  <Text>Sign out</Text>
                </HStack>
              </Button>
            </Stack>
          </Box>
        </Portal>
      )}
    </>
  );
}
