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

const COPY = {
  pt: {
    title: 'Dashboard',
    summaryWithName: (name: string) => `${name} • Resumo do seu negócio`,
    summaryFallback: 'admin • Resumo do seu negócio',
    credits: 'Créditos',
    creditsHint: 'Saldo disponível',
    bookingsToday: 'Agendamentos (hoje)',
    bookingsCompletedHint: (n: number | string) => `${n} concluídos`,
    clients: 'Clientes',
    clientsHint: (n: number | string) => `${n} registrados`,
    upcomingTitle: 'Próximos agendamentos',
    seeAll: 'Ver todos',
    emptyAppointmentsTitle: 'Sem agendamentos nas próximas horas',
    emptyAppointmentsDescription: 'Crie um novo agendamento ou abra horários disponíveis.',
    newAppointment: 'Novo agendamento',
    inventoryTitle: 'Estoque',
    emptyInventoryTitle: 'Nenhum item de estoque cadastrado',
    emptyInventoryDescription: 'Adicione o primeiro item para acompanhar quantidades e alertas.',
    addItem: 'Adicionar item',
  },
  en: {
    title: 'Dashboard',
    summaryWithName: (name: string) => `${name} • Business overview`,
    summaryFallback: 'admin • Business overview',
    credits: 'Credits',
    creditsHint: 'Available balance',
    bookingsToday: 'Appointments (today)',
    bookingsCompletedHint: (n: number | string) => `${n} completed`,
    clients: 'Clients',
    clientsHint: (n: number | string) => `${n} registered`,
    upcomingTitle: 'Upcoming appointments',
    seeAll: 'See all',
    emptyAppointmentsTitle: 'No appointments in the next few hours',
    emptyAppointmentsDescription: 'Create a new appointment or open available slots.',
    newAppointment: 'New appointment',
    inventoryTitle: 'Inventory',
    emptyInventoryTitle: 'No inventory items registered',
    emptyInventoryDescription: 'Add the first item to track quantities and alerts.',
    addItem: 'Add item',
  },
} as const;

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
  const t = language === 'en' ? COPY.en : COPY.pt;
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
              {t.title}
            </Text>

            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {tenant?.name ? t.summaryWithName(tenant.name) : t.summaryFallback}
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
              label={t.credits}
              value={loading ? '-' : data.stats.credits}
              icon="wallet-outline"
              actionIcon="refresh"
              onActionPress={handleRefreshCredits}
              hint={t.creditsHint}
              isPrimary
            />
          )}
          <StatCard
            label={t.bookingsToday}
            value={loading ? '-' : data.stats.bookings}
            hint={t.bookingsCompletedHint(data.stats.bookingsCompleted)}
          />
          <StatCard
            label={t.clients}
            value={loading ? '-' : data.stats.clients}
            hint={t.clientsHint(data.stats.clients)}
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
              {t.upcomingTitle}
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
                  {t.seeAll}
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
              title={t.emptyAppointmentsTitle}
              description={t.emptyAppointmentsDescription}
              actionLabel={t.newAppointment}
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
              {t.inventoryTitle}
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
                  {t.seeAll}
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
              title={t.emptyInventoryTitle}
              description={t.emptyInventoryDescription}
              actionLabel={t.addItem}
              onAction={() => navigation.navigate('Inventory', { openCreate: true })}
            />
          )}
        </View>

      </ScrollView >
    </SafeAreaView >
  );
}
