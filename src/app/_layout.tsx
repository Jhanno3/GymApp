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
import { useProfileRole } from '@/hooks/use-profile-role';
import { useSession } from '@/hooks/use-session';

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
  const { session, isLoading: isSessionLoading } = useSession();
  const { role, isLoading: isRoleLoading } = useProfileRole(session?.user.id);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!isAppReady || isSessionLoading || (session && isRoleLoading)) return;

    const timer = setTimeout(() => setShowSplash(false), READY_LOGO_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isAppReady, isSessionLoading, isRoleLoading, session]);

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
            }}>
            <Stack.Protected guard={!session}>
              <Stack.Screen name="index" />
              <Stack.Screen name="register" />
            </Stack.Protected>

            <Stack.Protected guard={!!session && role === 'client'}>
              <Stack.Screen name="(app)" />
              <Stack.Screen name="scan" options={{ presentation: 'modal' }} />
            </Stack.Protected>

            <Stack.Protected guard={!!session && role === 'admin'}>
              <Stack.Screen name="(gym)" />
            </Stack.Protected>
          </Stack>
        </ThemeProvider>
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}
