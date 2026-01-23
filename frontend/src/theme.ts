// Shared design tokens - Estética HypertrOffice (fondo claro, tonos azules cyan)
export const palette = {
  // Fondos claros
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  surfaceHighlight: '#E0F2FE',
  inputBg: '#F8FAFC',
  headerBg: '#FFFFFF',

  // Bordes
  border: '#E2E8F0',
  borderLight: '#CBD5E1',

  // Marca - Tonos azules cyan
  primary: '#06B6D4',
  primaryLight: '#22D3EE',
  primaryMuted: '#06B6D440',
  primaryGlow: '#06B6D420',
  accent: '#0EA5E9',
  accentMuted: '#0EA5E940',

  // Texto
  text: '#0F172A',
  textWarm: '#1E293B',
  muted: '#64748B',
  mutedAlt: '#94A3B8',

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
