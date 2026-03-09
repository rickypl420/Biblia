import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

function RootLayoutNav() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (session) {
      router.replace('/(tabs)/');
    } else {
      router.replace('/LoginScreen');
    }
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
          headerTitle: 'Szczegóły książki',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
