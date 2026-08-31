'use client';

import type { SVGProps } from 'react';

// Minimal, consistent 24×24 line icons. Stroke inherits currentColor.
// Add sparingly — a small set is easier to keep coherent than a huge library.

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

function BaseIcon({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconUser = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </BaseIcon>
);

export const IconLock = (p: IconProps) => (
  <BaseIcon {...p}>
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </BaseIcon>
);

export const IconEye = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </BaseIcon>
);

export const IconEyeOff = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.7 20.7 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.72 20.72 0 0 1-3.16 4.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <path d="M1 1l22 22" />
  </BaseIcon>
);

export const IconArrowRight = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </BaseIcon>
);

export const IconShieldCheck = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </BaseIcon>
);

export const IconStore = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M3 9 4.5 4h15L21 9" />
    <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
    <path d="M9 20v-6h6v6" />
  </BaseIcon>
);

export const IconCoin = (p: IconProps) => (
  <BaseIcon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9h4.5a2 2 0 1 1 0 4H9m0 0h5" />
    <path d="M12 6v12" />
  </BaseIcon>
);

export const IconScale = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M12 3v18" />
    <path d="M4 21h16" />
    <path d="M6 7h12" />
    <path d="M6 7 3 14a4 4 0 0 0 6 0L6 7z" />
    <path d="m18 7-3 7a4 4 0 0 0 6 0l-3-7z" />
  </BaseIcon>
);

export const IconSparkle = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </BaseIcon>
);

export const IconMenu = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </BaseIcon>
);

export const IconClose = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </BaseIcon>
);

export const IconLogout = (p: IconProps) => (
  <BaseIcon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </BaseIcon>
);

/** Little diamond mark used as the BoolaGold logotype glyph. */
export const IconDiamond = (p: IconProps) => (
  <BaseIcon {...p} strokeWidth={1.5}>
    <path d="M6 3h12l4 6-10 12L2 9z" />
    <path d="M2 9h20" />
    <path d="m6 3 6 6 6-6" />
    <path d="M12 9v12" />
  </BaseIcon>
);
