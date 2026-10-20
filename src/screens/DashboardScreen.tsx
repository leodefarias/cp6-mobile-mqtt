import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { LampControl } from '../components/LampControl';
import { SensorCard } from '../components/SensorCard';
import { useMqtt } from '../context/MqttContext';
import { useTheme } from '../context/ThemeContext';

export function DashboardScreen() {
  const { colors } = useTheme();
  const {
    status,
    error,
    brokerUrl,
    temperature,
    humidity,
    lamp,
    pendingCommand,
    commandWarning,
    reconnect,
    sendLampCommand,
  } = useMqtt();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <ConnectionStatus status={status} error={error} brokerUrl={brokerUrl} onReconnect={reconnect} />
      <View style={styles.sensors}>
        <SensorCard label="Temperatura" icon="🌡️" unit="°C" reading={temperature} />
        <SensorCard label="Umidade" icon="💧" unit="%" reading={humidity} decimals={0} />
      </View>
      <LampControl
        lamp={lamp}
        pendingCommand={pendingCommand}
        commandWarning={commandWarning}
        onCommand={sendLampCommand}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  sensors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
});
