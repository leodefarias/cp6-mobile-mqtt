import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { HistoryEntry } from '../types/mqtt';
import { formatTime } from '../utils/format';
import { Card } from './Card';

interface MessageItemProps {
  entry: HistoryEntry;
}

export function MessageItem({ entry }: MessageItemProps) {
  const { colors } = useTheme();
  const sent = entry.direction === 'sent';
  const badgeColor = sent ? colors.primary : colors.success;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{sent ? '↑ Enviada' : '↓ Recebida'}</Text>
        </View>
        <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(entry.timestamp)}</Text>
      </View>
      <Text style={[styles.topic, { color: colors.textMuted }]}>{entry.topic}</Text>
      <Text style={[styles.payload, { color: colors.text, backgroundColor: colors.inputBackground }]}>
        {entry.payload}
      </Text>
      {!entry.valid ? (
        <Text style={[styles.invalid, { color: colors.danger }]}>Payload inválido (ignorado)</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
  },
  topic: {
    fontSize: 12,
    marginTop: 8,
  },
  payload: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 13,
    marginTop: 6,
    padding: 8,
    borderRadius: 6,
  },
  invalid: {
    fontSize: 12,
    marginTop: 6,
  },
});
