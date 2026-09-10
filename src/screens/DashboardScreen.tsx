import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { useLanguage } from '../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { StatCard, AppointmentCard, EmptyAppointmentsState, InventoryAlertRow } from '../components/DashboardComponents';
import useDashboardData from '../hooks/useDashboardData';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../utils/permissions';
import { HeaderMenu } from '../components/HeaderMenu';
import { ThemeToggle } from '../components/ThemeToggle';
import { fetchInventoryItems } from '../api/inventory';

const INVENTORY_SHORTCUT_LIMIT = 4;

const isLowStockItem = (item: any) => {
  const min = item?.minimum_quantity;
  if (min == null || Number(min) <= 0) return false;
  return Number(item?.quantity) <= Number(min);
};

export default function DashboardScreen({ navigation }: any) {
  const { colors, toggleTheme, theme } = useTheme();
  const { tenant } = useTenant();
  const { data, loading, refetch } = useDashboardData();
  const { logout, userInfo } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [menuVisible, setMenuVisible] = useState(false);

  const isDark = theme === 'dark';

  const [inventoryShortcut, setInventoryShortcut] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  const loadInventoryShortcut = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const items = await fetchInventoryItems({ slug: tenant?.slug } as any);
      const lowStock = items.filter(isLowStockItem);
      let selected = lowStock;
      if (selected.length < INVENTORY_SHORTCUT_LIMIT) {
        const rest = items
          .filter((item: any) => !isLowStockItem(item))
          .sort((a: any, b: any) => {
            const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
            return tb - ta;
          });
        selected = [...lowStock, ...rest];
      }
      setInventoryShortcut(selected.slice(0, INVENTORY_SHORTCUT_LIMIT));
    } catch {
      setInventoryShortcut([]);
    } finally {
      setInventoryLoading(false);
    }
  }, [tenant?.slug]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      loadInventoryShortcut();
    }, [refetch, loadInventoryShortcut])
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([refetch(), loadInventoryShortcut()]).finally(() => setRefreshing(false));
  }, [refetch, loadInventoryShortcut]);

  const handleRefreshCredits = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brandPrimary}
            colors={[colors.brandPrimary]}
          />
        }
      >
        <View style={{ marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text className="text-3xl font-bold" style={{ color: colors.textPrimary, marginBottom: 4 }}>
              Dashboard
            </Text>

            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {tenant?.name
                ? `${tenant.name} • Resumo do seu negócio`
                : 'admin • Resumo do seu negócio'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: colors.surfaceVariant,
              }}
            >
              <Ionicons name="menu-outline" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <HeaderMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onLogout={logout}
          onNavigateToAccount={() => navigation.navigate('Account' as never)}
          onNavigateToSettings={() => navigation.navigate('Settings' as never)}
          language={language}
          onToggleLanguage={() => {
            const nextLang = language === "pt" ? "en" : "pt";
            setLanguage(nextLang);
          }}
        />

        <View className="mb-6">
          {isOwner(userInfo) && (
            <StatCard
              label="Créditos"
              value={loading ? '-' : data.stats.credits}
              icon="wallet-outline"
              actionIcon="refresh"
              onActionPress={handleRefreshCredits}
              hint="Saldo disponível"
              isPrimary
            />
          )}
          <StatCard
            label="Agendamentos (hoje)"
            value={loading ? '-' : data.stats.bookings}
            hint={`${data.stats.bookingsCompleted} concluídos`}
          />
          <StatCard
            label="Clientes"
            value={loading ? '-' : data.stats.clients}
            hint={`${data.stats.clients} registrados`}
          />
        </View>

        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: '600',
              }}
            >
              Próximos agendamentos
            </Text>

            {data.upcoming.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Agendamentos')}>
                <Text
                  style={{
                    color: colors.brandPrimary,
                    fontSize: 13,
                    fontWeight: '500',
                  }}
                >
                  Ver todos
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View>
              {[1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    height: 72,
                    borderRadius: 12,
                    backgroundColor: colors.surfaceVariant,
                    marginBottom: 8,
                  }}
                />
              ))}
            </View>
          ) : data.upcoming.length > 0 ? (
            <View>
              {data.upcoming.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onPress={() => { }}
                />
              ))}
            </View>
          ) : (
            <EmptyAppointmentsState
              title="Sem agendamentos nas próximas horas"
              description="Crie um novo agendamento ou abra horários disponíveis."
              actionLabel="Novo agendamento"
              onAction={() => navigation.navigate('Agendamentos')}
            />
          )}
        </View>

        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: '600',
              }}
            >
              Estoque
            </Text>

            {!inventoryLoading && inventoryShortcut.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Inventory')}>
                <Text
                  style={{
                    color: colors.brandPrimary,
                    fontSize: 13,
                    fontWeight: '500',
                  }}
                >
                  Ver todos
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {inventoryLoading ? (
            <View>
              {[1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: colors.surfaceVariant,
                    marginBottom: 8,
                  }}
                />
              ))}
            </View>
          ) : inventoryShortcut.length > 0 ? (
            <View>
              {inventoryShortcut.map((item) => (
                <InventoryAlertRow
                  key={item.id}
                  name={item.name}
                  quantity={item.quantity}
                  unit={item.unit}
                  lowStock={isLowStockItem(item)}
                  onPress={() => navigation.navigate('Inventory')}
                />
              ))}
            </View>
          ) : (
            <EmptyAppointmentsState
              title="Nenhum item de estoque cadastrado"
              description="Adicione o primeiro item para acompanhar quantidades e alertas."
              actionLabel="Adicionar item"
              onAction={() => navigation.navigate('Inventory', { openCreate: true })}
            />
          )}
        </View>

      </ScrollView >
    </SafeAreaView >
  );
}
