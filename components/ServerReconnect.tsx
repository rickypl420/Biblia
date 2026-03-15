import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  accent: '#E94560', secondary: '#16213E', surface: '#0F3460',
  text: '#EAEAEA', muted: '#8892A4', bg: '#0D0D1A',
};

export function ServerReconnect({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false);
  const [dots, setDots] = useState('');
  const intervalRef = useRef<any>(null);
  const dotsRef = useRef<any>(null);
  const failCountRef = useRef(0);
  const offlineRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const check = async () => {
      try {
        const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
        if (res.ok) {
          failCountRef.current = 0;
          if (offlineRef.current) {
            offlineRef.current = false;
            setOffline(false);
          }
        }
      } catch {
        failCountRef.current++;
        if (failCountRef.current >= 1) {
          offlineRef.current = true;
          setOffline(true);
        }
      }
    };

    const handleOffline = () => { offlineRef.current = true; setOffline(true); };
    const handleOnline = () => { offlineRef.current = false; setOffline(false); };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    intervalRef.current = setInterval(check, 2000);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []); 

  useEffect(() => {
    if (!offline) { setDots(''); return; }
    dotsRef.current = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(dotsRef.current);
  }, [offline]);

  if (offline && Platform.OS === 'web') {
    return (
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="cloud-offline-outline" size={48} color={COLORS.accent} />
          </View>
          <Text style={styles.title}>Brak polaczenia z serwerem</Text>
          <Text style={styles.subtitle}>Trwa proba ponownego polaczenia{dots}</Text>
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color={COLORS.accent} />
            <Text style={styles.loaderText}>Oczekiwanie na serwer</Text>
          </View>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: COLORS.bg,
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  card: {
    backgroundColor: COLORS.secondary, borderRadius: 20, padding: 32,
    alignItems: 'center', width: '100%', maxWidth: 360,
    borderWidth: 1, borderColor: COLORS.surface,
  },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#1a0a10', justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, borderWidth: 2, borderColor: COLORS.accent,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 24, minWidth: 220 },
  loaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loaderText: { fontSize: 13, color: COLORS.muted },
});