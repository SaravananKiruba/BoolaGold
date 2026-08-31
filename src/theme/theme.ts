import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

// Brand palette — soft purple (primary) + gold (accent) + pink (secondary) jewelry theme.
const colors = {
  brand: {
    50:  { value: '#f5f4fa' },
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
    50:  { value: '#fef5f7' },
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
    50:  { value: '#fefaf2' },
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
    50:  { value: '#f6f8fa' },
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
      // Fluent-inspired corner radii (4 / 6 / 8 / 12 / 20)
      radii: {
        sm:   { value: '4px' },
        md:   { value: '8px' },
        lg:   { value: '12px' },
        xl:   { value: '20px' },
        '2xl':{ value: '28px' },
        pill: { value: '999px' },
      },
      // Fluent-style elevation ladder (shadow2 / 4 / 8 / 16 / 28 / 64)
      shadows: {
        e2:  { value: '0 1px 2px rgba(28, 27, 38, 0.06)' },
        e4:  { value: '0 2px 4px rgba(28, 27, 38, 0.08), 0 0 2px rgba(28, 27, 38, 0.06)' },
        e8:  { value: '0 4px 8px rgba(28, 27, 38, 0.10), 0 0 2px rgba(28, 27, 38, 0.06)' },
        e16: { value: '0 8px 16px rgba(28, 27, 38, 0.12), 0 0 4px rgba(28, 27, 38, 0.06)' },
        e28: { value: '0 14px 28px rgba(28, 27, 38, 0.18), 0 0 8px rgba(28, 27, 38, 0.08)' },
        e64: { value: '0 32px 64px rgba(28, 27, 38, 0.22), 0 0 8px rgba(28, 27, 38, 0.10)' },
        card:         { value: '0 4px 20px rgba(139, 134, 190, 0.10)' },
        cardHover:    { value: '0 10px 30px rgba(139, 134, 190, 0.20)' },
        header:       { value: '0 2px 16px rgba(28, 27, 38, 0.10)' },
        focus:        { value: '0 0 0 3px var(--chakra-colors-brand-100)' },
        focusStrong:  { value: '0 0 0 3px var(--chakra-colors-brand-200)' },
      },
      fonts: {
        heading: { value: `'Playfair Display', Georgia, serif` },
        body:    { value: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif` },
      },
      spacing: {
        // Fluent 4pt grid extension
        '4.5': { value: '1.125rem' },
        '18':  { value: '4.5rem' },
      },
    },
    semanticTokens: {
      colors: {
        // Surfaces (Fluent Neutral background layers)
        'app.bg':       { value: { base: '#f7f7fb',            _dark: '{colors.metal.900}' } },
        'app.canvas':   { value: { base: '#ffffff',            _dark: '{colors.metal.800}' } },
        'app.surface':  { value: { base: '#ffffff',            _dark: '{colors.metal.800}' } },
        'app.subtle':   { value: { base: '{colors.gray.600}',  _dark: 'whiteAlpha.700' } },
        'app.muted':    { value: { base: '{colors.gray.100}',  _dark: '{colors.metal.700}' } },
        'app.border':   { value: { base: '#e6e5ee',            _dark: '{colors.metal.700}' } },
        'app.borderStrong': { value: { base: '#d4d2e0',        _dark: '{colors.metal.600}' } },
        'app.text':     { value: { base: '{colors.gray.900}',  _dark: 'whiteAlpha.900' } },

        'brand.solid':      { value: '{colors.brand.500}' },
        'brand.contrast':   { value: 'white' },
        'brand.fg':         { value: '{colors.brand.600}' },
        'brand.subtle':     { value: '{colors.brand.50}' },
        'brand.muted':      { value: '{colors.brand.100}' },
        'brand.emphasized': { value: '{colors.brand.700}' },

        // Retail flow (₹) — gold
        'flow.retail':    { value: '{colors.gold.500}' },
        'flow.retail.bg': { value: '{colors.gold.50}' },
        'flow.retail.fg': { value: '{colors.gold.700}' },

        // Wholesale flow (metal) — cool metal
        'flow.wholesale':    { value: '{colors.metal.600}' },
        'flow.wholesale.bg': { value: '{colors.metal.50}' },
        'flow.wholesale.fg': { value: '{colors.metal.700}' },

        'status.success': { value: '#16a34a' },
        'status.warning': { value: '#d97706' },
        'status.danger':  { value: '#dc2626' },
        'status.info':    { value: '#2563eb' },
      },
    },
  },
  globalCss: {
    'html, body': {
      bg: 'app.bg',
      color: 'app.text',
      fontFamily: 'body',
      fontFeatureSettings: '"cv02","cv03","cv04","cv11"',
      minHeight: '100vh',
    },
    body: { margin: 0 },
    '*': { boxSizing: 'border-box' },
    'h1, h2, h3, h4, h5, h6': { fontFamily: 'heading', lineHeight: 1.15 },
    'button, a, [role="button"]': { touchAction: 'manipulation' },
    ':focus-visible': { outline: 'none' },
  },
});

export const system = createSystem(defaultConfig, config);

export default system;
