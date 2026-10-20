import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { DEFAULT_BROKER_URL, GROUP_PREFIX } from '../config/topics';
import { useMqtt } from '../context/MqttContext';
import { useTheme } from '../context/ThemeContext';
import { validateBrokerUrl } from '../utils/parsePayload';

export function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { brokerUrl, status, error, connect, disconnect, saveBrokerUrl } = useMqtt();
  const [url, setUrl] = useState(brokerUrl);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUrl(brokerUrl);
  }, [brokerUrl]);

  const isBusy = status === 'connecting';
  const isActive = status === 'connected' || status === 'connecting';

  const handleConnect = async () => {
    const trimmed = url.trim();
    const problem = validateBrokerUrl(trimmed);
    setValidationError(problem);
    if (problem) return;
    await saveBrokerUrl(trimmed);
    setSaved(true);
    connect(trimmed);
  };

  const handleSave = async () => {
    const trimmed = url.trim();
    const problem = validateBrokerUrl(trimmed);
    setValidationError(problem);
    if (problem) return;
    await saveBrokerUrl(trimmed);
    setSaved(true);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <ConnectionStatus status={status} error={error} brokerUrl={brokerUrl} />

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Broker MQTT (WebSocket)</Text>
        <TextInput
          value={url}
          onChangeText={(text) => {
            setUrl(text);
            setSaved(false);
            setValidationError(null);
          }}
          placeholder={DEFAULT_BROKER_URL}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.inputBackground,
              borderColor: validationError ? colors.danger : colors.border,
            },
          ]}
        />
        {validationError ? (
          <Text style={[styles.hint, { color: colors.danger }]}>{validationError}</Text>
        ) : (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            {saved ? 'URL salva no dispositivo.' : 'Use a porta WebSocket (ex.: 8884 WSS), não a porta TCP 1883.'}
          </Text>
        )}
        <View style={styles.row}>
          <Button title="Salvar" variant="secondary" onPress={handleSave} style={styles.flex} />
          {isActive ? (
            <Button
              title="Desconectar"
              variant="danger"
              onPress={disconnect}
              style={styles.flex}
            />
          ) : (
            <Button title="Conectar" onPress={handleConnect} loading={isBusy} style={styles.flex} />
          )}
        </View>
        {status === 'error' ? (
          <Button
            title="Parar tentativas de conexão"
            variant="secondary"
            onPress={disconnect}
            style={styles.reset}
          />
        ) : null}
        <Button
          title="Restaurar URL padrão"
          variant="secondary"
          onPress={() => {
            setUrl(DEFAULT_BROKER_URL);
            setSaved(false);
            setValidationError(null);
          }}
          style={styles.reset}
        />
      </Card>

      <Card>
        <View style={styles.themeRow}>
          <View style={styles.flex}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tema escuro</Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Tema atual: {theme === 'dark' ? 'Dark' : 'Light'} (salvo automaticamente)
            </Text>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ true: colors.primary, false: colors.neutral }}
          />
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tópicos do grupo</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>Prefixo: {GROUP_PREFIX}</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 12,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  flex: {
    flex: 1,
  },
  reset: {
    marginTop: 10,
    minHeight: 38,
    borderWidth: 0,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
