import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { registerWithEmail } from '@/lib/auth';

type AccountRole = 'client' | 'admin';

export default function RegisterScreen() {
  const router = useRouter();
  const [accountRole, setAccountRole] = useState<AccountRole>('client');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gymName, setGymName] = useState('');
  const [gymAddress, setGymAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!nombre.trim() || !apellido.trim() || !dni.trim() || !email.trim() || !password) {
      setError('Completá todos los campos.');
      return;
    }

    if (accountRole === 'admin' && (!gymName.trim() || !gymAddress.trim())) {
      setError('Completá el nombre y la dirección del gimnasio.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { needsEmailConfirmation } = await registerWithEmail({
        nombre,
        apellido,
        telefono,
        dni,
        email,
        password,
        role: accountRole,
        gymName,
        gymAddress,
      });

      if (needsEmailConfirmation) {
        setSuccess('Cuenta creada. Revisá tu mail para confirmarla y después iniciá sesión.');
      } else {
        router.replace(accountRole === 'admin' ? '/dashboard' : '/home');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Completá tus datos para registrarte</Text>

          <View style={styles.roleSelector}>
            <Pressable
              style={[styles.roleOption, accountRole === 'client' && styles.roleOptionActive]}
              onPress={() => setAccountRole('client')}>
              <Text
                style={[
                  styles.roleOptionText,
                  accountRole === 'client' && styles.roleOptionTextActive,
                ]}>
                Cliente
              </Text>
            </Pressable>
            <Pressable
              style={[styles.roleOption, accountRole === 'admin' && styles.roleOptionActive]}
              onPress={() => setAccountRole('admin')}>
              <Text
                style={[
                  styles.roleOptionText,
                  accountRole === 'admin' && styles.roleOptionTextActive,
                ]}>
                Gimnasio
              </Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Nombre/s"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              value={nombre}
              onChangeText={setNombre}
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              value={apellido}
              onChangeText={setApellido}
            />
            <TextInput
              style={styles.input}
              placeholder="DNI"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              value={dni}
              onChangeText={setDni}
            />
            {accountRole === 'client' && (
              <TextInput
                style={styles.input}
                placeholder="Teléfono (opcional)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={telefono}
                onChangeText={setTelefono}
              />
            )}
            {accountRole === 'admin' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del gimnasio"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  value={gymName}
                  onChangeText={setGymName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Dirección del gimnasio"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="sentences"
                  value={gymAddress}
                  onChangeText={setGymAddress}
                />
              </>
            )}
            <TextInput
              style={styles.input}
              placeholder="Mail"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Repetir contraseña"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          {success && <Text style={styles.success}>{success}</Text>}

          <Pressable
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Registrarme</Text>
            )}
          </Pressable>

          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
            <Text style={styles.link}>¿Ya tenés cuenta? Iniciá sesión</Text>
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
    paddingVertical: 40,
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
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  roleOption: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: Colors.primary,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
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
  success: {
    color: '#4ADE80',
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
});
