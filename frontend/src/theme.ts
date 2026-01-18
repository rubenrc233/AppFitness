// Shared design tokens - Soft off-white light aesthetic (not pure white)
export const palette = {
  // Fondos claros (blanco roto)
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F6',
  surfaceHighlight: '#E7EDF3',
  inputBg: '#FFFFFF',
  headerBg: '#FFFFFF',

  // Bordes
  border: '#E2E8F0',
  borderLight: '#CBD5E1',

  // Marca
  primary: '#16D3D6',
  primaryLight: '#5BEAF0',
  primaryMuted: '#16D3D640',
  primaryGlow: '#16D3D620',
  accent: '#2BD4FF',
  accentMuted: '#2BD4FF40',

  // Texto
  text: '#0B1220',
  textWarm: '#0F2233',
  muted: '#5B6B7A',
  mutedAlt: '#7A8A99',

  // Estados
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  warningGlow: 'rgba(245, 158, 11, 0.1)',
};

export const withOpacity = (hexColor: string, opacity: number) => {
  const alpha = Math.max(0, Math.min(1, opacity));
  const hex = hexColor.replace('#', '').trim();

  const normalized =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex.length === 6
        ? hex
        : hex.length === 8
          ? hex.slice(0, 6)
          : '';

  if (normalized.length !== 6) return hexColor;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((v) => Number.isNaN(v))) return hexColor;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  full: 999,
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
};
