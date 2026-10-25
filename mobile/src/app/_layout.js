import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  NotoSansSinhala_400Regular,
  NotoSansSinhala_500Medium,
  NotoSansSinhala_600SemiBold,
  NotoSansSinhala_700Bold,
} from '@expo-google-fonts/noto-sans-sinhala';
import { I18nProvider, useI18n } from '../lib/i18n';
import { AuthProvider } from '../lib/auth';
import { colors, fonts } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { t } = useI18n();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: t('register') }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="instructor" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="categories" options={{ title: t('categories') }} />
      <Stack.Screen name="search" options={{ title: t('search') }} />
      <Stack.Screen name="favorites" options={{ title: t('favorites') }} />
      <Stack.Screen name="notifications" options={{ title: t('notifications') }} />
      <Stack.Screen name="plant/[id]" options={{ title: '' }} />
      <Stack.Screen name="garden/add" options={{ title: t('addPlant') }} />
      <Stack.Screen name="garden/[id]" options={{ title: t('timeline') }} />
      <Stack.Screen name="analysis/[id]" options={{ title: t('aiResultTitle') }} />
      <Stack.Screen name="recommendation/[id]" options={{ title: t('instructorFeedback') }} />
      <Stack.Screen name="settings" options={{ title: t('profile') }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NotoSansSinhala_400Regular,
    NotoSansSinhala_500Medium,
    NotoSansSinhala_600SemiBold,
    NotoSansSinhala_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootStack />
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
