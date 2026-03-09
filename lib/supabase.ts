import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

export type Database = {
  public: {
    Tables: {
      uzytkownicy: {
        Row: {
          id: number;
          imie_nazwisko: string;
          email: string;
          rola: string;
        };
        Insert: {
          imie_nazwisko: string;
          email: string;
          rola?: string;
        };
        Update: {
          imie_nazwisko?: string;
          email?: string;
          rola?: string;
        };
      };
      ksiazki: {
        Row: {
          id: number;
          tytul: string;
          isbn: string | null;
          opis: string | null;
        };
        Insert: {
          tytul: string;
          isbn?: string;
          opis?: string;
        };
        Update: {
          tytul?: string;
          isbn?: string;
          opis?: string;
        };
      };
      autorzy: {
        Row: {
          id: number;
          imie_nazwisko: string;
        };
      };
      ksiazki_autorzy: {
        Row: {
          id_ksiazki: number;
          id_autora: number;
        };
      };
      kategorie: {
        Row: {
          id: number;
          nazwa: string;
        };
      };
      ksiazki_kategorie: {
        Row: {
          id_ksiazki: number;
          id_kategorii: number;
        };
      };
      egzemplarze: {
        Row: {
          id: number;
          id_ksiazki: number;
          id_lokalizacji: number | null;
          status: string;
        };
        Update: {
          status?: string;
          id_lokalizacji?: number;
        };
      };
      lokalizacje: {
        Row: {
          id: number;
          dzial: string;
          regal: string;
          polka: string;
        };
      };
      wypozyczenia: {
        Row: {
          id: number;
          id_uzytkownika: number;
          id_egzemplarza: number;
          data_wypozyczenia: string;
          termin_zwrotu: string;
          data_zwrotu: string | null;
        };
        Insert: {
          id_uzytkownika: number;
          id_egzemplarza: number;
          data_wypozyczenia?: string;
          termin_zwrotu: string;
          data_zwrotu?: string;
        };
      };
      historia_egzemplarzy: {
        Row: {
          id: number;
          id_egzemplarza: number;
          opis_zdarzenia: string;
          data_zdarzenia: string;
        };
      };
      ceny: {
        Row: {
          id: number;
          kwota: number;
        };
      };
      ksiazki_ceny: {
        Row: {
          id_ksiazki: number;
          id_ceny: number;
          data_obowiazywania: string;
        };
      };
    };
  };
};
