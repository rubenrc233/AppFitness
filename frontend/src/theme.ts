// Shared design tokens - Estética Incinerador (fondo negro, tonos naranjas)
export const palette = {
  // Fondos oscuros
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceAlt: '#151515',
  surfaceHighlight: '#252525',
  inputBg: '#1A1A1A',
  headerBg: '#0A0A0A',

  // Bordes
  border: '#2A2A2A',
  borderLight: '#333333',

  // Marca - Tonos naranjas y fuego
  primary: '#FF6B35',
  primaryLight: '#FF8C5A',
  primaryMuted: '#FF6B3540',
  primaryGlow: '#FF6B3520',
  accent: '#FFB627',
  accentMuted: '#FFB62740',

  // Texto
  text: '#FFFFFF',
  textWarm: '#F5F5F5',
  muted: '#999999',
  mutedAlt: '#666666',

  // Estados
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#FFB627',
  warningMuted: 'rgba(255, 182, 39, 0.15)',
  warningGlow: 'rgba(255, 182, 39, 0.1)',
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
