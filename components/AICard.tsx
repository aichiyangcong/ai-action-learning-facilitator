import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface AICardProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger';
}

export default function AICard({ title, children, variant = 'default' }: AICardProps) {
  const getBorderColor = () => {
    switch (variant) {
      case 'warning': return Colors.warning;
      case 'danger': return Colors.danger;
      default: return Colors.aiBorder;
    }
  };

  const getBgColor = () => {
    switch (variant) {
      case 'warning': return Colors.warningLight;
      case 'danger': return Colors.dangerLight;
      default: return Colors.aiGlow;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'warning': return Colors.warning;
      case 'danger': return Colors.danger;
      default: return Colors.accent;
    }
  };

  return (
    <View style={[
      styles.container,
      { borderColor: getBorderColor(), backgroundColor: getBgColor() },
    ]}>
      {title && (
        <View style={styles.header}>
          <Ionicons name="sparkles" size={16} color={getIconColor()} />
          <Text style={[styles.title, { color: getIconColor() }]}>{title}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
