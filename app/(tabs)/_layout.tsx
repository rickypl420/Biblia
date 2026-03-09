import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  accent: '#E94560', secondary: '#16213E', surface: '#0F3460',
  text: '#EAEAEA', muted: '#8892A4',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'index') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'SearchScreen') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'BorrowingsScreen') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'MyAccountScreen') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.secondary,
          borderTopColor: COLORS.surface,
          borderTopWidth: 1,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      })}
    >
      <Tabs.Screen name="index" options={{ tabBarLabel: 'Strona główna' }} />
      <Tabs.Screen name="SearchScreen" options={{ tabBarLabel: 'Szukaj' }} />
      <Tabs.Screen name="BorrowingsScreen" options={{ tabBarLabel: 'Wypożyczenia' }} />
      <Tabs.Screen name="MyAccountScreen" options={{ tabBarLabel: 'Konto' }} />
    </Tabs>
  );
}
