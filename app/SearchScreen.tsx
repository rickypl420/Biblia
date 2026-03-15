import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { router, useFocusEffect } from 'expo-router';

const COLORS = {
  accent: '#E94560', secondary: '#16213E', surface: '#0F3460',
  text: '#EAEAEA', muted: '#8892A4', bg: '#0D0D1A',
};

let _query = '';
let _results: any[] = [];
let _activeKat: string | null = null;
let _kategorie: string[] = [];
let _allLoaded = false;

export default function SearchScreen() {
  const [query, setQuery] = useState(_query);
  const [results, setResults] = useState<any[]>(_results);
  const [loading, setLoading] = useState(false);
  const [kategorie, setKategorie] = useState<string[]>(_kategorie);
  const [activeKat, setActiveKat] = useState<string | null>(_activeKat);
  const debounceRef = useRef<any>(null);

  const mapBooks = (data: any[]) => data.map((k: any) => ({
    id: k.id,
    tytul: k.tytul,
    isbn: k.isbn,
    autorzy: [...new Set(k.ksiazki_autorzy?.map((a: any) => a.autorzy?.imie_nazwisko).filter(Boolean) ?? [])],
    kategorie: [...new Set(k.ksiazki_kategorie?.map((c: any) => c.kategorie?.nazwa).filter(Boolean) ?? [])],
    dostepne: k.egzemplarze?.filter((e: any) => e.status === 'dostepny').length ?? 0,
  }));

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ksiazki')
      .select(`id, tytul, isbn, ksiazki_autorzy(autorzy(imie_nazwisko)), ksiazki_kategorie(kategorie(nazwa)), egzemplarze(status)`)
      .order('tytul')
      .limit(200);
    if (data) {
      const mapped = mapBooks(data);
      _results = mapped;
      _allLoaded = true;
      setResults(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (_kategorie.length === 0) {
      supabase.from('kategorie').select('nazwa').order('nazwa').then(({ data }) => {
        if (data) {
          const names = [...new Set(data.map((k: any) => k.nazwa as string))];
          _kategorie = names;
          setKategorie(names);
        }
      });
    }
    if (!_allLoaded) fetchAll();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setQuery(_query);
      setResults(_results);
      setActiveKat(_activeKat);
      setKategorie(_kategorie);
    }, [])
  );

  const doSearch = async (q: string, kat: string | null) => {
    if (!q.trim() && !kat) {
      if (_allLoaded) {
        setResults(_results.length > 0 ? _results : []);
        fetchAll();
      }
      return;
    }
    setLoading(true);

    // Sprawdź czy wpisana fraza pasuje do nazwy kategorii
    let katFromText: string | null = null;
    if (q.trim() && _kategorie.length > 0) {
      const match = _kategorie.find(k =>
        k.toLowerCase().includes(q.toLowerCase()) ||
        q.toLowerCase().includes(k.toLowerCase())
      );
      if (match) katFromText = match;
    }

    const effectiveKat = kat ?? katFromText;

    let katIds: number[] | null = null;
    if (effectiveKat) {
      const { data } = await supabase
        .from('ksiazki_kategorie')
        .select('id_ksiazki, kategorie!inner(nazwa)')
        .eq('kategorie.nazwa', effectiveKat);
      katIds = data ? data.map((r: any) => r.id_ksiazki) : [];
    }

    let authorIds: number[] = [];
    if (q.trim() && !katFromText) {
      const { data } = await supabase
        .from('ksiazki_autorzy')
        .select('id_ksiazki, autorzy!inner(imie_nazwisko)')
        .ilike('autorzy.imie_nazwisko', `%${q}%`);
      if (data && data.length > 0) authorIds = data.map((r: any) => r.id_ksiazki);
    }

    let req = supabase
      .from('ksiazki')
      .select(`id, tytul, isbn, ksiazki_autorzy(autorzy(imie_nazwisko)), ksiazki_kategorie(kategorie(nazwa)), egzemplarze(status)`)
      .order('tytul')
      .limit(100);

    if (katIds !== null) {
      req = req.in('id', katIds.length > 0 ? katIds : [-1]);
    } else if (q.trim() && !katFromText) {
      if (authorIds.length > 0) {
        req = req.or(`tytul.ilike.%${q}%,isbn.ilike.%${q}%,id.in.(${authorIds.join(',')})`);
      } else {
        req = req.or(`tytul.ilike.%${q}%,isbn.ilike.%${q}%`);
      }
    }

    const { data } = await req;
    if (data) {
      const mapped = mapBooks(data);
      _results = mapped;
      setResults(mapped);
    }
    setLoading(false);
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    _query = text;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(text, activeKat);
    }, 300);
  };

  const handleKatPress = (kat: string) => {
    const next = activeKat === kat ? null : kat;
    _activeKat = next;
    _query = '';
    setActiveKat(next);
    setQuery('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSearch('', next);
  };

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    _query = ''; _activeKat = null;
    setQuery(''); setActiveKat(null);
    fetchAll();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wyszukiwarka</Text>
        <Text style={styles.subtitle}>{results.length} ksiazek</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Tytul, autor, kategoria..."
            placeholderTextColor={COLORS.muted}
            returnKeyType="search"
            autoCorrect={false}
          />
          {(query.length > 0 || activeKat) && (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.katContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.katRow}>
          {kategorie.map(kat => (
            <TouchableOpacity
              key={`kat-${kat}`}
              style={[styles.katChip, activeKat === kat && styles.katChipActive]}
              onPress={() => handleKatPress(kat)}
            >
              <Text style={[styles.katText, activeKat === kat && styles.katTextActive]}>{kat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => `book-${item.id}`}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyText}>Brak wynikow</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/BookDetail', params: { id: item.id } } as any)}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="book" size={22} color={COLORS.accent} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.tytul}</Text>
                {item.autorzy.length > 0 && (
                  <Text style={styles.cardAuthor} numberOfLines={1}>{item.autorzy.join(', ')}</Text>
                )}
                {item.kategorie.length > 0 && (
                  <Text style={styles.cardKat} numberOfLines={1}>{item.kategorie.join(' · ')}</Text>
                )}
              </View>
              <View style={styles.dostepneBox}>
                <Text style={[styles.dostepneNum, { color: item.dostepne > 0 ? '#4CAF50' : '#FF5252' }]}>
                  {item.dostepne}
                </Text>
                <Text style={styles.dostepneLabel}>dostepnych</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 40 },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  searchRow: { paddingHorizontal: 16, marginBottom: 10 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.secondary, borderRadius: 12,
    paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.surface, height: 46,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15 },
  katContainer: { height: 44, marginBottom: 4 },
  katRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  katChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, alignSelf: 'center',
    backgroundColor: COLORS.secondary, borderWidth: 1, borderColor: COLORS.surface,
  },
  katChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  katText: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  katTextActive: { color: '#fff' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.secondary, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: COLORS.surface,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#1a0a10', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardAuthor: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  cardKat: { fontSize: 11, color: COLORS.accent, marginTop: 3 },
  dostepneBox: { alignItems: 'center', marginHorizontal: 8, minWidth: 40 },
  dostepneNum: { fontSize: 20, fontWeight: '800' },
  dostepneLabel: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  emptyText: { color: COLORS.muted, fontSize: 15, marginTop: 12, textAlign: 'center' },
});