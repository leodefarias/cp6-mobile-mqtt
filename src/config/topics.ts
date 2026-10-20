// Identificador exclusivo do grupo: altere aqui para evitar interferência com outros projetos.
export const GROUP_PREFIX = 'fiap/turma/guleo';

export const TOPICS = {
  temperature: `${GROUP_PREFIX}/sensor/temperatura`,
  humidity: `${GROUP_PREFIX}/sensor/umidade`,
  lampCommand: `${GROUP_PREFIX}/lampada/comando`,
  lampState: `${GROUP_PREFIX}/lampada/estado`,
} as const;

// Tópicos em que o aplicativo se inscreve.
export const SUBSCRIBED_TOPICS: string[] = [TOPICS.temperature, TOPICS.humidity, TOPICS.lampState];

// Broker público acessível por WebSocket seguro (WSS, porta 8884). Não é a porta TCP 1883.
export const DEFAULT_BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';

// Tempo máximo aguardando o estado da lâmpada após enviar um comando.
export const COMMAND_TIMEOUT_MS = 8000;

export const HISTORY_LIMIT = 10;
