import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
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

function BorrowCard({ item, onReturn, onPress }: any) {
  const isOverdue = !item.data_zwrotu && new Date(item.termin_zwrotu) < new Date();
  const daysLeft = Math.ceil((new Date(item.termin_zwrotu).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isReturned = !!item.data_zwrotu;

  const statusColor = isReturned ? COLORS.success : isOverdue ? COLORS.error : daysLeft <= 3 ? COLORS.warning : COLORS.success;
  const statusText = isReturned ? 'Zwrócona' : isOverdue ? `Opóźnienie ${Math.abs(daysLeft)} dni` : `${daysLeft} dni do zwrotu`;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardBookIcon}>
            <Ionicons name="book" size={22} color={COLORS.accent} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.egzemplarze?.ksiazki?.tytul || 'Nieznana książka'}
            </Text>
            <Text style={styles.cardAuthor}>
              {item.egzemplarze?.ksiazki?.ksiazki_autorzy
                ?.map((ka: any) => ka.autorzy?.imie_nazwisko)
                .filter(Boolean)
                .join(', ') || 'Nieznany autor'}
            </Text>
          </View>
        </View>

        <View style={styles.cardDates}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.muted} />
            <Text style={styles.dateText}>
              Wypożyczona: {new Date(item.data_wypozyczenia).toLocaleDateString('pl-PL')}
            </Text>
          </View>
          <View style={styles.dateItem}>
            <Ionicons name="alarm-outline" size={14} color={COLORS.muted} />
            <Text style={styles.dateText}>
              Termin: {new Date(item.termin_zwrotu).toLocaleDateString('pl-PL')}
            </Text>
          </View>
          {isReturned && (
            <View style={styles.dateItem}>
              <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.success} />
              <Text style={[styles.dateText, { color: COLORS.success }]}>
                Zwrócona: {new Date(item.data_zwrotu).toLocaleDateString('pl-PL')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          {!isReturned && (
            <TouchableOpacity style={styles.returnButton} onPress={() => onReturn(item)}>
              <Text style={styles.returnButtonText}>Zwróć</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function BorrowingsScreen() {
  const { userProfile } = useAuth();
  const [active, setActive] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const loadBorrowings = useCallback(async () => {
    if (!userProfile) return;
    try {
      const { data } = await supabase
        .from('wypozyczenia')
        .select(`
          id, data_wypozyczenia, termin_zwrotu, data_zwrotu,
          egzemplarze(
            id, status,
            ksiazki(
              id, tytul,
              ksiazki_autorzy(autorzy(imie_nazwisko))
            )
          )
        `)
        .eq('id_uzytkownika', userProfile.id)
        .order('data_wypozyczenia', { ascending: false });

      if (data) {
        setActive(data.filter((b: any) => !b.data_zwrotu));
        setHistory(data.filter((b: any) => b.data_zwrotu));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProfile]);

  useEffect(() => { loadBorrowings(); }, [loadBorrowings]);

const handleReturn = async (item: any) => {
  const confirmed = window.confirm(`Czy chcesz zwrócić "${item.egzemplarze?.ksiazki?.tytul}"?`);
  if (!confirmed) return;

  const now = new Date().toISOString();
  await supabase.from('wypozyczenia').update({ data_zwrotu: now }).eq('id', item.id);
  await supabase.from('egzemplarze').update({ status: 'dostepna' }).eq('id', item.egzemplarze.id);
  await supabase.from('historia_egzemplarzy').insert({
    id_egzemplarza: item.egzemplarze.id,
    opis_zdarzenia: `Zwrócona przez użytkownika ${userProfile?.id}`,
    data_zdarzenia: now,
  });
  loadBorrowings();
  window.alert('✅ Zwrócono pomyślnie!');
};

  const handlePress = (item: any) => {
    if (item.egzemplarze?.ksiazki?.id) {
      router.push({ pathname: '/BookDetail', params: { bookId: item.egzemplarze.ksiazki.id } });
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const displayItems = tab === 'active' ? active : history;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Moje wypożyczenia</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'active' && styles.tabActive]}
            onPress={() => setTab('active')}
          >
            <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
              Aktywne ({active.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'history' && styles.tabActive]}
            onPress={() => setTab('history')}
          >
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
              Historia ({history.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBorrowings(); }} tintColor={COLORS.accent} />}
      >
        {displayItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>
              {tab === 'active' ? 'Brak aktywnych wypożyczeń' : 'Brak historii wypożyczeń'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tab === 'active' ? 'Wypożycz swoją pierwszą książkę!' : 'Twoja historia będzie tu widoczna'}
            </Text>
            {tab === 'active' && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/SearchScreen')}
              >
                <Text style={styles.emptyButtonText}>Przeglądaj katalog</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayItems.map((item) => (
            <BorrowCard
              key={item.id}
              item={item}
              onReturn={handleReturn}
              onPress={handlePress}
            />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.secondary, paddingTop: 56, paddingHorizontal: 20,
    paddingBottom: 0, borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    borderBottomWidth: 1, borderBottomColor: COLORS.surface,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 4 },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.accent },
  tabText: { fontSize: 14, color: COLORS.muted, fontWeight: '600' },
  tabTextActive: { color: COLORS.accent },
  list: { flex: 1, padding: 16 },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.secondary,
    borderRadius: 14, marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.surface,
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', gap: 10 },
  cardBookIcon: {
    width: 44, height: 56, borderRadius: 8,
    backgroundColor: '#1a0a10', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#3a1520',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardAuthor: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  cardDates: { gap: 4 },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: COLORS.muted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  returnButton: {
    backgroundColor: COLORS.accent, paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20,
  },
  returnButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.muted, textAlign: 'center' },
  emptyButton: {
    backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 24, marginTop: 8,
  },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
