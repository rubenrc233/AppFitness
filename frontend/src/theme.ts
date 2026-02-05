// Shared design tokens - Estética AMFTeam (fondo oscuro, tonos naranja-marrón)
export const palette = {
  // Fondos oscuros
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceAlt: '#252525',
  surfaceHighlight: '#2D2520',
  inputBg: '#1A1A1A',
  headerBg: '#0A0A0A',

  // Bordes
  border: '#333333',
  borderLight: '#404040',

  // Marca - Tonos naranja-marrón (del logo AMF)
  primary: '#CD5C45',
  primaryLight: '#E07055',
  primaryMuted: '#CD5C4540',
  primaryGlow: '#CD5C4520',
  accent: '#D4694F',
  accentMuted: '#D4694F40',

  // Texto
  text: '#F5F5F0',
  textWarm: '#E8E4DC',
  muted: '#9CA3AF',
  mutedAlt: '#6B7280',

  // Estados
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  warningGlow: 'rgba(245, 158, 11, 0.1)',
  dangerMuted: 'rgba(239, 68, 68, 0.15)',
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
