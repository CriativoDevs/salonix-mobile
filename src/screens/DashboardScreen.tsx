import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { useLanguage } from '../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { StatCard, AppointmentCard, EmptyAppointmentsState } from '../components/DashboardComponents';
import useDashboardData from '../hooks/useDashboardData';
import { useAuth } from '../hooks/useAuth';
import { HeaderMenu } from '../components/HeaderMenu';
import { ThemeToggle } from '../components/ThemeToggle';

export default function DashboardScreen({ navigation }: any) {
  const { colors, toggleTheme, theme } = useTheme();
  const { tenant } = useTenant();
  const { data, loading, refetch } = useDashboardData();
  const { logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [menuVisible, setMenuVisible] = useState(false);

  const isDark = theme === 'dark';

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

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
          language={language}
          onToggleLanguage={() => {
            const nextLang = language === "pt" ? "en" : "pt";
            setLanguage(nextLang);
          }}
        />

        <View className="mb-6">
          <StatCard
            label="Créditos"
            value={loading ? '-' : data.stats.credits}
            icon="wallet-outline"
            actionIcon="refresh"
            onActionPress={handleRefreshCredits}
            hint="Saldo disponível"
            isPrimary
          />
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

      </ScrollView >
    </SafeAreaView >
  );
}
