import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const colors = {
  brand: {
    50: { value: '#f5f4fa' },
    100: { value: '#e8e6f3' },
    200: { value: '#d1cde7' },
    300: { value: '#b9b3db' },
    400: { value: '#a29dcf' },
    500: { value: '#8b86be' },
    600: { value: '#6f6b98' },
    700: { value: '#535072' },
    800: { value: '#38364c' },
    900: { value: '#1c1b26' },
  },
  pink: {
    50: { value: '#fef5f7' },
    100: { value: '#fce8ec' },
    200: { value: '#f9d1d9' },
    300: { value: '#f5bac6' },
    400: { value: '#f2a3b3' },
    500: { value: '#deb0bd' },
    600: { value: '#b28d97' },
    700: { value: '#856a71' },
    800: { value: '#59474c' },
    900: { value: '#2c2426' },
  },
  gold: {
    50: { value: '#fefaf2' },
    100: { value: '#fdf3e0' },
    200: { value: '#fbe7c1' },
    300: { value: '#f8dba2' },
    400: { value: '#f6cf83' },
    500: { value: '#ecb761' },
    600: { value: '#bd924e' },
    700: { value: '#8e6e3a' },
    800: { value: '#5e4927' },
    900: { value: '#2f2513' },
  },
  metal: {
    50: { value: '#f6f8fa' },
    100: { value: '#e6ecf1' },
    200: { value: '#c9d4de' },
    300: { value: '#a3b3c2' },
    400: { value: '#7e93a5' },
    500: { value: '#5c7387' },
    600: { value: '#48596a' },
    700: { value: '#36414e' },
    800: { value: '#242a33' },
    900: { value: '#12151a' },
  },
};

const config = defineConfig({
  theme: {
    breakpoints: {
      sm: '30em',
      md: '48em',
      lg: '62em',
      xl: '80em',
      '2xl': '96em',
    },
    tokens: {
      colors,
      radii: {
        sm: { value: '6px' },
        md: { value: '10px' },
        lg: { value: '14px' },
        xl: { value: '20px' },
        '2xl': { value: '28px' },
      },
      shadows: {
        card: { value: '0 4px 20px rgba(139, 134, 190, 0.10)' },
        cardHover: { value: '0 10px 30px rgba(139, 134, 190, 0.18)' },
        header: { value: '0 2px 16px rgba(28, 27, 38, 0.08)' },
      },
      fonts: {
        heading: { value: `'Playfair Display', Georgia, serif` },
        body: { value: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` },
      },
    },
    semanticTokens: {
      colors: {
        'app.bg':      { value: { base: '{colors.gray.50}',  _dark: '{colors.metal.900}' } },
        'app.surface': { value: { base: 'white',             _dark: '{colors.metal.800}' } },
        'app.border':  { value: { base: '{colors.gray.200}', _dark: '{colors.metal.700}' } },
        'app.muted':   { value: { base: '{colors.gray.100}', _dark: '{colors.metal.800}' } },
        'app.text':    { value: { base: '{colors.gray.800}', _dark: 'whiteAlpha.900' } },
        'app.subtle':  { value: { base: '{colors.gray.600}', _dark: 'whiteAlpha.700' } },

        'brand.solid':      { value: '{colors.brand.500}' },
        'brand.contrast':   { value: 'white' },
        'brand.fg':         { value: '{colors.brand.600}' },
        'brand.subtle':     { value: '{colors.brand.50}' },
        'brand.muted':      { value: '{colors.brand.100}' },
        'brand.emphasized': { value: '{colors.brand.700}' },

        // Retail (cash) flow accent — gold
        'flow.retail':    { value: '{colors.gold.500}' },
        'flow.retail.bg': { value: '{colors.gold.50}' },
        'flow.retail.fg': { value: '{colors.gold.700}' },

        // Wholesale (metal) flow accent — cool metal
        'flow.wholesale':    { value: '{colors.metal.600}' },
        'flow.wholesale.bg': { value: '{colors.metal.50}' },
        'flow.wholesale.fg': { value: '{colors.metal.700}' },

        'status.success': { value: '#22c55e' },
        'status.warning': { value: '#f59e0b' },
        'status.danger':  { value: '#ef4444' },
        'status.info':    { value: '#3b82f6' },
      },
    },
  },
  globalCss: {
    'html, body': {
      bg: 'app.bg',
      color: 'app.text',
      fontFamily: 'body',
      minHeight: '100vh',
    },
    body: {
      margin: 0,
    },
    '*': { boxSizing: 'border-box' },
    'h1, h2, h3, h4, h5, h6': { fontFamily: 'heading', lineHeight: 1.2 },
    'button, a, [role="button"]': { touchAction: 'manipulation' },
  },
});

export const system = createSystem(defaultConfig, config);

export default system;
