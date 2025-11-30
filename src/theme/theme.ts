import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

// Color palette
const colors = {
  brand: {
    primary: { value: '#8b86be' },      // Soft purple - Primary brand color
    secondary: { value: '#deb0bd' },    // Soft pink - Secondary/accent
    accent: { value: '#ecb761' },       // Gold - Jewelry theme accent
    success: { value: '#cbd690' },      // Soft green - Success states
    info: { value: '#86abba' },         // Soft blue - Info/neutral
    50: { value: '#f5f4fa' },
    100: { value: '#e8e6f3' },
    200: { value: '#d1cde7' },
    300: { value: '#b9b3db' },
    400: { value: '#a29dcf' },
    500: { value: '#8b86be' },          // Primary
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
    500: { value: '#deb0bd' },          // Secondary
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
    500: { value: '#ecb761' },          // Accent
    600: { value: '#bd924e' },
    700: { value: '#8e6e3a' },
    800: { value: '#5e4927' },
    900: { value: '#2f2513' },
  },
  green: {
    50: { value: '#f7faf2' },
    100: { value: '#edf4e0' },
    200: { value: '#dbe9c1' },
    300: { value: '#c9dea2' },
    400: { value: '#b7d383' },
    500: { value: '#cbd690' },          // Success
    600: { value: '#a2ab73' },
    700: { value: '#7a8056' },
    800: { value: '#515639' },
    900: { value: '#292b1d' },
  },
  blue: {
    50: { value: '#f3f7f9' },
    100: { value: '#e2ecf0' },
    200: { value: '#c5d9e1' },
    300: { value: '#a8c6d2' },
    400: { value: '#8bb3c3' },
    500: { value: '#86abba' },          // Info
    600: { value: '#6b8995' },
    700: { value: '#506770' },
    800: { value: '#36444a' },
    900: { value: '#1b2225' },
  },
};

const config = defineConfig({
  theme: {
    tokens: {
      colors,
    },
    semanticTokens: {
      colors: {
        'brand.primary': { value: '{colors.brand.primary}' },
        'brand.secondary': { value: '{colors.brand.secondary}' },
        'brand.accent': { value: '{colors.brand.accent}' },
        'brand.success': { value: '{colors.brand.success}' },
        'brand.info': { value: '{colors.brand.info}' },
      },
    },
  },
  globalCss: {
    body: {
      bg: 'gray.50',
      color: 'gray.800',
    },
  },
});

const theme = createSystem(defaultConfig, config);

/*
// Note: Component customization in Chakra UI v3 uses a different approach
// The following component styles need to be migrated to the new system
const componentsConfig = {
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          bg: 'brand.primary',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
        },
        outline: {
          borderColor: 'brand.primary',
          color: 'brand.primary',
          _hover: {
            bg: 'brand.50',
          },
        },
        ghost: {
          color: 'brand.primary',
          _hover: {
            bg: 'brand.50',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'lg',
          boxShadow: 'sm',
          border: '1px solid',
          borderColor: 'gray.200',
        },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.primary',
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'brand.primary',
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: 'brand.primary',
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            bg: 'brand.50',
            color: 'brand.700',
            fontWeight: 'semibold',
            textTransform: 'none',
            letterSpacing: 'normal',
          },
          td: {
            borderColor: 'gray.200',
          },
        },
      },
    },
    Badge: {
      variants: {
        solid: {
          bg: 'brand.primary',
          color: 'white',
        },
        subtle: {
          bg: 'brand.50',
          color: 'brand.700',
        },
      },
    },
    Tag: {
      variants: {
        solid: {
          container: {
            bg: 'brand.primary',
            color: 'white',
          },
        },
        subtle: {
          container: {
            bg: 'brand.50',
            color: 'brand.700',
          },
        },
      },
    },
  },
};
*/

export default theme;
