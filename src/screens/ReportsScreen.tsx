import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../utils/permissions';
import { StatCard } from '../components/DashboardComponents';
import { fetchBasicReports, fetchTopServices, fetchRevenue, fetchRetention, exportBasicReportsCSV } from '../api/reports';
import { saveAndShareCSV } from '../utils/csvFileSharing';
import { Button } from '../components/ui/Button';

type TabKey = 'basic' | 'business' | 'insights';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'basic', label: 'Básicos' },
  { key: 'business', label: 'Análise de Negócio' },
  { key: 'insights', label: 'Insights' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

function formatShortDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function ReportsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { userInfo } = useAuth();

  useEffect(() => {
    if (!isOwner(userInfo)) {
      navigation.goBack();
    }
  }, [userInfo, navigation]);

  const { from, to } = useMemo(() => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    return {
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0],
    };
  }, []);

  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [basic, setBasic] = useState<{ appointments_total: number; appointments_completed: number; revenue_total: number; avg_ticket: number } | null>(null);
  const [topServices, setTopServices] = useState<{ service_name: string; qty: number; revenue: number }[] | null>(null);
  const [revenueSeries, setRevenueSeries] = useState<{ period_start: string; revenue: number; appointment_count: number }[] | null>(null);
  const [retention, setRetention] = useState<{ new_clients: { qty: number; revenue: number }; returning_clients: { qty: number; revenue: number } } | null>(null);

  useEffect(() => {
    let active = true;
    fetchBasicReports({ from, to, slug }).then((data: any) => {
      if (!active) return;
      setBasic(data.overview);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível carregar os dados desta aba.');
    });
    return () => {
      active = false;
    };
  }, [from, to, slug]);

  useEffect(() => {
    if (activeTab !== 'business' || topServices !== null) return;
    let active = true;
    Promise.all([
      fetchTopServices({ from, to, limit: 10, slug }),
      fetchRevenue({ from, to, interval: 'week', slug }),
    ]).then(([topServicesData, revenueData]: any[]) => {
      if (!active) return;
      setTopServices(topServicesData.top_services || []);
      setRevenueSeries(revenueData.revenue?.series || []);
    }).catch(() => {
      if (!active) return;
      Alert.alert('Erro', 'Não foi possível carregar os dados desta aba.');
    });
    return () => {
      active = false;
    };
  }, [activeTab, from, to, slug, topServices]);

  useEffect(() => {
    if (activeTab !== 'insights' || retention !== null) return;
    let active = true;
    fetchRetention({ from, to, slug }).then((data: any) => {
      if (!active) return;
      setRetention(data);
    }).catch(() => {
      if (!active) return;
      Alert.alert('Erro', 'Não foi possível carregar os dados desta aba.');
    });
    return () => {
      active = false;
    };
  }, [activeTab, from, to, slug, retention]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const content = await exportBasicReportsCSV({ from, to, slug });
      await saveAndShareCSV(content, 'relatorio-basico.csv');
    } catch (error) {
      console.error('Error exporting basic report:', error);
      Alert.alert('Erro', 'Não foi possível exportar o relatório.');
    } finally {
      setExporting(false);
    }
  };

  if (!isOwner(userInfo)) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </SafeAreaView>
    );
  }

  const completionRate = basic && basic.appointments_total > 0
    ? `${((basic.appointments_completed / basic.appointments_total) * 100).toFixed(1)}%`
    : '0.0%';

  const maxRevenue = revenueSeries ? Math.max(1, ...revenueSeries.map((item) => item.revenue || 0)) : 1;

  const totalRetention = retention ? retention.new_clients.qty + retention.returning_clients.qty : 0;
  const retentionRate = totalRetention > 0 && retention
    ? `${((retention.returning_clients.qty / totalRetention) * 100).toFixed(1)}%`
    : '0.0%';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Relatórios</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabButton, { backgroundColor: active ? colors.brandPrimary : 'transparent' }]}
            >
              <Text style={{ color: active ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {activeTab === 'basic' && basic && (
          <>
            <StatCard label="Agendamentos Totais" value={basic.appointments_total} />
            <StatCard label="Agendamentos Concluídos" value={basic.appointments_completed} hint={`Taxa de conclusão: ${completionRate}`} />
            <StatCard label="Receita Total" value={formatCurrency(basic.revenue_total)} isPrimary />
            <StatCard label="Ticket Médio" value={formatCurrency(basic.avg_ticket)} />

            <Button onPress={handleExportCSV} loading={exporting} disabled={exporting}>
              Exportar CSV
            </Button>
          </>
        )}

        {activeTab === 'business' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Serviços</Text>
            {topServices === null ? (
              <ActivityIndicator size="small" color={colors.brandPrimary} style={{ marginBottom: 16 }} />
            ) : (
              topServices.map((service) => (
                <View key={service.service_name} style={[styles.serviceRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{service.service_name}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{service.qty} agendamentos</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{formatCurrency(service.revenue)}</Text>
                  </View>
                </View>
              ))
            )}

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>Receita por semana</Text>
            {revenueSeries === null ? (
              <ActivityIndicator size="small" color={colors.brandPrimary} />
            ) : (
              <View style={styles.barChartRow}>
                {revenueSeries.map((item) => (
                  <View key={item.period_start} style={styles.barColumn}>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, marginBottom: 4 }}>
                      {formatCurrency(item.revenue)}
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(4, (item.revenue / maxRevenue) * 100),
                          backgroundColor: colors.brandPrimary,
                        },
                      ]}
                    />
                    <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>
                      {formatShortDate(item.period_start)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === 'insights' && (
          <>
            <StatCard label="Taxa de Retenção" value={retentionRate} isPrimary />
            {retention === null ? (
              <ActivityIndicator size="small" color={colors.brandPrimary} />
            ) : (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.retentionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Novos</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>{retention.new_clients.qty}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatCurrency(retention.new_clients.revenue)}</Text>
                </View>
                <View style={[styles.retentionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Recorrentes</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>{retention.returning_clients.qty}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatCurrency(retention.returning_clients.revenue)}</Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  serviceRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 4,
  },
  retentionCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
});
