import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

const COLORS = {
  accent: '#E94560', secondary: '#16213E', surface: '#0F3460',
  text: '#EAEAEA', muted: '#8892A4', bg: '#0D0D1A',
  success: '#4CAF50',
};

function BookItem({ book, onPress }: any) {
  const available = book.egzemplarze?.filter((e: any) => e.status === 'dostepna').length || 0;
  const authors = book.ksiazki_autorzy?.map((ka: any) => ka.autorzy?.imie_nazwisko).filter(Boolean).join(', ') || 'Nieznany autor';
  const categories = book.ksiazki_kategorie?.map((kk: any) => kk.kategorie?.nazwa).filter(Boolean).join(', ');

  return (
    <TouchableOpacity style={styles.bookItem} onPress={() => onPress(book)}>
      <View style={styles.bookIcon}>
        <Ionicons name="book" size={28} color={COLORS.accent} />
      </View>
      <View style={styles.bookDetails}>
        <Text style={styles.bookTitle} numberOfLines={2}>{book.tytul}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>{authors}</Text>
        {categories ? <Text style={styles.bookCategory} numberOfLines={1}>{categories}</Text> : null}
        {book.isbn ? <Text style={styles.bookIsbn}>ISBN: {book.isbn}</Text> : null}
      </View>
      <View style={styles.bookRight}>
        <View style={[styles.availBadge, { backgroundColor: available > 0 ? '#0d2e0d' : '#2e0d0d' }]}>
          <Text style={[styles.availText, { color: available > 0 ? COLORS.success : COLORS.accent }]}>
            {available}
          </Text>
        </View>
        <Text style={styles.availLabel}>dostępnych</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.muted} style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    supabase.from('kategorie').select('*').order('nazwa').then(({ data }) => {
      if (data) setCategories(data);
    });
    doSearch('');
  }, []);

  const doSearch = useCallback(async (text: string, catId?: number | null) => {
    setLoading(true);
    setSearched(true);
    try {
      let q = supabase
        .from('ksiazki')
        .select(`
          id, tytul, isbn, opis,
          ksiazki_autorzy(autorzy(imie_nazwisko)),
          ksiazki_kategorie(kategorie(id, nazwa)),
          egzemplarze(status)
        `)
        .order('tytul');

      if (text.trim()) {
        q = q.ilike('tytul', `%${text.trim()}%`);
      }

      const { data } = await q.limit(50);
      let result = data || [];

      if (catId) {
        result = result.filter((b: any) =>
          b.ksiazki_kategorie?.some((kk: any) => kk.kategorie?.id === catId)
        );
      }

      setBooks(result);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.length === 0 || text.length >= 2) {
      doSearch(text, selectedCategory);
    }
  };

  const handleCategoryFilter = (catId: number | null) => {
    setSelectedCategory(catId);
    doSearch(query, catId);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleSearch}
            placeholder="Szukaj książki, autora, ISBN..."
            placeholderTextColor={COLORS.muted}
            autoCorrect={false}
          />
          {query ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category filters */}
      <View style={styles.filtersSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, nazwa: 'Wszystkie' }, ...categories]}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === item.id && styles.filterChipActive]}
              onPress={() => handleCategoryFilter(item.id)}
            >
              <Text style={[styles.filterChipText, selectedCategory === item.id && styles.filterChipTextActive]}>
                {item.nazwa}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <BookItem book={item} onPress={(b: any) => router.push({ pathname: '/BookDetail', params: { bookId: b.id } })} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searched ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={56} color={COLORS.muted} />
                <Text style={styles.emptyTitle}>Brak wyników</Text>
                <Text style={styles.emptySubtitle}>Spróbuj innej frazy lub zmień filtr</Text>
              </View>
            ) : null
          }
          ListHeaderComponent={
            !loading && books.length > 0 ? (
              <Text style={styles.resultsCount}>{books.length} {books.length === 1 ? 'wynik' : 'wyników'}</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  searchContainer: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: COLORS.secondary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg, borderRadius: 12,
    paddingHorizontal: 14, gap: 10, height: 48,
    borderWidth: 1, borderColor: COLORS.surface,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 16 },
  filtersSection: { backgroundColor: COLORS.secondary, paddingBottom: 12 },
  filtersList: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.surface,
  },
  filterChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterChipText: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 8 },
  resultsCount: { fontSize: 13, color: COLORS.muted, marginBottom: 8, paddingLeft: 4 },
  bookItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.secondary, borderRadius: 14,
    padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: COLORS.surface,
  },
  bookIcon: {
    width: 52, height: 68, borderRadius: 8,
    backgroundColor: '#1a0a10', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#3a1520',
  },
  bookDetails: { flex: 1, gap: 3 },
  bookTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  bookAuthor: { fontSize: 13, color: COLORS.muted },
  bookCategory: { fontSize: 12, color: '#7FB3D3' },
  bookIsbn: { fontSize: 11, color: '#666' },
  bookRight: { alignItems: 'center', gap: 2 },
  availBadge: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  availText: { fontSize: 16, fontWeight: '800' },
  availLabel: { fontSize: 9, color: COLORS.muted, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.muted },
});
