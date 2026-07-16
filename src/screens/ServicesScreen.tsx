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
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function ServicesScreen() {
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { userInfo } = useAuth();

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);

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
    Alert.alert('Importar/Exportar', 'Escolha uma opção', [
      { text: 'Importar CSV', onPress: () => setImportModalVisible(true) },
      { text: 'Exportar CSV', onPress: handleExportServicesCSV },
      { text: 'Cancelar', style: 'cancel' },
    ]);
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
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Editar', 'Excluir'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleEdit(service);
          if (buttonIndex === 2) handleDelete(service);
        }
      );
    } else {
      Alert.alert('Opções', `Selecione uma ação para ${service.name}`, [
        { text: 'Editar', onPress: () => handleEdit(service) },
        { text: 'Excluir', onPress: () => handleDelete(service), style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
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
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: 'bold', marginBottom: 4 }}>
            Serviços
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {services.length} serviços
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
            <TouchableOpacity
              onPress={handleCreate}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="add" size={18} color={colors.brandPrimary} />
              <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                Novo serviço
              </Text>
            </TouchableOpacity>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingTop: 0 },
  card: { marginBottom: 12 },
  serviceName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaText: { fontSize: 14 },
  footerLoader: { paddingVertical: 16 },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
