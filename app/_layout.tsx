import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { ServerReconnect } from '../components/ServerReconnect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const unstable_settings = {
  initialRouteName: 'LoginScreen',
};

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const prevSessionRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (loading) return;

    const prevSession = prevSessionRef.current;
    const currentSession = session ? session.user.id : null;

    // Zapisz aktualny stan
    prevSessionRef.current = currentSession;

    // Pierwsze uruchomienie (undefined → cokolwiek)
    if (prevSession === undefined) {
      if (session) {
        router.replace('/(tabs)/');
      } else {
        router.replace('/LoginScreen');
      }
      return;
    }

    // Zalogowano się (null → id)
    if (!prevSession && currentSession) {
      router.replace('/(tabs)/');
      return;
    }

    // Wylogowano się (id → null)
    if (prevSession && !currentSession) {
      router.replace('/LoginScreen');
      return;
    }

    // Token odświeżony (ten sam user) - nic nie rób
  }, [session, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D1A' }}>
        <ActivityIndicator size="large" color="#E94560" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen" />
      <Stack.Screen name="RegisterScreen" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="BookDetail"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#16213E' },
          headerTintColor: '#EAEAEA',
          headerTitle: 'Szczegoly ksiazki',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ServerReconnect>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ServerReconnect>
  );
}