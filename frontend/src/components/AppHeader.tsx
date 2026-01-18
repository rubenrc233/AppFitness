import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing, withOpacity } from '../theme';
import { AppIcon } from './AppIcon';

interface Props {
  title?: string;
}

export default function AppHeader({ title }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <AppIcon name="fitness" size={15} color={palette.text} />
        </View>
        {title && <Text style={styles.title}>{title}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: palette.headerBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.headerBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  logoContainer: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: withOpacity(palette.primary, 0.16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.text,
  },
});
