import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBER_KEY = 'remember_me';
const REMEMBERED_EMAIL_KEY = 'remembered_email';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string, imieNazwisko: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Check if user had "remember me" checked
        const remembered = await AsyncStorage.getItem(REMEMBER_KEY);

        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session && remembered !== 'true') {
          // Session exists but remember me was not checked — sign out
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        } else if (session) {
          setSession(session);
          setUser(session.user);
          if (session.user) await fetchProfile(session.user.email!);
        }
      } catch (e) {
        console.log('Auth init error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.email!);
      else setUserProfile(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (email: string) => {
    const { data } = await supabase
      .from('uzytkownicy')
      .select('*')
      .eq('email', email)
      .single();
    setUserProfile(data);
  };

  const signIn = async (email: string, password: string, remember: boolean) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      if (remember) {
        await AsyncStorage.setItem(REMEMBER_KEY, 'true');
        await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        await AsyncStorage.removeItem(REMEMBER_KEY);
        await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    }
    return { error };
  };

  const signUp = async (email: string, password: string, imieNazwisko: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      await supabase.from('uzytkownicy').insert({
        email,
        imie_nazwisko: imieNazwisko,
        rola: 'czytelnik',
      });
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear all remembered data on explicit logout
    await AsyncStorage.removeItem(REMEMBER_KEY);
    await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
    setSession(null);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, userProfile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
