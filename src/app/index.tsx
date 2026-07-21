import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { signInWithIdentifier } from '@/lib/auth';
import {
  authenticateWithBiometrics,
  isBiometricEnabled,
  isBiometricSupported,
  setBiometricEnabled,
} from '@/lib/biometrics';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  async function checkBiometricAvailability() {
    const [supported, enabled, { data }] = await Promise.all([
      isBiometricSupported(),
      isBiometricEnabled(),
      supabase.auth.getSession(),
    ]);
    setCanUseBiometrics(supported && enabled && !!data.session);
  }

  async function offerBiometricEnrollment() {
    const supported = await isBiometricSupported();
    const alreadyEnabled = await isBiometricEnabled();
    if (!supported || alreadyEnabled) return;

    Alert.alert('Ingreso rápido', '¿Querés activar el ingreso con Face ID / huella?', [
      { text: 'Ahora no', style: 'cancel' },
      {
        text: 'Activar',
        onPress: () => setBiometricEnabled(true),
      },
    ]);
  }

  async function goToRoleHome(userId: string) {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    const destination = data?.role === 'admin' ? '/dashboard' : '/home';

    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace(destination);
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithIdentifier(identifier, password);
      await offerBiometricEnrollment();

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await goToRoleHome(data.session.user.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBiometricLogin() {
    setError(null);
    const success = await authenticateWithBiometrics('Ingresá con Face ID / huella');
    if (!success) return;

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setError('Tu sesión expiró. Ingresá con tu DNI/mail y contraseña.');
      setCanUseBiometrics(false);
      return;
    }

    await goToRoleHome(data.session.user.id);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>GymApp</Text>
          <Text style={styles.subtitle}>Ingresá con tu DNI o mail</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="DNI o mail"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={identifier}
              onChangeText={setIdentifier}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Ingresar</Text>
            )}
          </Pressable>

          {canUseBiometrics && (
            <Pressable style={styles.biometricButton} onPress={handleBiometricLogin}>
              <Ionicons name="finger-print-outline" size={22} color={Colors.primary} />
              <Text style={styles.biometricButtonText}>Ingresar con Face ID / huella</Text>
            </Pressable>
          )}

          <Pressable onPress={() => router.push('/register')}>
            <Text style={styles.link}>¿No tenés cuenta? Registrate</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  error: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  link: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
  },
  biometricButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
