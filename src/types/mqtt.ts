export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type LampState = 'ON' | 'OFF';

export type MessageDirection = 'sent' | 'received';

export interface SensorReading {
  value: number;
  receivedAt: Date;
}

export interface LampReading {
  state: LampState;
  receivedAt: Date;
}

export interface HistoryEntry {
  id: string;
  topic: string;
  payload: string;
  direction: MessageDirection;
  timestamp: Date;
  valid: boolean;
}

export interface IncomingMessage {
  topic: string;
  payload: string;
}

export interface StatusChange {
  status: ConnectionStatus;
  error?: string;
}

export type StatusListener = (change: StatusChange) => void;
export type MessageListener = (message: IncomingMessage) => void;
export type Unsubscribe = () => void;

// Payloads validados
export interface SensorPayload {
  value: number;
}

export interface LampStatePayload {
  state: LampState;
}

export interface LampCommandPayload {
  action: LampState;
}
