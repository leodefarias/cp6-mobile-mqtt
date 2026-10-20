import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SensorReading } from '../types/mqtt';
import { formatTime } from '../utils/format';
import { Card } from './Card';

interface SensorCardProps {
  label: string;
  icon: string;
  unit: string;
  reading: SensorReading | null;
  decimals?: number;
}

export function SensorCard({ label, icon, unit, reading, decimals = 1 }: SensorCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: colors.text }]}>
        {reading ? reading.value.toFixed(decimals) : '--'}
        <Text style={[styles.unit, { color: colors.textMuted }]}> {unit}</Text>
      </Text>
      <Text style={[styles.updated, { color: colors.textMuted }]}>
        {reading ? `Atualizado às ${formatTime(reading.receivedAt)}` : 'Aguardando dados...'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 34,
    fontWeight: '700',
    marginVertical: 8,
  },
  unit: {
    fontSize: 18,
    fontWeight: '500',
  },
  updated: {
    fontSize: 12,
  },
});
