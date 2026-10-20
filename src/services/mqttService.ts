import { Client, Message, MQTTError } from 'paho-mqtt';
import {
  ConnectionStatus,
  MessageListener,
  StatusChange,
  StatusListener,
  Unsubscribe,
} from '../types/mqtt';

const MAX_RECONNECT_ATTEMPTS = 5;
const CONNECT_TIMEOUT_S = 8;
const KEEP_ALIVE_S = 30;

type QoS = 0 | 1 | 2;

// Traduz mensagens técnicas do Paho (ex.: "AMQJS0007E Socket error:undefined.") para o usuário.
function describeError(raw: string | undefined): string {
  if (!raw) return 'broker inacessível';
  if (raw.includes('AMQJS0007E')) return 'não foi possível abrir o WebSocket (verifique URL, porta e internet)';
  if (raw.includes('AMQJS0008I')) return 'socket fechado pelo broker';
  if (raw.includes('AMQJS0016E') || raw.toLowerCase().includes('timed out')) return 'tempo de conexão esgotado';
  return raw.replace(/\.+$/, '');
}

function createClientId(): string {
  return `iot-control-${Math.random().toString(16).slice(2, 10)}`;
}

/**
 * Camada de comunicação MQTT, independente da interface.
 * A UI se registra com onStatus/onMessage e recebe uma função para cancelar o registro.
 */
class MqttService {
  private client: Client | null = null;
  private url: string | null = null;
  private topics: string[] = [];
  private current: StatusChange = { status: 'disconnected' };
  private statusListeners = new Set<StatusListener>();
  private messageListeners = new Set<MessageListener>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  // Incrementado a cada nova conexão: callbacks de clientes antigos são ignorados.
  private generation = 0;

  getStatus(): ConnectionStatus {
    return this.current.status;
  }

  isConnected(): boolean {
    return this.client?.isConnected() ?? false;
  }

  onStatus(listener: StatusListener): Unsubscribe {
    this.statusListeners.add(listener);
    listener(this.current);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  onMessage(listener: MessageListener): Unsubscribe {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  connect(url: string, topics: string[]): void {
    this.closeClient();
    this.url = url;
    this.topics = topics;
    this.reconnectAttempts = 0;
    this.openConnection();
  }

  /** Reconexão manual (botão "Reconectar"), reinicia o contador de tentativas. */
  reconnect(): void {
    if (!this.url) return;
    this.connect(this.url, this.topics);
  }

  disconnect(): void {
    this.closeClient();
    this.setStatus({ status: 'disconnected' });
  }

  /** Retorna false (sem publicar) quando não há conexão ativa. */
  publish(topic: string, payload: string, qos: QoS = 1): boolean {
    if (!this.client || !this.client.isConnected()) return false;
    try {
      const message = new Message(payload);
      message.destinationName = topic;
      message.qos = qos;
      this.client.send(message);
      return true;
    } catch (error) {
      console.warn('Falha ao publicar', error);
      return false;
    }
  }

  private openConnection(): void {
    if (!this.url) return;
    const generation = ++this.generation;
    const url = this.url;
    this.setStatus({ status: 'connecting' });

    let client: Client;
    try {
      client = new Client(url, createClientId());
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.setStatus({ status: 'error', error: `URL inválida: ${detail}` });
      return;
    }
    this.client = client;

    client.onConnectionLost = (response: MQTTError) => {
      if (generation !== this.generation) return;
      // errorCode 0 = desconexão solicitada pelo próprio cliente
      if (response.errorCode === 0) return;
      this.handleFailure(`Conexão perdida: ${describeError(response.errorMessage)}`);
    };

    client.onMessageArrived = (message: Message) => {
      if (generation !== this.generation) return;
      let payload: string;
      try {
        payload = message.payloadString;
      } catch {
        payload = '<payload binário inválido>';
      }
      const incoming = { topic: message.destinationName, payload };
      this.messageListeners.forEach((listener) => listener(incoming));
    };

    try {
      client.connect({
        timeout: CONNECT_TIMEOUT_S,
        keepAliveInterval: KEEP_ALIVE_S,
        cleanSession: true,
        useSSL: url.toLowerCase().startsWith('wss://'),
        onSuccess: () => {
          if (generation !== this.generation) return;
          this.reconnectAttempts = 0;
          this.topics.forEach((topic) => client.subscribe(topic, { qos: 1 }));
          this.setStatus({ status: 'connected' });
        },
        onFailure: (response) => {
          if (generation !== this.generation) return;
          this.handleFailure(`Falha ao conectar: ${describeError(response.errorMessage)}`);
        },
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.handleFailure(`Falha ao conectar: ${detail}`);
    }
  }

  private handleFailure(message: string): void {
    this.client = null;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.setStatus({
        status: 'error',
        error: `${message}. Reconexão automática esgotada, toque em "Reconectar".`,
      });
      return;
    }
    this.reconnectAttempts += 1;
    const delayMs = Math.min(1000 * 2 ** (this.reconnectAttempts - 1), 16000);
    this.setStatus({
      status: 'error',
      error: `${message}. Nova tentativa em ${delayMs / 1000}s (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}).`,
    });
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openConnection();
    }, delayMs);
  }

  /** Cancela inscrições, encerra o cliente atual e invalida callbacks pendentes. */
  private closeClient(): void {
    this.clearReconnectTimer();
    this.generation += 1;
    const client = this.client;
    this.client = null;
    if (!client) return;
    try {
      if (client.isConnected()) {
        this.topics.forEach((topic) => client.unsubscribe(topic));
      }
      client.disconnect();
    } catch {
      // Cliente ainda não conectado: não há o que encerrar.
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(change: StatusChange): void {
    this.current = change;
    this.statusListeners.forEach((listener) => listener(change));
  }
}

export const mqttService = new MqttService();
