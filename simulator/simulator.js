/**
 * Simulador do dispositivo IoT (sensor de temperatura/umidade + lâmpada virtual).
 *
 * - Publica temperatura e umidade periodicamente.
 * - Inscreve-se no tópico de comando da lâmpada e, ao receber {"action":"ON"|"OFF"},
 *   publica o novo estado em lampada/estado (retido).
 *
 * Variáveis de ambiente (opcionais):
 *   BROKER_URL    padrão: wss://broker.hivemq.com:8884/mqtt
 *   TOPIC_PREFIX  padrão: fiap/turma/guleo
 *   INTERVAL_MS   padrão: 5000
 */
const mqtt = require('mqtt');
const readline = require('readline');

const BROKER_URL = process.env.BROKER_URL || 'wss://broker.hivemq.com:8884/mqtt';
const PREFIX = process.env.TOPIC_PREFIX || 'fiap/turma/guleo';
const INTERVAL_MS = Number(process.env.INTERVAL_MS) || 5000;

const TOPICS = {
  temperature: `${PREFIX}/sensor/temperatura`,
  humidity: `${PREFIX}/sensor/umidade`,
  lampCommand: `${PREFIX}/lampada/comando`,
  lampState: `${PREFIX}/lampada/estado`,
};

let temperature = 24;
let humidity = 55;
let lampState = 'OFF';
let timer = null;

const time = () => new Date().toLocaleTimeString('pt-BR');
const log = (...args) => console.log(`[${time()}]`, ...args);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const drift = (value, step, min, max) => clamp(value + (Math.random() * 2 - 1) * step, min, max);

const client = mqtt.connect(BROKER_URL, {
  clientId: `iot-simulator-${Math.random().toString(16).slice(2, 10)}`,
  clean: true,
  reconnectPeriod: 3000,
  connectTimeout: 10000,
});

function publish(topic, payload, options = {}) {
  const message = JSON.stringify(payload);
  client.publish(topic, message, { qos: 1, ...options }, (error) => {
    if (error) log('Erro ao publicar', topic, error.message);
    else log('→', topic, message);
  });
}

function publishReadings() {
  temperature = drift(temperature, 0.6, 15, 35);
  humidity = drift(humidity, 2, 30, 90);
  publish(TOPICS.temperature, { value: Number(temperature.toFixed(1)) });
  publish(TOPICS.humidity, { value: Math.round(humidity) });
}

function publishLampState() {
  publish(TOPICS.lampState, { state: lampState }, { retain: true });
}

client.on('connect', () => {
  log(`Conectado a ${BROKER_URL}`);
  log(`Prefixo dos tópicos: ${PREFIX}`);
  client.subscribe(TOPICS.lampCommand, { qos: 1 }, (error) => {
    if (error) log('Erro ao inscrever', error.message);
    else log('Inscrito em', TOPICS.lampCommand);
  });
  publishLampState();
  publishReadings();
  clearInterval(timer);
  timer = setInterval(publishReadings, INTERVAL_MS);
  log('Comandos: [t] temperatura  [u] umidade  [l] alternar lâmpada  [i] payload inválido  [q] sair');
});

client.on('message', (topic, buffer) => {
  if (topic !== TOPICS.lampCommand) return;
  const raw = buffer.toString();
  log('←', topic, raw);
  let action;
  try {
    action = String(JSON.parse(raw).action).toUpperCase();
  } catch {
    action = null;
  }
  if (action !== 'ON' && action !== 'OFF') {
    log('Comando inválido ignorado:', raw);
    return;
  }
  lampState = action;
  log(`Lâmpada ${lampState === 'ON' ? 'LIGADA' : 'DESLIGADA'}`);
  publishLampState();
});

client.on('reconnect', () => log('Reconectando...'));
client.on('offline', () => log('Offline'));
client.on('error', (error) => log('Erro:', error.message));

// Atalhos de teclado para demonstração manual.
if (process.stdin.isTTY) {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', (_str, key) => {
    if (!key) return;
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) shutdown();
    else if (key.name === 't') {
      temperature = drift(temperature, 0.6, 15, 35);
      publish(TOPICS.temperature, { value: Number(temperature.toFixed(1)) });
    } else if (key.name === 'u') {
      humidity = drift(humidity, 2, 30, 90);
      publish(TOPICS.humidity, { value: Math.round(humidity) });
    } else if (key.name === 'l') {
      lampState = lampState === 'ON' ? 'OFF' : 'ON';
      publishLampState();
    } else if (key.name === 'i') {
      client.publish(TOPICS.temperature, 'abc', { qos: 1 });
      log('→', TOPICS.temperature, 'abc (payload inválido de teste)');
    }
  });
}

function shutdown() {
  log('Encerrando simulador...');
  clearInterval(timer);
  client.end(false, () => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
