import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '../theme';

interface Props {
  title?: string;
}

export default function AppHeader({ title }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Ionicons name="flame" size={16} color={palette.text} />
      </View>
      {title && <Text style={styles.title}>{title}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.md,
    paddingTop: 44,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  logoContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
});
