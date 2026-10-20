import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import {
  COMMAND_TIMEOUT_MS,
  DEFAULT_BROKER_URL,
  HISTORY_LIMIT,
  SUBSCRIBED_TOPICS,
  TOPICS,
} from '../config/topics';
import { mqttService } from '../services/mqttService';
import { getBrokerUrl, setBrokerUrl as persistBrokerUrl } from '../services/storageService';
import {
  ConnectionStatus,
  HistoryEntry,
  IncomingMessage,
  LampCommandPayload,
  LampReading,
  LampState,
  MessageDirection,
  SensorReading,
} from '../types/mqtt';
import { parseLampStatePayload, parseSensorPayload } from '../utils/parsePayload';

export interface CommandResult {
  ok: boolean;
  message: string;
}

interface MqttContextValue {
  ready: boolean;
  brokerUrl: string;
  status: ConnectionStatus;
  error: string | null;
  temperature: SensorReading | null;
  humidity: SensorReading | null;
  lamp: LampReading | null;
  pendingCommand: LampState | null;
  commandWarning: string | null;
  history: HistoryEntry[];
  connect: (url?: string) => void;
  disconnect: () => void;
  reconnect: () => void;
  saveBrokerUrl: (url: string) => Promise<void>;
  sendLampCommand: (action: LampState) => CommandResult;
  clearHistory: () => void;
}

const MqttContext = createContext<MqttContextValue | null>(null);

let entryCounter = 0;
function createEntry(
  topic: string,
  payload: string,
  direction: MessageDirection,
  valid: boolean,
): HistoryEntry {
  entryCounter += 1;
  return { id: `${Date.now()}-${entryCounter}`, topic, payload, direction, valid, timestamp: new Date() };
}

export function MqttProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [brokerUrl, setBrokerUrl] = useState(DEFAULT_BROKER_URL);
  const [status, setStatus] = useState<ConnectionStatus>(mqttService.getStatus());
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<SensorReading | null>(null);
  const [humidity, setHumidity] = useState<SensorReading | null>(null);
  const [lamp, setLamp] = useState<LampReading | null>(null);
  const [pendingCommand, setPendingCommand] = useState<LampState | null>(null);
  const [commandWarning, setCommandWarning] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const commandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToHistory = (entry: HistoryEntry) => {
    setHistory((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT));
  };

  const clearCommandTimer = () => {
    if (commandTimer.current) {
      clearTimeout(commandTimer.current);
      commandTimer.current = null;
    }
  };

  // Registra os listeners do serviço uma única vez e os remove na desmontagem.
  useEffect(() => {
    const handleMessage = ({ topic, payload }: IncomingMessage) => {
      const now = new Date();
      let valid = false;

      if (topic === TOPICS.temperature || topic === TOPICS.humidity) {
        const parsed = parseSensorPayload(payload);
        if (parsed) {
          valid = true;
          const reading = { value: parsed.value, receivedAt: now };
          if (topic === TOPICS.temperature) setTemperature(reading);
          else setHumidity(reading);
        }
      } else if (topic === TOPICS.lampState) {
        const parsed = parseLampStatePayload(payload);
        if (parsed) {
          valid = true;
          setLamp({ state: parsed.state, receivedAt: now });
          setPendingCommand(null);
          setCommandWarning(null);
          clearCommandTimer();
        }
      }

      if (!valid) console.warn(`Mensagem inválida ignorada em ${topic}: ${payload}`);
      addToHistory(createEntry(topic, payload, 'received', valid));
    };

    const offStatus = mqttService.onStatus((change) => {
      setStatus(change.status);
      setError(change.error ?? null);
      if (change.status !== 'connected') {
        setPendingCommand(null);
        clearCommandTimer();
      }
    });
    const offMessage = mqttService.onMessage(handleMessage);

    return () => {
      offStatus();
      offMessage();
      clearCommandTimer();
      mqttService.disconnect();
    };
  }, []);

  // Recupera a URL salva e conecta automaticamente ao iniciar.
  useEffect(() => {
    let active = true;
    getBrokerUrl().then((saved) => {
      if (!active) return;
      const url = saved ?? DEFAULT_BROKER_URL;
      setBrokerUrl(url);
      setReady(true);
      mqttService.connect(url, SUBSCRIBED_TOPICS);
    });
    return () => {
      active = false;
    };
  }, []);

  const connect = (url?: string) => {
    mqttService.connect(url ?? brokerUrl, SUBSCRIBED_TOPICS);
  };

  const saveBrokerUrl = async (url: string) => {
    setBrokerUrl(url);
    await persistBrokerUrl(url);
  };

  const sendLampCommand = (action: LampState): CommandResult => {
    if (!mqttService.isConnected()) {
      return { ok: false, message: 'Sem conexão com o broker. Conecte-se antes de enviar comandos.' };
    }
    const command: LampCommandPayload = { action };
    const payload = JSON.stringify(command);
    if (!mqttService.publish(TOPICS.lampCommand, payload)) {
      return { ok: false, message: 'Não foi possível publicar o comando. Tente novamente.' };
    }
    addToHistory(createEntry(TOPICS.lampCommand, payload, 'sent', true));
    setPendingCommand(action);
    setCommandWarning(null);
    clearCommandTimer();
    commandTimer.current = setTimeout(() => {
      commandTimer.current = null;
      setPendingCommand(null);
      setCommandWarning('O dispositivo não confirmou o comando. Verifique se o simulador está em execução.');
    }, COMMAND_TIMEOUT_MS);
    return { ok: true, message: `Comando ${action === 'ON' ? 'Ligar' : 'Desligar'} enviado. Aguardando confirmação...` };
  };

  const value: MqttContextValue = {
    ready,
    brokerUrl,
    status,
    error,
    temperature,
    humidity,
    lamp,
    pendingCommand,
    commandWarning,
    history,
    connect,
    disconnect: () => mqttService.disconnect(),
    reconnect: () => mqttService.reconnect(),
    saveBrokerUrl,
    sendLampCommand,
    clearHistory: () => setHistory([]),
  };

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
}

export function useMqtt(): MqttContextValue {
  const context = useContext(MqttContext);
  if (!context) throw new Error('useMqtt deve ser usado dentro de MqttProvider');
  return context;
}
