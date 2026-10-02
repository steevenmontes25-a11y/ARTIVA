import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthModal } from '../src/components/auth/AuthModal';
import { WebFrame } from '../src/components/WebFrame';
import { useAuthStore } from '../src/store/authStore';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { useAppFonts } from '../src/theme/typography';

export default function RootLayout(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider>
        {/* Wrapper único para toda la app (loading incluido) — sin efecto en
            nativo, ver WebFrame.tsx. */}
        <WebFrame>
          <RootNavigator />
        </WebFrame>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator(): React.JSX.Element {
  const { colors, colorScheme, typography } = useTheme();
  const [fontsLoaded, fontError] = useAppFonts();

  const segments = useSegments();
  const router = useRouter();

  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const onboardingCompleted = useAuthStore((state) => state.user?.onboarding_completed ?? false);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    // Los invitados (sin sesión) navegan libremente por toda la app — ya no
    // se los fuerza a (auth) al interactuar. El login solo se pide al
    // intentar una acción protegida (ver useRequireAuth / AuthModal) o al
    // tocar un tab que lo requiere (ver (tabs)/_layout.tsx).
    //
    // Esta regla cubre únicamente el aterrizaje inicial en frío: con grupos
    // hermanos sin ruta ("(tabs)", "(auth)", "(onboarding)") el resolver de
    // rutas de expo-router no siempre respeta `initialRouteName` del Stack
    // para decidir a qué grupo mapea "/" — en la práctica cayó en (auth).
    // Como ningún flujo actual navega deliberadamente a (auth) para un
    // invitado (ese flujo ahora es el modal), cualquier invitado que
    // aparezca ahí es justamente ese aterrizaje por defecto mal resuelto.
    if (!isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
      return;
    }

    if (isAuthenticated && !onboardingCompleted && !inOnboardingGroup) {
      router.replace('/(onboarding)');
      return;
    }

    if (isAuthenticated && onboardingCompleted && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)');
    }
  }, [isHydrated, isAuthenticated, onboardingCompleted, segments, router]);

  if (!isHydrated || (!fontsLoaded && !fontError)) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontFamily: typography.h3.fontFamily },
          contentStyle: { backgroundColor: colors.background },
        }}
        initialRouteName="(tabs)"
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
      </Stack>
      <AuthModal />
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
