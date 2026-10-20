import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { MessageItem } from '../components/MessageItem';
import { HISTORY_LIMIT } from '../config/topics';
import { useMqtt } from '../context/MqttContext';
import { useTheme } from '../context/ThemeContext';

export function HistoryScreen() {
  const { colors } = useTheme();
  const { history, clearHistory } = useMqtt();

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MessageItem entry={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Últimas {HISTORY_LIMIT} mensagens enviadas e recebidas ({history.length}/{HISTORY_LIMIT})
          </Text>
          {history.length > 0 ? (
            <Button title="Limpar" variant="secondary" onPress={clearHistory} style={styles.clear} />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Nenhuma mensagem ainda. As mensagens aparecem aqui automaticamente.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  subtitle: {
    flex: 1,
    fontSize: 13,
  },
  clear: {
    minHeight: 34,
  },
  separator: {
    height: 10,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
