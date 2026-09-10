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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Card } from '../components/ui/Card';
import {
  fetchInventoryItems,
  fetchInventoryAlerts,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createStockMovement,
} from '../api/inventory';
import { InventoryItemFormModal } from '../components/InventoryItemFormModal';
import { StockMovementModal } from '../components/StockMovementModal';
import { useTenant } from '../hooks/useTenant';
import { ActionMenu } from '../components/ui/ActionMenu';

function extractErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }
  }
  return fallback;
}

export default function InventoryScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { slug } = useTenant();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [alerts, setAlerts] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [optionsMenuTarget, setOptionsMenuTarget] = useState<any>(null);

  const [movementTarget, setMovementTarget] = useState<any>(null);
  const [movementBusy, setMovementBusy] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);

  const loadItems = useCallback(
    async (shouldRefresh = false) => {
      if (shouldRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const data = await fetchInventoryItems({ slug } as any);
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching inventory items:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug]
  );

  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchInventoryAlerts({ slug } as any);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
    }
  }, [slug]);

  useEffect(() => {
    loadItems();
    loadAlerts();
  }, [loadItems, loadAlerts]);

  useEffect(() => {
    if (route.params?.openCreate) {
      setSelectedItem(null);
      setModalVisible(true);
      navigation.setParams({ openCreate: undefined } as any);
    }
  }, [route.params?.openCreate, navigation]);

  const onRefresh = () => {
    loadItems(true);
    loadAlerts();
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setModalVisible(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleSave = async (data: any) => {
    setActionLoading(true);
    try {
      if (selectedItem) {
        const updated = await updateInventoryItem(selectedItem.id, { slug, ...data });
        setItems((prev) => prev.map((i) => (i.id === selectedItem.id ? { ...i, ...updated } : i)));
      } else {
        const created = await createInventoryItem({ slug, ...data });
        setItems((prev) => [created, ...prev]);
      }
      setModalVisible(false);
      loadAlerts();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      Alert.alert('Erro', 'Não foi possível salvar o item.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (item: any) => {
    Alert.alert('Remover Item', `Tem certeza que deseja remover ${item.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteInventoryItem(item.id);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
            loadAlerts();
          } catch (error) {
            console.error('Error deleting inventory item:', error);
            Alert.alert('Erro', 'Não foi possível remover o item.');
          }
        },
      },
    ]);
  };

  const showOptions = (item: any) => {
    setOptionsMenuTarget(item);
  };

  const handleOpenMovement = (item: any) => {
    setMovementTarget(item);
    setMovementError(null);
  };

  const closeMovementModal = () => {
    setMovementTarget(null);
    setMovementError(null);
  };

  const handleMovementSubmit = async (data: { movement_type: 'in' | 'out'; quantity: number; notes: string }) => {
    if (!movementTarget) return;
    setMovementBusy(true);
    setMovementError(null);
    try {
      await createStockMovement({ slug, item: movementTarget.id, ...data });
      const delta = data.movement_type === 'in' ? data.quantity : -data.quantity;
      setItems((prev) =>
        prev.map((i) =>
          i.id === movementTarget.id ? { ...i, quantity: Number(i.quantity) + delta } : i
        )
      );
      closeMovementModal();
      loadAlerts();
    } catch (error) {
      console.error('Error creating stock movement:', error);
      setMovementError(
        extractErrorMessage(error, 'Não foi possível registrar a movimentação.')
      );
    } finally {
      setMovementBusy(false);
    }
  };

  const isLowStock = (item: any) => {
    if (item.minimum_quantity == null) return false;
    return Number(item.quantity) <= Number(item.minimum_quantity);
  };

  const renderItem = ({ item }: { item: any }) => {
    const lowStock = isLowStock(item);
    return (
      <View style={styles.card}>
        <Card
          testID={`inventory-item-${item.id}`}
          onPress={() => handleEdit(item)}
          onLongPress={() => showOptions(item)}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
            {lowStock && (
              <View style={[styles.badge, { backgroundColor: colors.error + '22' }]}>
                <Ionicons name="alert-circle-outline" size={12} color={colors.error} />
                <Text style={[styles.badgeText, { color: colors.error }]}>Estoque baixo</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {item.quantity} {item.unit}
            </Text>
            {item.minimum_quantity != null && (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                Mínimo: {item.minimum_quantity} {item.unit}
              </Text>
            )}
          </View>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          testID="inventory-back-button"
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Estoque</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {alerts.length > 0 && (
          <View
            testID="inventory-alerts-section"
            style={[
              styles.alertsSection,
              { backgroundColor: colors.error + '11', borderColor: colors.error + '33' },
            ]}
          >
            <View style={styles.alertsHeader}>
              <Ionicons name="warning-outline" size={16} color={colors.error} />
              <Text style={[styles.alertsTitle, { color: colors.error }]}>
                Alertas de estoque ({alerts.length})
              </Text>
            </View>
            {alerts.map((alert) => (
              <View key={alert.id} style={styles.alertRow}>
                <Text style={[styles.alertItemName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {alert.name}
                </Text>
                <Text style={[styles.alertItemQty, { color: colors.error }]}>
                  {alert.quantity} / mín. {alert.minimum_quantity} {alert.unit}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginBottom: 16, marginTop: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{items.length} itens</Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
            <TouchableOpacity
              onPress={handleCreate}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="add" size={18} color={colors.brandPrimary} />
              <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                Novo item
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={items}
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
                Nenhum item de estoque cadastrado.
              </Text>
              <TouchableOpacity onPress={handleCreate} style={{ marginTop: 16 }}>
                <Text style={{ color: colors.brandPrimary, fontWeight: '600' }}>
                  Adicionar primeiro item
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <InventoryItemFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSave}
        initialData={selectedItem}
        busy={actionLoading}
      />

      <ActionMenu
        visible={!!optionsMenuTarget}
        onClose={() => setOptionsMenuTarget(null)}
        title={optionsMenuTarget?.name}
        options={[
          { label: 'Editar', onPress: () => handleEdit(optionsMenuTarget) },
          { label: 'Registrar movimentação', onPress: () => handleOpenMovement(optionsMenuTarget) },
          { label: 'Remover', onPress: () => handleDelete(optionsMenuTarget), destructive: true },
        ]}
      />

      <StockMovementModal
        visible={!!movementTarget}
        onClose={closeMovementModal}
        onSubmit={handleMovementSubmit}
        item={movementTarget}
        busy={movementBusy}
        errorMessage={movementError}
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
  alertsSection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  alertsTitle: { fontSize: 13, fontWeight: '700' },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 8,
  },
  alertItemName: { fontSize: 13, flexShrink: 1 },
  alertItemQty: { fontSize: 12, fontWeight: '600' },
  card: { marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  itemName: { fontSize: 16, fontWeight: '600' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaText: { fontSize: 14 },
  footerLoader: { paddingVertical: 16 },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
