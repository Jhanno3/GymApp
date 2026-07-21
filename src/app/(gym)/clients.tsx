import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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

import { Colors, SubscriptionStatusColors } from '@/constants/theme';
import { Client, SubscriptionStatus, useGymClients } from '@/hooks/use-gym-clients';
import { useSession } from '@/hooks/use-session';
import { supabase } from '@/lib/supabase';

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Activa',
  expiring: 'Por vencer',
  none: 'Sin membresía',
};

function formatDate(value: string | null) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export default function GymClientsScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { clients, isLoading, reload } = useGymClients(session?.user.id);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return clients;

    return clients.filter((client) =>
      [client.Nombre, client.Apellido, String(client.DNI), client.email ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [clients, searchQuery]);

  function closeModal() {
    setSelectedClient(null);
    setActionError(null);
  }

  async function handleRenew() {
    if (!selectedClient) return;

    setActionError(null);
    setIsRenewing(true);
    const { error } = await supabase.rpc('renew_cliente_membresia', {
      client_dni: String(selectedClient.DNI),
    });
    setIsRenewing(false);

    if (error) {
      setActionError(error.message);
      return;
    }

    await reload();
    closeModal();
  }

  function handleRemove() {
    if (!selectedClient) return;
    const client = selectedClient;

    Alert.alert(
      'Quitar cliente',
      `¿Seguro que querés quitar a ${client.Nombre} ${client.Apellido} de este gimnasio?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            setActionError(null);
            setIsRemoving(true);
            const { error } = await supabase.rpc('remove_cliente_from_gimnasio', {
              client_dni: String(client.DNI),
            });
            setIsRemoving(false);

            if (error) {
              setActionError(error.message);
              return;
            }

            await reload();
            closeModal();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/dashboard'))}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Clientes ({clients.length})</Text>
        <View style={styles.backButton} />
      </View>

      {!isLoading && clients.length > 0 && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, apellido, DNI o mail"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : clients.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Todavía no hay clientes inscriptos.</Text>
        </View>
      ) : filteredClients.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No encontramos clientes con esa búsqueda.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.nameCell, styles.headerCell]}>Cliente</Text>
              <Text style={[styles.cell, styles.dniCell, styles.headerCell]}>DNI</Text>
              <Text style={[styles.cell, styles.phoneCell, styles.headerCell]}>Teléfono</Text>
              <Text style={[styles.cell, styles.statusCell, styles.headerCell]}>Estado</Text>
            </View>

            {filteredClients.map((client) => (
              <Pressable
                key={client.DNI}
                style={styles.row}
                onPress={() => setSelectedClient(client)}>
                <Text style={[styles.cell, styles.nameCell]} numberOfLines={1}>
                  {client.Nombre} {client.Apellido}
                </Text>
                <Text style={[styles.cell, styles.dniCell]}>{client.DNI}</Text>
                <Text style={[styles.cell, styles.phoneCell]}>{client.Telefono ?? '-'}</Text>
                <View style={styles.statusCell}>
                  <View
                    style={[
                      styles.statusLed,
                      { backgroundColor: SubscriptionStatusColors[client.status] },
                    ]}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      <Modal visible={!!selectedClient} animationType="fade" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedClient && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedClient.Nombre} {selectedClient.Apellido}
                  </Text>
                  <View
                    style={[
                      styles.statusLed,
                      { backgroundColor: SubscriptionStatusColors[selectedClient.status] },
                    ]}
                  />
                </View>

                <View style={styles.detailList}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>DNI</Text>
                    <Text style={styles.detailValue}>{selectedClient.DNI}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Teléfono</Text>
                    <Text style={styles.detailValue}>{selectedClient.Telefono ?? '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mail</Text>
                    <Text style={styles.detailValue}>{selectedClient.email ?? '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Membresía</Text>
                    <Text style={styles.detailValue}>{STATUS_LABELS[selectedClient.status]}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Inicio</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedClient.fechaInicio)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Vencimiento</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedClient.fechaFin)}</Text>
                  </View>
                </View>

                {actionError && <Text style={styles.error}>{actionError}</Text>}

                <Pressable
                  style={[styles.button, isRenewing && styles.buttonDisabled]}
                  onPress={handleRenew}
                  disabled={isRenewing || isRemoving}>
                  {isRenewing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Actualizar membresía (+1 mes)</Text>
                  )}
                </Pressable>

                <Pressable
                  style={[styles.dangerButton, isRemoving && styles.buttonDisabled]}
                  onPress={handleRemove}
                  disabled={isRenewing || isRemoving}>
                  {isRemoving ? (
                    <ActivityIndicator color="#F87171" />
                  ) : (
                    <Text style={styles.dangerButtonText}>Eliminar cliente</Text>
                  )}
                </Pressable>

                <Pressable style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  container: {
    padding: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerRow: {
    backgroundColor: Colors.background,
  },
  cell: {
    fontSize: 13,
    color: Colors.text,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  nameCell: {
    flex: 2.2,
    paddingRight: 8,
  },
  dniCell: {
    flex: 1.3,
  },
  phoneCell: {
    flex: 1.4,
  },
  statusCell: {
    flex: 0.8,
    alignItems: 'center',
  },
  statusLed: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  detailList: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dangerButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F87171',
  },
  closeButton: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
