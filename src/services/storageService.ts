import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeName } from '../themes/colors';

const KEYS = {
  brokerUrl: '@iotcontrol:brokerUrl',
  theme: '@iotcontrol:theme',
} as const;

export async function getBrokerUrl(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.brokerUrl);
  } catch (error) {
    console.warn('Falha ao ler URL do broker', error);
    return null;
  }
}

export async function setBrokerUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.brokerUrl, url);
  } catch (error) {
    console.warn('Falha ao salvar URL do broker', error);
  }
}

export async function getTheme(): Promise<ThemeName | null> {
  try {
    const value = await AsyncStorage.getItem(KEYS.theme);
    return value === 'light' || value === 'dark' ? value : null;
  } catch (error) {
    console.warn('Falha ao ler tema', error);
    return null;
  }
}

export async function setTheme(theme: ThemeName): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.theme, theme);
  } catch (error) {
    console.warn('Falha ao salvar tema', error);
  }
}
