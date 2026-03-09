import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const COLORS = {
  accent: '#E94560', secondary: '#16213E', surface: '#0F3460',
  text: '#EAEAEA', muted: '#8892A4', bg: '#0D0D1A',
  success: '#4CAF50', warning: '#FF9800', error: '#FF5252',
};

function FineCard({ fine }: any) {
  return (
    <View style={styles.fineCard}>
      <View style={styles.fineLeft}>
        <Ionicons name="warning" size={20} color={COLORS.error} />
        <View>
          <Text style={styles.fineTitle} numberOfLines={1}>
            {fine.tytul || 'Nieznana książka'}
          </Text>
          <Text style={styles.fineDetails}>
            Spóźnienie: {fine.daysLate} {fine.daysLate === 1 ? 'dzień' : 'dni'}
          </Text>
        </View>
      </View>
      <View style={styles.fineRight}>
        <Text style={styles.fineAmount}>{fine.kwota.toFixed(2)} zł</Text>
      </View>
    </View>
  );
}

export default function MyAccountScreen() {
  const { userProfile, signOut } = useAuth();
  const [fines, setFines] = useState<any[]>([]);
  const [totalFine, setTotalFine] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, returned: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!userProfile) return;
    try {
      // Load all borrowings
      const { data: borrowings } = await supabase
        .from('wypozyczenia')
        .select(`
          id, data_wypozyczenia, termin_zwrotu, data_zwrotu,
          egzemplarze(
            id,
            ksiazki(
              id, tytul,
              ksiazki_ceny(id_ceny, data_obowiazywania, ceny(kwota))
            )
          )
        `)
        .eq('id_uzytkownika', userProfile.id);

      if (!borrowings) return;

      const total = borrowings.length;
      const active = borrowings.filter((b: any) => !b.data_zwrotu).length;
      const returned = borrowings.filter((b: any) => b.data_zwrotu).length;
      setStats({ total, active, returned });

      // Calculate fines: (Data - Termin) * 10% ceny
      const now = new Date();
      const computed: any[] = [];

      for (const b of borrowings) {
        if (b.data_zwrotu) continue; // already returned, no fine
        const termin = new Date(b.termin_zwrotu);
        if (now <= termin) continue; // not overdue

        const daysLate = Math.ceil((now.getTime() - termin.getTime()) / (1000 * 60 * 60 * 24));
        const ksiazka = b.egzemplarze?.ksiazki;
        const latestCena = ksiazka?.ksiazki_ceny
          ?.sort((a: any, c: any) => new Date(c.data_obowiazywania).getTime() - new Date(a.data_obowiazywania).getTime())
          ?.[0]?.ceny?.kwota || 0;

        const kwota = daysLate * (latestCena * 0.1);

        computed.push({
          id: b.id,
          tytul: ksiazka?.tytul,
          daysLate,
          kwota,
          cena: latestCena,
        });
      }

      setFines(computed);
      setTotalFine(computed.reduce((sum, f) => sum + f.kwota, 0));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProfile]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSignOut = () => {
    Alert.alert('Wylogowanie', 'Czy na pewno chcesz się wylogować?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyloguj', style: 'destructive', onPress: signOut },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const avatarLetter = userProfile?.imie_nazwisko?.charAt(0)?.toUpperCase() || '?';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.accent} />}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{avatarLetter}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{userProfile?.imie_nazwisko || 'Użytkownik'}</Text>
          <Text style={styles.userEmail}>{userProfile?.email}</Text>
          <View style={styles.rolePill}>
            <Ionicons name="shield-checkmark" size={12} color={COLORS.accent} />
            <Text style={styles.roleText}>{userProfile?.rola || 'czytelnik'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Fines section — prominent */}
        {fines.length > 0 && (
          <View style={styles.finesSection}>
            <View style={styles.finesHeader}>
              <Ionicons name="warning" size={22} color={COLORS.error} />
              <Text style={styles.finesTitle}>Kary za przetrzymanie</Text>
            </View>
            {fines.map((fine) => (
              <FineCard key={fine.id} fine={fine} />
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Łączna kara:</Text>
              <Text style={styles.totalAmount}>{totalFine.toFixed(2)} zł</Text>
            </View>
            <Text style={styles.fineFormula}>
              Obliczenie: (Data – Termin) × 10% wartości książki
            </Text>
          </View>
        )}

        {fines.length === 0 && (
          <View style={styles.noFinesCard}>
            <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
            <Text style={styles.noFinesText}>Brak kar — wszystko w porządku!</Text>
          </View>
        )}

        {/* Stats */}
        <Text style={styles.sectionTitle}>Statystyki</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Wszystkich wypożyczeń</Text>
          </View>
          <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: COLORS.surface }]}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Aktywnych</Text>
          </View>
          <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: COLORS.surface }]}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.returned}</Text>
            <Text style={styles.statLabel}>Zwróconych</Text>
          </View>
        </View>

        {/* Menu */}
        <Text style={styles.sectionTitle}>Konto</Text>
        <View style={styles.menuCard}>
          {[
            {
              icon: 'book-outline',
              label: 'Moje wypożyczenia',
              onPress: () => router.push('/(tabs)/BorrowingsScreen'),
              color: COLORS.accent,
            },
            {
              icon: 'search-outline',
              label: 'Szukaj książek',
              onPress: () => router.push('/(tabs)/SearchScreen'),
              color: '#7FB3D3',
            },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[styles.menuItem, i > 0 && styles.menuItemBorder]} onPress={item.onPress}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.signOutText}>Wyloguj się</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  profileHeader: {
    backgroundColor: COLORS.secondary, paddingTop: 56, paddingBottom: 28,
    paddingHorizontal: 24, flexDirection: 'row', gap: 16, alignItems: 'center',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  avatar: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
  avatarLetter: { fontSize: 28, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  userEmail: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
    backgroundColor: '#1a0a10', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: COLORS.accent,
  },
  roleText: { fontSize: 11, color: COLORS.accent, fontWeight: '700', textTransform: 'uppercase' },
  content: { padding: 20 },
  finesSection: {
    backgroundColor: '#1a0505', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.error + '44',
  },
  finesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  finesTitle: { fontSize: 16, fontWeight: '800', color: COLORS.error },
  fineCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#250808', borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#3a1010',
  },
  fineLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  fineTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, maxWidth: 160 },
  fineDetails: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  fineRight: {},
  fineAmount: { fontSize: 16, fontWeight: '800', color: COLORS.error },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#3a1010', marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  totalAmount: { fontSize: 22, fontWeight: '900', color: COLORS.error },
  fineFormula: { fontSize: 11, color: COLORS.muted, marginTop: 6, fontStyle: 'italic' },
  noFinesCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0d1a0d', borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.success + '44',
  },
  noFinesText: { fontSize: 14, color: COLORS.success, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 4 },
  statsGrid: {
    flexDirection: 'row', backgroundColor: COLORS.secondary, borderRadius: 14,
    padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.surface,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.muted, textAlign: 'center', fontWeight: '500' },
  menuCard: {
    backgroundColor: COLORS.secondary, borderRadius: 14, marginBottom: 20,
    borderWidth: 1, borderColor: COLORS.surface, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: COLORS.surface },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '600' },
  signOutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1a0505', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.error + '44',
  },
  signOutText: { fontSize: 15, color: COLORS.error, fontWeight: '700' },
});
