import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MqttProvider, useMqtt } from './src/context/MqttContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

export type RootTabParamList = {
  Dashboard: undefined;
  Historico: undefined;
  Configuracoes: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>{icon}</Text>;
}

function AppContent() {
  const { theme, colors, ready: themeReady } = useTheme();
  const { ready: mqttReady } = useMqtt();
  const insets = useSafeAreaInsets();

  if (!themeReady || !mqttReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted }}>Carregando preferências...</Text>
      </View>
    );
  }

  const base = theme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIconStyle: styles.tabIconWrapper,
          tabBarStyle: { height: 58 + insets.bottom },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'IoT Control',
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Historico"
          component={HistoryScreen}
          options={{
            title: 'Histórico',
            tabBarIcon: ({ focused }) => <TabIcon icon="📜" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Configuracoes"
          component={SettingsScreen}
          options={{
            title: 'Configurações',
            tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MqttProvider>
          <AppContent />
        </MqttProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  tabIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  tabIconWrapper: {
    height: 24,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});
