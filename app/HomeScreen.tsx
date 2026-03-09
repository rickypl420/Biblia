import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const COLORS = {
  accent: '#E94560', secondary: '#16213E', surface: '#0F3460',
  text: '#EAEAEA', muted: '#8892A4', bg: '#0D0D1A',
  success: '#4CAF50', warning: '#FF9800', info: '#2196F3',
};

function StatCard({ icon, label, value, color }: any) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BookCard({ book, onPress }: any) {
  return (
    <TouchableOpacity style={styles.bookCard} onPress={() => onPress(book)}>
      <View style={styles.bookCover}>
        <Ionicons name="book" size={32} color={COLORS.accent} />
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{book.tytul}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {book.autorzy?.map((a: any) => a.imie_nazwisko).join(', ') || 'Nieznany autor'}
        </Text>
        <View style={styles.bookMeta}>
          <View style={[styles.badge, { backgroundColor: book.dostepne > 0 ? '#1a3a1a' : '#3a1a1a' }]}>
            <Text style={[styles.badgeText, { color: book.dostepne > 0 ? COLORS.success : COLORS.accent }]}>
              {book.dostepne > 0 ? `${book.dostepne} dostępna` : 'Wypożyczona'}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({ totalBooks: 0, available: 0, borrowed: 0, myBorrowings: 0 });
  const [recentBooks, setRecentBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [booksResult, egzResult, myBorrowResult] = await Promise.all([
        supabase.from('ksiazki').select('id').limit(1000),
        supabase.from('egzemplarze').select('status'),
        userProfile
          ? supabase.from('wypozyczenia').select('id').eq('id_uzytkownika', userProfile.id).is('data_zwrotu', null)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const total = booksResult.data?.length || 0;
      const available = egzResult.data?.filter((e: any) => e.status === 'dostepna').length || 0;
      const borrowed = egzResult.data?.filter((e: any) => e.status === 'wypozyczona').length || 0;
      const myBorrowings = (myBorrowResult as any).data?.length || 0;

      setStats({ totalBooks: total, available, borrowed, myBorrowings });

      const { data: books } = await supabase
        .from('ksiazki')
        .select(`
          id, tytul, isbn,
          ksiazki_autorzy(id_autora, autorzy(imie_nazwisko)),
          egzemplarze(status)
        `)
        .limit(10);

      if (books) {
        const enriched = books.map((b: any) => ({
          ...b,
          autorzy: b.ksiazki_autorzy?.map((ka: any) => ka.autorzy) || [],
          dostepne: b.egzemplarze?.filter((e: any) => e.status === 'dostepna').length || 0,
        }));
        setRecentBooks(enriched);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [userProfile]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleBookPress = (book: any) => {
    router.push({ pathname: '/BookDetail', params: { bookId: book.id } });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Dzień dobry' : hour < 18 ? 'Dzień dobry' : 'Dobry wieczór';
  const firstName = userProfile?.imie_nazwisko?.split(' ')[0] || 'Czytelniku';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
    >
      {/* Header */}
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
          </View>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.accent} />
            <Text style={styles.roleText}>{userProfile?.rola || 'czytelnik'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Stats */}
        <Text style={styles.sectionTitle}>Statystyki biblioteki</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <StatCard icon="library" label="Wszystkie książki" value={stats.totalBooks} color={COLORS.info} />
          <StatCard icon="checkmark-circle" label="Dostępne" value={stats.available} color={COLORS.success} />
          <StatCard icon="time" label="Wypożyczone" value={stats.borrowed} color={COLORS.warning} />
          <StatCard icon="person" label="Moje wypożyczenia" value={stats.myBorrowings} color={COLORS.accent} />
        </ScrollView>

        {/* Recent books */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Katalog książek</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/SearchScreen')}>
            <Text style={styles.seeAllText}>Zobacz wszystkie</Text>
          </TouchableOpacity>
        </View>

        {recentBooks.map((book) => (
          <BookCard key={book.id} book={book} onPress={handleBookPress} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  headerGradient: {
    backgroundColor: COLORS.secondary,
    paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    borderBottomWidth: 1, borderBottomColor: COLORS.surface,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 14, color: COLORS.muted, fontWeight: '500' },
  userName: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1a0a10', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.accent,
  },
  roleText: { fontSize: 11, color: COLORS.accent, fontWeight: '700', textTransform: 'uppercase' },
  content: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 8 },
  seeAllText: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  statsScroll: { marginBottom: 8 },
  statCard: {
    backgroundColor: COLORS.secondary, borderRadius: 14,
    padding: 16, marginRight: 12, minWidth: 120,
    borderLeftWidth: 3, alignItems: 'center', gap: 6,
  },
  statValue: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.muted, textAlign: 'center', fontWeight: '500' },
  bookCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.secondary, borderRadius: 14,
    padding: 14, marginBottom: 10, gap: 14,
    borderWidth: 1, borderColor: COLORS.surface,
  },
  bookCover: {
    width: 56, height: 72, borderRadius: 8,
    backgroundColor: '#1a0a10', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.accent,
  },
  bookInfo: { flex: 1, gap: 4 },
  bookTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  bookAuthor: { fontSize: 13, color: COLORS.muted },
  bookMeta: { flexDirection: 'row', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
