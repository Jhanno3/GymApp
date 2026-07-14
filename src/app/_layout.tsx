import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppSplashScreen } from '@/components/splash-screen';
import { Colors } from '@/constants/theme';
import { useAppReady } from '@/hooks/use-app-ready';

SystemUI.setBackgroundColorAsync(Colors.background);
SplashScreen.preventAutoHideAsync();

const NavigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    border: Colors.border,
    text: Colors.text,
    primary: Colors.primary,
  },
};

const READY_LOGO_DELAY_MS = 900;

export default function RootLayout() {
  const isAppReady = useAppReady();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!isAppReady) return;

    const timer = setTimeout(() => setShowSplash(false), READY_LOGO_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isAppReady]);

  if (showSplash) {
    return <AppSplashScreen ready={isAppReady} />;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ThemeProvider value={NavigationDarkTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
            }}
          />
        </ThemeProvider>
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}
