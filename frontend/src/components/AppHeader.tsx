import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing } from '../theme';

interface Props {
  title?: string;
}

export default function AppHeader({ title }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.appName}>{title}</Text>
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
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    color: palette.primary,
    letterSpacing: 2,
  },
});
