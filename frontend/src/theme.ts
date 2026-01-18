// Shared design tokens - Dark navy + cyan/turquoise aesthetic
export const palette = {
  // Fondos oscuros (navy)
  background: '#050B12',
  surface: '#0A1421',
  surfaceAlt: '#0E1D2C',
  surfaceHighlight: '#11263A',
  inputBg: '#0C1826',
  headerBg: '#061018',

  // Bordes
  border: '#1E3448',
  borderLight: '#27435C',

  // Marca
  primary: '#16D3D6',
  primaryLight: '#5BEAF0',
  primaryMuted: '#16D3D640',
  primaryGlow: '#16D3D620',
  accent: '#2BD4FF',
  accentMuted: '#2BD4FF40',

  // Texto
  text: '#F5FBFF',
  textWarm: '#C6F7FF',
  muted: '#89A4B5',
  mutedAlt: '#5D7688',

  // Estados
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
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
