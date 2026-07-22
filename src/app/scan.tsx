import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  function handleClose() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }

  function handleRetry() {
    setCheckInError(null);
    setScanned(false);
  }

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    setIsCheckingIn(true);
    setCheckInError(null);

    const { data: gymName, error } = await supabase.rpc('check_in', {
      p_qr_code_value: data,
    });
    setIsCheckingIn(false);

    if (error) {
      setCheckInError(error.message);
      return;
    }

    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace({ pathname: '/home', params: { checkinGym: gymName ?? '' } });
  }

  if (!permission) {
    return <View style={styles.safeArea} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.permissionText}>
            Necesitamos acceso a la cámara para escanear el QR del gimnasio.
          </Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Dar permiso</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safeArea}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <SafeAreaView style={styles.overlay}>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>

        <View style={styles.frame} />

        {isCheckingIn ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : checkInError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{checkInError}</Text>
            <Pressable style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Escanear de nuevo</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.hint}>Apuntá al QR del gimnasio para hacer check-in</Text>
        )}
      </SafeAreaView>
    </View>
  );
}

const FRAME_SIZE = 240;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderWidth: 3,
    borderColor: Colors.primary,
    borderRadius: 16,
  },
  hint: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorBox: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  permissionText: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  permissionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
