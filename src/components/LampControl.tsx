import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CommandResult } from '../context/MqttContext';
import { useTheme } from '../context/ThemeContext';
import { LampReading, LampState } from '../types/mqtt';
import { formatTime } from '../utils/format';
import { Button } from './Button';
import { Card } from './Card';

interface LampControlProps {
  lamp: LampReading | null;
  pendingCommand: LampState | null;
  commandWarning: string | null;
  onCommand: (action: LampState) => CommandResult;
}

export function LampControl({ lamp, pendingCommand, commandWarning, onCommand }: LampControlProps) {
  const { colors } = useTheme();
  const [feedback, setFeedback] = useState<CommandResult | null>(null);

  // A confirmação de estado ou o aviso de timeout substituem o feedback do toque.
  useEffect(() => {
    setFeedback(null);
  }, [lamp, commandWarning]);

  const isOn = lamp?.state === 'ON';
  const label = lamp ? (isOn ? 'Ligada' : 'Desligada') : 'Estado desconhecido';

  const handlePress = (action: LampState) => {
    setFeedback(onCommand(action));
  };

  const message = feedback?.message ?? commandWarning;
  const messageColor = feedback ? (feedback.ok ? colors.textMuted : colors.danger) : colors.warning;

  return (
    <Card>
      <Text style={[styles.title, { color: colors.textMuted }]}>💡 Lâmpada</Text>
      <View style={styles.stateRow}>
        <View style={[styles.bulb, { backgroundColor: isOn ? colors.lampOn : colors.lampOff }]} />
        <View style={styles.stateText}>
          <Text style={[styles.state, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.updated, { color: colors.textMuted }]}>
            {lamp ? `Confirmado pelo dispositivo às ${formatTime(lamp.receivedAt)}` : 'Aguardando estado do dispositivo...'}
          </Text>
        </View>
      </View>
      <View style={styles.buttons}>
        <Button
          title="Ligar"
          onPress={() => handlePress('ON')}
          loading={pendingCommand === 'ON'}
          disabled={pendingCommand !== null}
          style={styles.button}
        />
        <Button
          title="Desligar"
          variant="secondary"
          onPress={() => handlePress('OFF')}
          loading={pendingCommand === 'OFF'}
          disabled={pendingCommand !== null}
          style={styles.button}
        />
      </View>
      {message ? <Text style={[styles.feedback, { color: messageColor }]}>{message}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 14,
  },
  bulb: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  stateText: {
    flex: 1,
  },
  state: {
    fontSize: 24,
    fontWeight: '700',
  },
  updated: {
    fontSize: 12,
    marginTop: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  feedback: {
    fontSize: 13,
    marginTop: 10,
  },
});
