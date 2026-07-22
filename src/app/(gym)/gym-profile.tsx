import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { Colors } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { supabase } from '@/lib/supabase';

type Gym = {
  Nombre: string;
  direccion: string | null;
};

export default function GymProfileScreen() {
  const router = useRouter();
  const { session } = useSession();

  const [fullName, setFullName] = useState('');
  const [dni, setDni] = useState('');
  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user.id) {
      loadProfile(session.user.id);
    }
  }, [session?.user.id]);

  async function loadProfile(userId: string) {
    setIsLoading(true);
    const { data, error: loadError } = await supabase
      .from('profiles')
      .select('full_name, dni')
      .eq('id', userId)
      .single();

    if (!loadError && data) {
      setFullName(data.full_name ?? '');
      setDni(data.dni ?? '');

      const gimnasioDni = data.dni ? Number(data.dni) : null;
      if (gimnasioDni && !Number.isNaN(gimnasioDni)) {
        const { data: gymData } = await supabase
          .from('Gimnasio')
          .select('Nombre, direccion')
          .eq('DNI', gimnasioDni)
          .single();
        setGym((gymData as Gym) ?? null);
      }
    }
    setIsLoading(false);
  }

  async function handleSave() {
    if (!session?.user.id) return;

    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    setIsSaving(true);
    const { error: saveError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', session.user.id);
    setIsSaving(false);

    if (saveError) {
      setError('No pudimos guardar los cambios. Probá de nuevo.');
      return;
    }

    setSuccess('Datos actualizados.');
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || !confirmPassword) {
      setPasswordError('Completá los dos campos de contraseña.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }

    setIsChangingPassword(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);

    if (updateError) {
      setPasswordError('No pudimos cambiar la contraseña. Probá de nuevo.');
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess('Contraseña actualizada.');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Tus datos y los de tu gimnasio</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>DNI</Text>
            <TextInput
              style={[styles.input, styles.inputReadOnly]}
              value={dni}
              editable={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mail</Text>
            <TextInput
              style={[styles.input, styles.inputReadOnly]}
              value={session?.user.email ?? ''}
              editable={false}
            />
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {success && <Text style={styles.success}>{success}</Text>}

        <Pressable
          style={[styles.button, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Guardar cambios</Text>
          )}
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Tu gimnasio</Text>

          {gym ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={[styles.input, styles.inputReadOnly]}
                  value={gym.Nombre}
                  editable={false}
                />
              </View>

              {gym.direccion && (
                <View style={styles.field}>
                  <Text style={styles.label}>Dirección</Text>
                  <TextInput
                    style={[styles.input, styles.inputReadOnly]}
                    value={gym.direccion}
                    editable={false}
                  />
                </View>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>Todavía no tenés un gimnasio asignado.</Text>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Cambiar contraseña</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Nueva contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Nueva contraseña"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Repetir contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Repetir contraseña"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>

        {passwordError && <Text style={styles.error}>{passwordError}</Text>}
        {passwordSuccess && <Text style={styles.success}>{passwordSuccess}</Text>}

        <Pressable
          style={[styles.button, isChangingPassword && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={isChangingPassword}>
          {isChangingPassword ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Cambiar contraseña</Text>
          )}
        </Pressable>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  title: {
    fontSize: 24,
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
    gap: 16,
  },
  field: {
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
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
  inputReadOnly: {
    color: Colors.textMuted,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
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
  signOutButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
});
