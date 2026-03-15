import { Tabs, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAppAlert } from '../../components/AppAlert';

const COLORS = {
  accent: '#E94560', secondary: '#16213E', surface: '#0F3460',
  text: '#EAEAEA', muted: '#8892A4', bg: '#0D0D1A',
};

const NAV_ITEMS = [
  { name: 'index', path: '/(tabs)/', label: 'Strona glowna', icon: 'home', iconOutline: 'home-outline' },
  { name: 'SearchScreen', path: '/(tabs)/SearchScreen', label: 'Szukaj', icon: 'search', iconOutline: 'search-outline' },
  { name: 'BorrowingsScreen', path: '/(tabs)/BorrowingsScreen', label: 'Wypozyczenia', icon: 'book', iconOutline: 'book-outline' },
  { name: 'MyAccountScreen', path: '/(tabs)/MyAccountScreen', label: 'Konto', icon: 'person', iconOutline: 'person-outline' },
];

function Sidebar() {
  const { userProfile, signOut } = useAuth();
  const pathname = usePathname();
  const { showAlert, alertComponent } = useAppAlert();

  const handleSignOut = () => {
    showAlert(
      'Wylogowanie',
      'Czy na pewno chcesz sie wylogowac?',
      [
        { text: 'Anuluj', onPress: () => {}, style: 'cancel' },
        { text: 'Wyloguj', onPress: () => signOut(), style: 'destructive' },
      ],
      'warning'
    );
  };

  return (
    <View style={styles.sidebar}>
      {alertComponent}
      <View style={styles.sidebarLogo}>
        <View style={styles.logoIcon}>
          <Ionicons name="library" size={28} color={COLORS.accent} />
        </View>
        <Text style={styles.logoText}>Biblioteka</Text>
      </View>

      {userProfile && (
        <View style={styles.sidebarUser}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {userProfile.imie_nazwisko?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{userProfile.imie_nazwisko}</Text>
            <Text style={styles.userRole}>{userProfile.rola}</Text>
          </View>
        </View>
      )}

      <View style={styles.sidebarDivider} />

      <View style={styles.sidebarNav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.name === 'index' && (pathname === '/' || pathname === '/(tabs)'));
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
              onPress={() => router.push(item.path as any)}
            >
              <Ionicons
                name={(isActive ? item.icon : item.iconOutline) as any}
                size={20}
                color={isActive ? COLORS.accent : COLORS.muted}
              />
              <Text style={[styles.sidebarItemText, isActive && styles.sidebarItemTextActive]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.muted} />
        <Text style={styles.signOutText}>Wyloguj sie</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={styles.rootContainer}>
      {isDesktop && <Sidebar />}
      <View style={styles.contentWrapper}>
        <Tabs
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              const item = NAV_ITEMS.find(i => i.name === route.name);
              return <Ionicons name={(focused ? item?.icon : item?.iconOutline) as any} size={size} color={color} />;
            },
            tabBarActiveTintColor: COLORS.accent,
            tabBarInactiveTintColor: COLORS.muted,
            tabBarStyle: isDesktop ? { display: 'none' } : {
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
          <Tabs.Screen name="index" options={{ tabBarLabel: 'Strona glowna' }} />
          <Tabs.Screen name="SearchScreen" options={{ tabBarLabel: 'Szukaj' }} />
          <Tabs.Screen name="BorrowingsScreen" options={{ tabBarLabel: 'Wypozyczenia' }} />
          <Tabs.Screen name="MyAccountScreen" options={{ tabBarLabel: 'Konto' }} />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.bg },
  contentWrapper: { flex: 1, backgroundColor: COLORS.bg },
  sidebar: {
    width: 240, backgroundColor: COLORS.secondary,
    borderRightWidth: 1, borderRightColor: COLORS.surface,
    paddingVertical: 24, paddingHorizontal: 16,
  },
  sidebarLogo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingHorizontal: 8 },
  logoIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#1a0a10', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.accent,
  },
  logoText: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  sidebarUser: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bg, borderRadius: 12, padding: 12, marginBottom: 16,
  },
  userAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center',
  },
  userAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  userInfo: { flex: 1 },
  userName: { color: COLORS.text, fontWeight: '700', fontSize: 13 },
  userRole: { color: COLORS.muted, fontSize: 11, textTransform: 'uppercase', marginTop: 2 },
  sidebarDivider: { height: 1, backgroundColor: COLORS.surface, marginBottom: 16 },
  sidebarNav: { gap: 4 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  sidebarItemActive: { backgroundColor: '#1a0a10' },
  sidebarItemText: { fontSize: 14, color: COLORS.muted, fontWeight: '600', flex: 1 },
  sidebarItemTextActive: { color: COLORS.accent },
  activeIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.accent },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    marginTop: 8, borderWidth: 1, borderColor: COLORS.surface,
  },
  signOutText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
});
