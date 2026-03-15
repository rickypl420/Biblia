import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { router } from 'expo-router';

const COLORS = {
  primary: '#1A1A2E', accent: '#E94560', secondary: '#16213E',
  surface: '#0F3460', text: '#EAEAEA', muted: '#8892A4', bg: '#0D0D1A',
  error: '#FF5252', success: '#4CAF50',
};

export default function RegisterScreen() {
  const [imieNazwisko, setImieNazwisko] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    setErrorMsg('');
    if (!imieNazwisko || !email || !password || !confirmPassword) {
      setErrorMsg('Wypelnij wszystkie pola');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Hasla sie nie zgadzaja');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Haslo musi miec co najmniej 6 znakow');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, imieNazwisko);
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Konto utworzone!</Text>
          <Text style={styles.successMsg}>
            Sprawdz email w celu weryfikacji konta, a nastepnie zaloguj sie.
          </Text>
          <TouchableOpacity style={styles.successBtn} onPress={() => router.push('/LoginScreen')}>
            <Text style={styles.successBtnText}>Przejdz do logowania</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Nowe konto</Text>
          <Text style={styles.subtitle}>Dolacz do biblioteki</Text>
        </View>

        <View style={styles.form}>
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Imie i nazwisko</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={imieNazwisko}
                onChangeText={setImieNazwisko}
                placeholder="Jan Kowalski"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="twoj@email.pl"
                placeholderTextColor={COLORS.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Haslo</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={showPassword ? COLORS.accent : COLORS.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Potwierdz haslo</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.muted}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={showConfirmPassword ? COLORS.accent : COLORS.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Utworz konto</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/LoginScreen')}>
            <Text style={styles.loginLink}>
              Masz juz konto? <Text style={styles.loginLinkAccent}>Zaloguj sie</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 56 },
  backButton: { marginBottom: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  form: { gap: 16 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2a0a0a', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: COLORS.error,
  },
  errorText: { color: COLORS.error, fontSize: 14, flex: 1 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.secondary, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.surface, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: COLORS.text, fontSize: 16 },
  eyeIcon: { padding: 6 },
  registerButton: {
    backgroundColor: COLORS.accent, borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { textAlign: 'center', color: COLORS.muted, fontSize: 14, marginTop: 8 },
  loginLinkAccent: { color: COLORS.accent, fontWeight: '700' },

  // Success screen
  successContainer: {
    flex: 1, backgroundColor: COLORS.bg,
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  successCard: {
    backgroundColor: COLORS.secondary, borderRadius: 20, padding: 32,
    alignItems: 'center', width: '100%', maxWidth: 360,
    borderWidth: 1, borderColor: COLORS.surface,
  },
  successIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#0a2a0a', justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, borderWidth: 2, borderColor: COLORS.success,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  successMsg: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  successBtn: {
    backgroundColor: COLORS.accent, borderRadius: 12,
    height: 52, justifyContent: 'center', alignItems: 'center', width: '100%',
  },
  successBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
