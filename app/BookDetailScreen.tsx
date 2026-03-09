import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const COLORS = {
  accent: '#E94560', secondary: '#16213E', surface: '#0F3460',
  text: '#EAEAEA', muted: '#8892A4', bg: '#0D0D1A',
  success: '#4CAF50', warning: '#FF9800',
};

function InfoRow({ icon, label, value }: any) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={COLORS.muted} />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function EgzemplarzCard({ egz }: any) {
  const isAvailable = egz.status === 'dostepna';
  return (
    <View style={[styles.egzCard, { borderLeftColor: isAvailable ? COLORS.success : COLORS.accent }]}>
      <View style={styles.egzLeft}>
        <Ionicons
          name={isAvailable ? 'checkmark-circle' : 'time'}
          size={20}
          color={isAvailable ? COLORS.success : COLORS.accent}
        />
        <View>
          <Text style={styles.egzStatus}>{isAvailable ? 'Dostępna' : 'Wypożyczona'}</Text>
          {egz.lokalizacje && (
            <Text style={styles.egzLocation}>
              {egz.lokalizacje.dzial} · Regał {egz.lokalizacje.regal} · Półka {egz.lokalizacje.polka}
            </Text>
          )}
        </View>
      </View>
      <Text style={styles.egzId}>#{egz.id}</Text>
    </View>
  );
}

export default function BookDetailScreen() {
  const { bookId } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const [book, setBook] = useState<any>(null);
  const [egzemplarze, setEgzemplarze] = useState<any[]>([]);
  const [cena, setCena] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [borrowDays, setBorrowDays] = useState(14);

  useEffect(() => { loadBook(); }, [bookId]);

  const loadBook = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('ksiazki')
        .select(`
          id, tytul, isbn, opis,
          ksiazki_autorzy(autorzy(id, imie_nazwisko)),
          ksiazki_kategorie(kategorie(id, nazwa)),
          ksiazki_ceny(id_ceny, data_obowiazywania, ceny(kwota))
        `)
        .eq('id', bookId)
        .single();

      if (data) {
        setBook(data);
        const latestPrice = data.ksiazki_ceny
          ?.sort((a: any, b: any) => new Date(b.data_obowiazywania).getTime() - new Date(a.data_obowiazywania).getTime())
          ?.[0]?.ceny?.kwota;
        if (latestPrice) setCena(latestPrice);
      }

      const { data: egz } = await supabase
        .from('egzemplarze')
        .select('id, status, id_lokalizacji, lokalizacje(dzial, regal, polka)')
        .eq('id_ksiazki', bookId);

      setEgzemplarze(egz || []);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!userProfile) {
      Alert.alert('Błąd', 'Musisz być zalogowany aby wypożyczyć książkę');
      return;
    }
    const available = egzemplarze.find((e) => e.status === 'dostepna');
    if (!available) {
      Alert.alert('Brak dostępnych egzemplarzy', 'Wszystkie egzemplarze tej książki są aktualnie wypożyczone.');
      return;
    }
    setShowModal(true);
  };

  const confirmBorrow = async () => {
    setShowModal(false);
    setBorrowing(true);
    try {
      const available = egzemplarze.find((e) => e.status === 'dostepna');
      if (!available) return;

      const now = new Date();
      const returnDate = new Date(now);
      returnDate.setDate(returnDate.getDate() + borrowDays);

      // INSERT into wypozyczenia
      const { error: borrowError } = await supabase.from('wypozyczenia').insert({
        id_uzytkownika: userProfile.id,
        id_egzemplarza: available.id,
        data_wypozyczenia: now.toISOString(),
        termin_zwrotu: returnDate.toISOString(),
      });

      if (borrowError) throw borrowError;

      // UPDATE egzemplarze status
      const { error: updateError } = await supabase
        .from('egzemplarze')
        .update({ status: 'wypozyczona' })
        .eq('id', available.id);

      if (updateError) throw updateError;

      // Log to historia
      await supabase.from('historia_egzemplarzy').insert({
        id_egzemplarza: available.id,
        opis_zdarzenia: `Wypożyczona przez użytkownika ${userProfile.id} na ${borrowDays} dni`,
        data_zdarzenia: now.toISOString(),
      });

      Alert.alert(
        '✅ Wypożyczono pomyślnie!',
        `"${book?.tytul}" zostało wypożyczone.\nTermin zwrotu: ${returnDate.toLocaleDateString('pl-PL')}`,
        [{ text: 'OK', onPress: loadBook }]
      );
    } catch (e: any) {
      Alert.alert('Błąd', e.message || 'Nie udało się wypożyczyć książki');
    } finally {
      setBorrowing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Nie znaleziono książki</Text>
      </View>
    );
  }

  const availableCount = egzemplarze.filter((e) => e.status === 'dostepna').length;
  const authors = book.ksiazki_autorzy?.map((ka: any) => ka.autorzy?.imie_nazwisko).filter(Boolean);
  const categories = book.ksiazki_kategorie?.map((kk: any) => kk.kategorie?.nazwa).filter(Boolean);

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.bigCover}>
            <Ionicons name="book" size={64} color={COLORS.accent} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>{book.tytul}</Text>
            {authors?.length > 0 && (
              <Text style={styles.heroAuthor}>{authors.join(', ')}</Text>
            )}
            {categories?.length > 0 && (
              <View style={styles.categoryRow}>
                {categories.map((cat: string, i: number) => (
                  <View key={i} style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{cat}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.body}>
          {/* Availability */}
          <View style={[styles.availSection, { borderColor: availableCount > 0 ? COLORS.success : COLORS.accent }]}>
            <Ionicons
              name={availableCount > 0 ? 'checkmark-circle' : 'close-circle'}
              size={28}
              color={availableCount > 0 ? COLORS.success : COLORS.accent}
            />
            <View>
              <Text style={[styles.availTitle, { color: availableCount > 0 ? COLORS.success : COLORS.accent }]}>
                {availableCount > 0 ? `${availableCount} egzemplarzy dostępnych` : 'Brak dostępnych egzemplarzy'}
              </Text>
              <Text style={styles.availSubtitle}>
                {egzemplarze.length} egzemplarzy łącznie
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Szczegóły</Text>
            {book.isbn && <InfoRow icon="barcode-outline" label="ISBN" value={book.isbn} />}
            {cena && <InfoRow icon="pricetag-outline" label="Wartość" value={`${cena} zł`} />}
          </View>

          {/* Description */}
          {book.opis && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Opis</Text>
              <Text style={styles.description}>{book.opis}</Text>
            </View>
          )}

          {/* Egzemplarze */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Egzemplarze ({egzemplarze.length})</Text>
            {egzemplarze.map((egz) => (
              <EgzemplarzCard key={egz.id} egz={egz} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Borrow Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.borrowButton, availableCount === 0 && styles.borrowButtonDisabled]}
          onPress={handleBorrow}
          disabled={availableCount === 0 || borrowing}
        >
          {borrowing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="book-outline" size={20} color="#fff" />
              <Text style={styles.borrowButtonText}>
                {availableCount > 0 ? 'Wypożycz książkę' : 'Niedostępna'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Borrow Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Potwierdź wypożyczenie</Text>
            <Text style={styles.modalBook} numberOfLines={2}>{book.tytul}</Text>

            <Text style={styles.modalLabel}>Okres wypożyczenia</Text>
            <View style={styles.daysRow}>
              {[7, 14, 21, 30].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayChip, borrowDays === d && styles.dayChipActive]}
                  onPress={() => setBorrowDays(d)}
                >
                  <Text style={[styles.dayChipText, borrowDays === d && styles.dayChipTextActive]}>
                    {d} dni
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalReturnInfo}>
              Termin zwrotu: {(() => {
                const d = new Date();
                d.setDate(d.getDate() + borrowDays);
                return d.toLocaleDateString('pl-PL');
              })()}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmBorrow}>
                <Text style={styles.confirmButtonText}>Wypożycz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  errorText: { color: COLORS.muted, fontSize: 16 },
  hero: {
    backgroundColor: COLORS.secondary, padding: 24,
    flexDirection: 'row', gap: 16, alignItems: 'flex-start',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  bigCover: {
    width: 88, height: 112, borderRadius: 12,
    backgroundColor: '#1a0a10', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.accent,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  heroInfo: { flex: 1, paddingTop: 4, gap: 6 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, lineHeight: 26 },
  heroAuthor: { fontSize: 14, color: COLORS.muted, fontWeight: '500' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  categoryChip: {
    backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  categoryText: { fontSize: 11, color: '#7FB3D3', fontWeight: '600' },
  body: { padding: 20, gap: 4 },
  availSection: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.secondary, borderRadius: 14,
    padding: 16, borderWidth: 1, marginBottom: 8,
  },
  availTitle: { fontSize: 15, fontWeight: '700' },
  availSubtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: COLORS.muted, width: 70 },
  infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '500', flex: 1 },
  description: { fontSize: 14, color: COLORS.muted, lineHeight: 22 },
  egzCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.secondary, borderRadius: 10, padding: 12,
    marginBottom: 8, borderLeftWidth: 3,
  },
  egzLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  egzStatus: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  egzLocation: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  egzId: { fontSize: 11, color: COLORS.muted },
  footer: {
    padding: 16, paddingBottom: 32, backgroundColor: COLORS.secondary,
    borderTopWidth: 1, borderTopColor: COLORS.surface,
  },
  borrowButton: {
    backgroundColor: COLORS.accent, borderRadius: 14, height: 52,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  borrowButtonDisabled: { backgroundColor: '#3a2a2a', shadowOpacity: 0 },
  borrowButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.secondary, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  modalBook: { fontSize: 15, color: COLORS.accent, fontWeight: '600', marginBottom: 20 },
  modalLabel: { fontSize: 13, color: COLORS.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  dayChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.surface,
    alignItems: 'center',
  },
  dayChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dayChipText: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
  dayChipTextActive: { color: '#fff' },
  modalReturnInfo: { fontSize: 13, color: COLORS.muted, marginBottom: 24, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.surface,
  },
  cancelButtonText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  confirmButton: {
    flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.accent,
  },
  confirmButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
