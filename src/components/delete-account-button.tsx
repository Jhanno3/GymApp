import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const CONFIRM_TIMEOUT_MS = 5000;

export function DeleteAccountButton() {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handlePress() {
    if (!isConfirming) {
      setError(null);
      setIsConfirming(true);
      timerRef.current = setTimeout(() => setIsConfirming(false), CONFIRM_TIMEOUT_MS);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    handleDelete();
  }

  function handleCancel() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsConfirming(false);
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('delete_own_account');

    if (rpcError) {
      setIsDeleting(false);
      setIsConfirming(false);
      setError(rpcError.message);
      return;
    }

    await supabase.auth.signOut().catch(() => {});
    router.replace('/');
  }

  return (
    <>
      <Pressable
        style={[styles.button, isConfirming && styles.buttonConfirming]}
        onPress={handlePress}
        disabled={isDeleting}>
        {isDeleting ? (
          <ActivityIndicator color="#F87171" />
        ) : (
          <Text style={[styles.buttonText, isConfirming && styles.buttonTextConfirming]}>
            {isConfirming ? '¿Seguro? Tocá de nuevo para confirmar' : 'Eliminar cuenta'}
          </Text>
        )}
      </Pressable>

      {isConfirming && !isDeleting && (
        <Pressable style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonConfirming: {
    backgroundColor: '#F87171',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F87171',
  },
  buttonTextConfirming: {
    color: '#FFFFFF',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
  },
});
