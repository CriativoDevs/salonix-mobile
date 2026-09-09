import React, { useState, useEffect, useCallback } from 'react';
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
import { Card } from '../components/ui/Card';
import { fetchAdminServices, createService, updateService, deleteService, exportServicesCSV } from '../api/services';
import { ServiceFormModal } from '../components/ServiceFormModal';
import { ImportServicesModal } from '../components/ImportServicesModal';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../utils/permissions';
import { saveAndShareCSV } from '../utils/csvFileSharing';
import { ActionMenu } from '../components/ui/ActionMenu';

export default function ServicesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { slug } = useTenant();
  const { userInfo } = useAuth();
  const isAdmin = userInfo?.is_superuser || userInfo?.role === 'owner' || userInfo?.role === 'manager';

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importExportMenuVisible, setImportExportMenuVisible] = useState(false);
  const [optionsMenuTarget, setOptionsMenuTarget] = useState<any>(null);

  const loadServices = useCallback(
    async (shouldRefresh = false) => {
      if (shouldRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const data = await fetchAdminServices({ slug } as any);
        const results = Array.isArray(data) ? data : data.results || [];
        setServices(results);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const onRefresh = () => loadServices(true);

  const handleExportServicesCSV = async () => {
    try {
      const content = await exportServicesCSV({ slug } as any);
      await saveAndShareCSV(content, 'servicos.csv');
    } catch (error) {
      console.error('Error exporting services:', error);
      Alert.alert('Erro', 'Não foi possível exportar os serviços.');
    }
  };

  const handleImportExport = () => {
    setImportExportMenuVisible(true);
  };

  const handleImportSuccess = () => {
    loadServices(true);
  };

  const handleCreate = () => {
    setSelectedService(null);
    setModalVisible(true);
  };

  const handleEdit = (service: any) => {
    setSelectedService(service);
    setModalVisible(true);
  };

  const handleSave = async (data: any) => {
    setActionLoading(true);
    try {
      if (selectedService) {
        const updated = await updateService(selectedService.id, data);
        setServices((prev) =>
          prev.map((s) => (s.id === selectedService.id ? { ...s, ...updated } : s))
        );
      } else {
        const created = await createService(data);
        setServices((prev) => [created, ...prev]);
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Erro', 'Não foi possível salvar o serviço.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (service: any) => {
    Alert.alert('Excluir Serviço', `Tem certeza que deseja excluir ${service.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteService(service.id);
            setServices((prev) => prev.filter((s) => s.id !== service.id));
          } catch (error) {
            console.error('Error deleting service:', error);
            Alert.alert('Erro', 'Não foi possível excluir o serviço.');
          }
        },
      },
    ]);
  };

  const showOptions = (service: any) => {
    setOptionsMenuTarget(service);
  };

  const formatPrice = (value: any) => {
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed)) return String(value);
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(parsed);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Card onPress={() => handleEdit(item)} onLongPress={() => showOptions(item)}>
        <Text style={[styles.serviceName, { color: colors.textPrimary }]}>{item.name}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {formatPrice(item.price_eur)}
          </Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {item.duration_minutes} min
          </Text>
        </View>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          testID="services-back-button"
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Serviços</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {services.length} serviços
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
            {isAdmin && (
              <TouchableOpacity
                onPress={handleCreate}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="add" size={18} color={colors.brandPrimary} />
                <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                  Novo serviço
                </Text>
              </TouchableOpacity>
            )}

            {isOwner(userInfo) && (
              <TouchableOpacity
                onPress={handleImportExport}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="swap-vertical-outline" size={18} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                  Importar/Exportar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={services}
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
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhum serviço encontrado.
              </Text>
              <TouchableOpacity onPress={handleCreate} style={{ marginTop: 16 }}>
                <Text style={{ color: colors.brandPrimary, fontWeight: '600' }}>
                  Adicionar novo serviço
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <ServiceFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSave}
        initialData={selectedService}
        busy={actionLoading}
      />

      <ImportServicesModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
        slug={slug}
      />

      <ActionMenu
        visible={importExportMenuVisible}
        onClose={() => setImportExportMenuVisible(false)}
        title="Importar/Exportar"
        options={[
          { label: 'Importar CSV', onPress: () => setImportModalVisible(true) },
          { label: 'Exportar CSV', onPress: handleExportServicesCSV },
        ]}
      />

      <ActionMenu
        visible={!!optionsMenuTarget}
        onClose={() => setOptionsMenuTarget(null)}
        title={optionsMenuTarget?.name}
        options={[
          { label: 'Editar', onPress: () => handleEdit(optionsMenuTarget) },
          { label: 'Excluir', onPress: () => handleDelete(optionsMenuTarget), destructive: true },
        ]}
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
  serviceName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaText: { fontSize: 14 },
  footerLoader: { paddingVertical: 16 },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
