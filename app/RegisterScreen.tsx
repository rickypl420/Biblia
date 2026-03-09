import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { router } from 'expo-router';

const COLORS = {
  primary: '#1A1A2E', accent: '#E94560', secondary: '#16213E',
  surface: '#0F3460', text: '#EAEAEA', muted: '#8892A4', bg: '#0D0D1A',
};

export default function RegisterScreen() {
  const [imieNazwisko, setImieNazwisko] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!imieNazwisko || !email || !password || !confirmPassword) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Błąd', 'Hasła się nie zgadzają');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Błąd', 'Hasło musi mieć co najmniej 6 znaków');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, imieNazwisko);
    setLoading(false);
    if (error) {
      Alert.alert('Błąd rejestracji', error.message);
    } else {
      Alert.alert('Sukces', 'Konto zostało utworzone! Sprawdź email w celu weryfikacji.', [
        { text: 'OK', onPress: () => router.push('/LoginScreen') },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Nowe konto</Text>
          <Text style={styles.subtitle}>Dołącz do biblioteki</Text>
        </View>

        <View style={styles.form}>
          {[
            { label: 'Imię i nazwisko', value: imieNazwisko, setter: setImieNazwisko, icon: 'person-outline', placeholder: 'Jan Kowalski', type: 'default' },
            { label: 'Email', value: email, setter: setEmail, icon: 'mail-outline', placeholder: 'twoj@email.pl', type: 'email-address' },
            { label: 'Hasło', value: password, setter: setPassword, icon: 'lock-closed-outline', placeholder: '••••••••', secure: true },
            { label: 'Potwierdź hasło', value: confirmPassword, setter: setConfirmPassword, icon: 'lock-closed-outline', placeholder: '••••••••', secure: true },
          ].map((field, i) => (
            <View key={i} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name={field.icon as any} size={20} color={COLORS.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.muted}
                  keyboardType={field.type as any || 'default'}
                  autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                  secureTextEntry={field.secure}
                  autoCorrect={false}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Utwórz konto</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/LoginScreen')}>
            <Text style={styles.loginLink}>
              Masz już konto? <Text style={styles.loginLinkAccent}>Zaloguj się</Text>
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
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.secondary, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.surface, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: COLORS.text, fontSize: 16 },
  registerButton: {
    backgroundColor: COLORS.accent, borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { textAlign: 'center', color: COLORS.muted, fontSize: 14, marginTop: 8 },
  loginLinkAccent: { color: COLORS.accent, fontWeight: '700' },
});
