import { LampState, LampStatePayload, SensorPayload } from '../types/mqtt';

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function isLampState(value: unknown): value is LampState {
  return value === 'ON' || value === 'OFF';
}

// Aceita {"value": 24.5}. Retorna null para qualquer payload inválido.
export function parseSensorPayload(raw: string): SensorPayload | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const { value } = obj;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return { value };
}

// Aceita {"state": "ON"} ou {"state": "OFF"}.
export function parseLampStatePayload(raw: string): LampStatePayload | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const state = typeof obj.state === 'string' ? obj.state.toUpperCase() : obj.state;
  if (!isLampState(state)) return null;
  return { state };
}

// Paho exige um caminho na URL (ex.: wss://host:8884/mqtt ou wss://host:8081/).
export function validateBrokerUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!/^wss?:\/\//i.test(trimmed)) {
    return 'A URL deve começar com ws:// ou wss://';
  }
  if (!/^wss?:\/\/[^/:]+(:\d+)?\/.*$/i.test(trimmed)) {
    return 'Formato esperado: wss://host:porta/caminho (ex.: wss://broker.hivemq.com:8884/mqtt)';
  }
  return null;
}
