import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { StatusLed } from '@/components/status-led';
import { Colors } from '@/constants/theme';
import { useGymClients } from '@/hooks/use-gym-clients';
import { useSession } from '@/hooks/use-session';
import { supabase } from '@/lib/supabase';

type QrCodeRef = {
  toDataURL: (callback: (data: string) => void) => void;
};

const CLIENT_PREVIEW_COUNT = 5;

export default function GymDashboardScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { gym, clients, isLoading, reload } = useGymClients(session?.user.id);

  const [isQrVisible, setIsQrVisible] = useState(false);
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);
  const qrRef = useRef<QrCodeRef | null>(null);

  const [isAddClientVisible, setIsAddClientVisible] = useState(false);
  const [newClientDni, setNewClientDni] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [addClientError, setAddClientError] = useState<string | null>(null);

  function closeAddClientModal() {
    setIsAddClientVisible(false);
    setNewClientDni('');
    setAddClientError(null);
  }

  async function handleAddClient() {
    setAddClientError(null);

    if (!newClientDni.trim()) {
      setAddClientError('Ingresá el DNI del cliente.');
      return;
    }

    setIsAddingClient(true);
    const { error } = await supabase.rpc('add_cliente_to_gimnasio', {
      client_dni: newClientDni.trim(),
    });
    setIsAddingClient(false);

    if (error) {
      setAddClientError(error.message);
      return;
    }

    await reload();
    closeAddClientModal();
  }

  function getQrDataUrl(): Promise<string> {
    return new Promise((resolve) => {
      qrRef.current?.toDataURL((data) => resolve(data));
    });
  }

  async function handleDownloadQr() {
    if (!gym) return;

    setIsDownloadingQr(true);
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('No disponible', 'Tu dispositivo no permite guardar o compartir archivos.');
        return;
      }

      const base64 = await getQrDataUrl();
      const fileUri = `${FileSystem.cacheDirectory}gimnasio-${gym.DNI}-qr.png`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/png',
        dialogTitle: 'Guardar código QR',
      });
    } catch {
      Alert.alert('Error', 'No pudimos preparar el código QR. Probá de nuevo.');
    } finally {
      setIsDownloadingQr(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!gym) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          Tu cuenta todavía no tiene un gimnasio asignado. Pedile a un administrador que te lo
          configure.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <Text style={styles.title}>{gym.Nombre}</Text>
        {gym.direccion && <Text style={styles.subtitle}>{gym.direccion}</Text>}
      </View>

      <Pressable style={styles.qrButton} onPress={() => setIsQrVisible(true)}>
        <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
        <Text style={styles.qrButtonText}>Mostrar código QR</Text>
      </Pressable>

      <Modal visible={isQrVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{gym.Nombre}</Text>
            <Text style={styles.modalSubtitle}>
              Pegalo en la entrada para que tus clientes escaneen y hagan check-in.
            </Text>

            <View style={styles.qrWrapper}>
              <QRCode
                value={gym.qr_code_value}
                size={220}
                color="#000000"
                backgroundColor="#FFFFFF"
                getRef={(ref) => {
                  qrRef.current = ref;
                }}
              />
            </View>

            <Pressable
              style={[styles.button, isDownloadingQr && styles.buttonDisabled]}
              onPress={handleDownloadQr}
              disabled={isDownloadingQr}>
              {isDownloadingQr ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Descargar</Text>
              )}
            </Pressable>

            <Pressable style={styles.closeButton} onPress={() => setIsQrVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.section}>
        <Pressable style={styles.button} onPress={() => setIsAddClientVisible(true)}>
          <Text style={styles.buttonText}>Agregar cliente</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
          Clientes inscriptos ({clients.length})
        </Text>

        <Modal visible={isAddClientVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Agregar cliente</Text>
              <Text style={styles.modalSubtitle}>
                Ingresá el DNI del cliente. Tiene que haberse registrado antes en la app.
              </Text>

              <TextInput
                style={styles.dniInput}
                placeholder="DNI del cliente"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={newClientDni}
                onChangeText={setNewClientDni}
              />

              {addClientError && <Text style={styles.error}>{addClientError}</Text>}

              <Pressable
                style={[styles.button, isAddingClient && styles.buttonDisabled]}
                onPress={handleAddClient}
                disabled={isAddingClient}>
                {isAddingClient ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Agregar</Text>
                )}
              </Pressable>

              <Pressable style={styles.closeButton} onPress={closeAddClientModal}>
                <Text style={styles.closeButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {clients.length === 0 ? (
          <Text style={styles.emptyText}>Todavía no hay clientes inscriptos.</Text>
        ) : (
          <>
            <View style={styles.clientList}>
              {clients.slice(0, CLIENT_PREVIEW_COUNT).map((client) => (
                <View key={client.DNI} style={styles.clientCard}>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>
                      {client.Nombre} {client.Apellido}
                    </Text>
                    <Text style={styles.clientDetail}>DNI {client.DNI}</Text>
                    {client.Telefono && (
                      <Text style={styles.clientDetail}>Tel. {client.Telefono}</Text>
                    )}
                  </View>

                  <StatusLed status={client.status} />
                </View>
              ))}
            </View>

            <Pressable style={styles.button} onPress={() => router.push('/clients')}>
              <Text style={styles.buttonText}>Ver todos</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
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
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  dniInput: {
    width: '100%',
    backgroundColor: Colors.background,
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
    width: '100%',
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
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  section: {
    gap: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionTitleSpaced: {
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  clientList: {
    gap: 10,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  clientInfo: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  clientDetail: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
