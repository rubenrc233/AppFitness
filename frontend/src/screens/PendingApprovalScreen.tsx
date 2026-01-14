import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppIcon as Ionicons } from '../components/AppIcon';
import { palette, spacing, radius } from '../theme';

export default function PendingApprovalScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={80} color={palette.primary} />
        </View>
        
        <Text style={styles.title}>Registro completado</Text>
        
        <Text style={styles.message}>
          Tu solicitud está siendo revisada por tu entrenador.
        </Text>
        
        <Text style={styles.submessage}>
          Una vez que te apruebe, podrás acceder a tu rutina de entrenamiento y plan de alimentación personalizado.
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={palette.muted} />
          <Text style={styles.infoText}>
            Esto suele tardar menos de 24 horas. Contacta con tu entrenador si tienes dudas.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: palette.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 16,
    color: palette.textWarm,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  submessage: {
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: palette.muted,
    lineHeight: 20,
  },
});
