import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/Card';
import { ActionMenu } from '../components/ui/ActionMenu';
import {
  fetchVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  assignVoucher,
  assignVoucherBulk,
  sendVoucherEmail,
} from '../api/vouchers';
import { fetchAdminServices } from '../api/services';
import { VoucherFormModal, VoucherSubmitPayload } from '../components/VoucherFormModal';
import { VoucherAssignModal } from '../components/VoucherAssignModal';
import { useTenant } from '../hooks/useTenant';

const COPY = {
  pt: {
    title: 'Vouchers',
    subtitle: 'Crie vouchers de desconto ou serviço grátis e atribua-os aos seus clientes.',
    newVoucher: 'Novo voucher',
    countSuffix: (n: number) => `${n} vouchers`,
    emptyTitle: 'Nenhum voucher criado.',
    addFirstVoucher: 'Criar primeiro voucher',
    edit: 'Editar',
    assign: 'Atribuir a cliente',
    remove: 'Remover',
    deleteTitle: 'Remover voucher',
    deleteMessage: (code: string) => `Tem certeza que deseja remover o voucher ${code}?`,
    cancel: 'Cancelar',
    errorTitle: 'Erro',
    saveError: 'Não foi possível salvar o voucher.',
    deleteError: 'Não foi possível remover o voucher.',
    assignError: 'Não foi possível atribuir o voucher.',
    assignBulkSuccess: (count: number) => `${count} clientes receberam o voucher.`,
    assignBulkSkipped: (count: number, detail: string) => `${count} não receberam: ${detail}`,
    assignBulkTitle: 'Atribuição em massa',
    skipAlreadyAssigned: 'já tinha o voucher',
    skipMaxUses: 'limite de atribuições atingido',
    skipNotFound: 'cliente não encontrado',
    maxUses: 'Limite de atribuições',
    validUntil: 'Válido até',
    statusActive: 'Ativo',
    statusExpired: 'Expirado',
    typePercent: (value: string) => `${value}% de desconto`,
    typeFixed: (value: string) => `Desconto de ${value}`,
    typeFreeService: 'Serviço grátis',
  },
  en: {
    title: 'Vouchers',
    subtitle: 'Create discount or free-service vouchers and assign them to your clients.',
    newVoucher: 'New voucher',
    countSuffix: (n: number) => `${n} vouchers`,
    emptyTitle: 'No voucher created.',
    addFirstVoucher: 'Create first voucher',
    edit: 'Edit',
    assign: 'Assign to client',
    remove: 'Remove',
    deleteTitle: 'Remove voucher',
    deleteMessage: (code: string) => `Are you sure you want to remove voucher ${code}?`,
    cancel: 'Cancel',
    errorTitle: 'Error',
    saveError: 'Could not save the voucher.',
    deleteError: 'Could not remove the voucher.',
    assignError: 'Could not assign the voucher.',
    assignBulkSuccess: (count: number) => `${count} clients received the voucher.`,
    assignBulkSkipped: (count: number, detail: string) => `${count} did not receive it: ${detail}`,
    assignBulkTitle: 'Bulk assignment',
    skipAlreadyAssigned: 'already had the voucher',
    skipMaxUses: 'assignment limit reached',
    skipNotFound: 'client not found',
    maxUses: 'Assignment limit',
    validUntil: 'Valid until',
    statusActive: 'Active',
    statusExpired: 'Expired',
    typePercent: (value: string) => `${value}% off`,
    typeFixed: (value: string) => `${value} off`,
    typeFreeService: 'Free service',
  },
} as const;

function extractErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }
    if (typeof value === 'string') {
      return value;
    }
  }
  return fallback;
}

export default function VouchersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { slug } = useTenant();
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;

  const [vouchers, setVouchers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [optionsMenuTarget, setOptionsMenuTarget] = useState<any>(null);

  const [assignTarget, setAssignTarget] = useState<any>(null);
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const loadVouchers = useCallback(
    async (shouldRefresh = false) => {
      if (shouldRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const data = await fetchVouchers({ slug } as any);
        setVouchers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching vouchers:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug]
  );

  const loadServices = useCallback(async () => {
    try {
      const data = await fetchAdminServices({ slug } as any);
      const list = Array.isArray(data) ? data : (data as any)?.results || [];
      setServices(list);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  }, [slug]);

  useEffect(() => {
    loadVouchers();
    loadServices();
  }, [loadVouchers, loadServices]);

  const onRefresh = () => {
    loadVouchers(true);
  };

  const handleCreate = () => {
    setSelectedVoucher(null);
    setFormError(null);
    setFormVisible(true);
  };

  const handleEdit = (voucher: any) => {
    setSelectedVoucher(voucher);
    setFormError(null);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setSelectedVoucher(null);
    setFormError(null);
  };

  const handleSubmitForm = async (payload: VoucherSubmitPayload) => {
    setFormBusy(true);
    setFormError(null);
    try {
      if (selectedVoucher) {
        const updated = await updateVoucher(selectedVoucher.id, { slug, ...payload });
        setVouchers((prev) => prev.map((v) => (v.id === selectedVoucher.id ? updated : v)));
      } else {
        const created = await createVoucher({ slug, ...payload });
        setVouchers((prev) => [created, ...prev]);
      }
      closeForm();
    } catch (error) {
      console.error('Error saving voucher:', error);
      setFormError(extractErrorMessage(error, t.saveError));
    } finally {
      setFormBusy(false);
    }
  };

  const handleDelete = (voucher: any) => {
    Alert.alert(t.deleteTitle, t.deleteMessage(voucher.code), [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.remove,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVoucher(voucher.id, { slug } as any);
            setVouchers((prev) => prev.filter((v) => v.id !== voucher.id));
          } catch (error) {
            console.error('Error deleting voucher:', error);
            Alert.alert(t.errorTitle, extractErrorMessage(error, t.deleteError));
          }
        },
      },
    ]);
  };

  const showOptions = (voucher: any) => {
    setOptionsMenuTarget(voucher);
  };

  const handleOpenAssign = (voucher: any) => {
    setAssignTarget(voucher);
    setAssignError(null);
  };

  const closeAssignModal = () => {
    setAssignTarget(null);
    setAssignError(null);
  };

  const handleAssignSubmit = async ({ client, sendEmail }: { client: any; sendEmail: boolean }) => {
    if (!assignTarget) return;
    setAssignBusy(true);
    setAssignError(null);
    try {
      if (sendEmail) {
        await sendVoucherEmail(assignTarget.id, client.id, { slug } as any);
      } else {
        await assignVoucher(assignTarget.id, client.id, { slug } as any);
      }
      closeAssignModal();
    } catch (error) {
      console.error('Error assigning voucher:', error);
      setAssignError(extractErrorMessage(error, t.assignError));
    } finally {
      setAssignBusy(false);
    }
  };

  const skipReasonLabel = (reason: string) => {
    if (reason === 'already_assigned') return t.skipAlreadyAssigned;
    if (reason === 'max_uses_exceeded') return t.skipMaxUses;
    return t.skipNotFound;
  };

  const handleAssignBulkSubmit = async (clients: any[]) => {
    if (!assignTarget) return;
    setAssignBusy(true);
    setAssignError(null);
    try {
      const result = await assignVoucherBulk(
        assignTarget.id,
        clients.map((client) => client.id),
        { slug } as any
      );
      const assignedCount = result?.assigned?.length || 0;
      const skipped: Array<{ client_id: any; reason: string }> = result?.skipped || [];
      closeAssignModal();
      loadVouchers();

      if (skipped.length === 0) {
        Alert.alert(t.assignBulkTitle, t.assignBulkSuccess(assignedCount));
        return;
      }
      const detail = skipped
        .map((item) => {
          const client = clients.find((c) => c.id === item.client_id);
          const name = client?.name || `#${item.client_id}`;
          return `${name} (${skipReasonLabel(item.reason)})`;
        })
        .join(', ');
      const message = [
        assignedCount > 0 ? t.assignBulkSuccess(assignedCount) : null,
        t.assignBulkSkipped(skipped.length, detail),
      ]
        .filter(Boolean)
        .join('\n');
      Alert.alert(t.assignBulkTitle, message);
    } catch (error) {
      console.error('Error bulk-assigning voucher:', error);
      setAssignError(extractErrorMessage(error, t.assignError));
    } finally {
      setAssignBusy(false);
    }
  };

  const statusForVoucher = (voucher: any) => {
    if (voucher.valid_until) {
      const today = new Date().toISOString().slice(0, 10);
      if (voucher.valid_until < today) {
        return { key: 'expired', label: t.statusExpired };
      }
    }
    return { key: 'active', label: t.statusActive };
  };

  const benefitLabel = (voucher: any) => {
    if (voucher.type === 'percent') return t.typePercent(String(voucher.value));
    if (voucher.type === 'fixed') return t.typeFixed(String(voucher.value));
    const service = services.find((s) => String(s.id) === String(voucher.service));
    return service ? `${t.typeFreeService}: ${service.name}` : t.typeFreeService;
  };

  const renderItem = ({ item }: { item: any }) => {
    const status = statusForVoucher(item);
    return (
      <View style={styles.card}>
        <Card
          testID={`voucher-item-${item.id}`}
          onPress={() => handleEdit(item)}
          onLongPress={() => showOptions(item)}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.code, { color: colors.textPrimary }]}>{item.code}</Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    status.key === 'expired' ? colors.error + '22' : colors.success + '22',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: status.key === 'expired' ? colors.error : colors.success },
                ]}
              >
                {status.label}
              </Text>
            </View>
          </View>
          <Text style={[styles.benefit, { color: colors.textSecondary }]}>{benefitLabel(item)}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {t.maxUses}: {item.max_uses}
            </Text>
            {item.valid_until && (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {t.validUntil}: {item.valid_until}
              </Text>
            )}
          </View>
          <TouchableOpacity
            testID={`voucher-assign-button-${item.id}`}
            onPress={() => handleOpenAssign(item)}
            style={styles.assignButton}
          >
            <Ionicons name="person-add-outline" size={16} color={colors.brandPrimary} />
            <Text style={[styles.assignButtonText, { color: colors.brandPrimary }]}>
              {t.assign}
            </Text>
          </TouchableOpacity>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          testID="vouchers-back-button"
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ marginBottom: 16, marginTop: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t.subtitle}</Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
            <TouchableOpacity
              onPress={handleCreate}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="add" size={18} color={colors.brandPrimary} />
              <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                {t.newVoucher}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={vouchers}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator size="small" color={colors.brandPrimary} style={styles.footerLoader} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.emptyTitle}</Text>
              <TouchableOpacity onPress={handleCreate} style={{ marginTop: 16 }}>
                <Text style={{ color: colors.brandPrimary, fontWeight: '600' }}>{t.addFirstVoucher}</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <VoucherFormModal
        visible={formVisible}
        onClose={closeForm}
        onSubmit={handleSubmitForm}
        initialData={selectedVoucher}
        services={services}
        busy={formBusy}
        errorMessage={formError}
      />

      <ActionMenu
        visible={!!optionsMenuTarget}
        onClose={() => setOptionsMenuTarget(null)}
        title={optionsMenuTarget?.code}
        options={[
          { label: t.edit, onPress: () => handleEdit(optionsMenuTarget) },
          { label: t.assign, onPress: () => handleOpenAssign(optionsMenuTarget) },
          { label: t.remove, onPress: () => handleDelete(optionsMenuTarget), destructive: true },
        ]}
      />

      <VoucherAssignModal
        visible={!!assignTarget}
        voucher={assignTarget}
        busy={assignBusy}
        errorMessage={assignError}
        onClose={closeAssignModal}
        onSubmit={handleAssignSubmit}
        onSubmitBulk={handleAssignBulkSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  listContent: { padding: 16, paddingTop: 0 },
  card: { marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  code: { fontSize: 16, fontWeight: '600' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  benefit: { fontSize: 14, marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  metaText: { fontSize: 13 },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    gap: 6,
  },
  assignButtonText: { fontSize: 13, fontWeight: '600' },
  footerLoader: { paddingVertical: 16 },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
