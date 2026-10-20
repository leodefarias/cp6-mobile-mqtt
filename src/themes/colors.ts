export type ThemeName = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  success: string;
  warning: string;
  danger: string;
  neutral: string;
  lampOn: string;
  lampOff: string;
  inputBackground: string;
}

export const colors: Record<ThemeName, ThemeColors> = {
  light: {
    background: '#F2F4F7',
    card: '#FFFFFF',
    text: '#101828',
    textMuted: '#667085',
    border: '#E4E7EC',
    primary: '#1D4ED8',
    primaryText: '#FFFFFF',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    neutral: '#98A2B3',
    lampOn: '#FACC15',
    lampOff: '#CBD5E1',
    inputBackground: '#F9FAFB',
  },
  dark: {
    background: '#0B1220',
    card: '#151E2E',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    border: '#263247',
    primary: '#3B82F6',
    primaryText: '#FFFFFF',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#F87171',
    neutral: '#64748B',
    lampOn: '#FDE047',
    lampOff: '#334155',
    inputBackground: '#0F1726',
  },
};
