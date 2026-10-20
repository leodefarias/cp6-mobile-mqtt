import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../themes/colors';
import { ConnectionStatus as Status } from '../types/mqtt';
import { Button } from './Button';
import { Card } from './Card';

interface ConnectionStatusProps {
  status: Status;
  error: string | null;
  brokerUrl: string;
  onReconnect?: () => void;
}

const LABELS: Record<Status, string> = {
  connecting: 'Conectando...',
  connected: 'Conectado',
  disconnected: 'Desconectado',
  error: 'Erro de conexão',
};

export function statusColor(status: Status, colors: ThemeColors): string {
  switch (status) {
    case 'connected':
      return colors.success;
    case 'connecting':
      return colors.warning;
    case 'error':
      return colors.danger;
    default:
      return colors.neutral;
  }
}

export function ConnectionStatus({ status, error, brokerUrl, onReconnect }: ConnectionStatusProps) {
  const { colors } = useTheme();
  const color = statusColor(status, colors);
  const canReconnect = status === 'error' || status === 'disconnected';

  return (
    <Card>
      <View style={styles.row}>
        {status === 'connecting' ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <View style={[styles.dot, { backgroundColor: color }]} />
        )}
        <Text style={[styles.label, { color }]}>{LABELS[status]}</Text>
      </View>
      <Text style={[styles.url, { color: colors.textMuted }]} numberOfLines={1}>
        {brokerUrl}
      </Text>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      {canReconnect && onReconnect ? (
        <Button title="Reconectar" variant="secondary" onPress={onReconnect} style={styles.button} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  url: {
    fontSize: 12,
    marginTop: 6,
  },
  error: {
    fontSize: 13,
    marginTop: 8,
  },
  button: {
    marginTop: 12,
  },
});
