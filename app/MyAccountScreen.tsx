import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useAppAlert } from '../components/AppAlert';

const COLORS = {
  accent: '#E94560', secondary: '#16213E', surface: '#0F3460',
  text: '#EAEAEA', muted: '#8892A4', bg: '#0D0D1A',
  success: '#4CAF50', error: '#FF5252',
};

export default function MyAccountScreen() {
  const { userProfile, signOut } = useAuth();
  const [stats, setStats] = useState({ aktywne: 0, wszystkie: 0, przetrzymane: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showAlert, alertComponent } = useAppAlert();

  useEffect(() => {
    if (!userProfile) return;
    fetchStats();
  }, [userProfile]);

  const fetchStats = async () => {
    const { data } = await supabase
      .from('wypozyczenia')
      .select('id, termin_zwrotu, data_zwrotu')
      .eq('id_uzytkownika', userProfile.id);

    if (data) {
      const aktywne = data.filter(w => !w.data_zwrotu).length;
      const przetrzymane = data.filter(w => !w.data_zwrotu && new Date(w.termin_zwrotu) < new Date()).length;
      setStats({ aktywne, wszystkie: data.length, przetrzymane });
    }
    setLoading(false);
    setRefreshing(false);
  };

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

  if (!userProfile || loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor={COLORS.accent} />}
    >
      {alertComponent}

      <View style={styles.header}>
        <Text style={styles.title}>Moje konto</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userProfile.imie_nazwisko?.charAt(0)?.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{userProfile.imie_nazwisko}</Text>
        <Text style={styles.email}>{userProfile.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{userProfile.rola?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Aktywne', value: stats.aktywne, icon: 'book-outline', color: COLORS.accent },
          { label: 'Wszystkie', value: stats.wszystkie, icon: 'library-outline', color: COLORS.surface },
          { label: 'Przetrzymane', value: stats.przetrzymane, icon: 'warning-outline', color: stats.przetrzymane > 0 ? COLORS.error : COLORS.muted },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Ionicons name={s.icon as any} size={22} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informacje</Text>
        {[
          { icon: 'person-outline', label: 'Imie i nazwisko', value: userProfile.imie_nazwisko },
          { icon: 'mail-outline', label: 'Email', value: userProfile.email },
          { icon: 'shield-outline', label: 'Rola', value: userProfile.rola },
        ].map((row, i) => (
          <View key={i} style={styles.infoRow}>
            <Ionicons name={row.icon as any} size={18} color={COLORS.muted} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.signOutText}>Wyloguj sie</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  profileCard: {
    backgroundColor: COLORS.secondary, borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.surface,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  email: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  roleBadge: {
    marginTop: 10, backgroundColor: COLORS.surface,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 4,
  },
  roleText: { fontSize: 12, color: COLORS.muted, fontWeight: '700', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: COLORS.secondary, borderRadius: 12, padding: 14,
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.surface,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.muted, textAlign: 'center' },
  section: { backgroundColor: COLORS.secondary, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.surface },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.surface,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: COLORS.text, marginTop: 2, fontWeight: '600' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.error, borderRadius: 12,
    paddingVertical: 14, marginBottom: 32,
  },
  signOutText: { color: COLORS.error, fontSize: 15, fontWeight: '700' },
});
