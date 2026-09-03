import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../utils/permissions';
import { StatCard } from '../components/DashboardComponents';
import { DatePickerInput } from '../components/DatePickerInput';
import { fetchBasicReports, fetchTopServices, fetchRevenue, fetchRetention, exportBasicReportsCSV } from '../api/reports';
import { fetchProfessionals } from '../api/professionals';
import { fetchServices } from '../api/services';
import { saveAndShareCSV } from '../utils/csvFileSharing';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

type TabKey = 'basic' | 'business' | 'insights';
type IntervalKey = 'day' | 'week' | 'month';
type SectionError = 'forbidden' | 'network' | null;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'basic', label: 'Básicos' },
  { key: 'business', label: 'Análise de Negócio' },
  { key: 'insights', label: 'Insights' },
];

const INTERVAL_OPTIONS: { value: IntervalKey; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
];

const LIMIT_OPTIONS = [10, 25, 50, 100];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value || 0);
}

function formatShortDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDefaultRange() {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: formatDate(firstOfMonth),
    to: formatDate(now),
  };
}

function getErrorKind(error: any): SectionError {
  return error?.response?.status === 403 ? 'forbidden' : 'network';
}

type Filters = {
  from: string;
  to: string;
  professionalId: string;
  serviceId: string;
  interval: IntervalKey;
  limit: number;
};

function getDefaultFilters(): Filters {
  const { from, to } = getDefaultRange();
  return { from, to, professionalId: '', serviceId: '', interval: 'week', limit: 10 };
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

  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [revenueView, setRevenueView] = useState<'chart' | 'table'>('chart');
  const [professionalPickerOpen, setProfessionalPickerOpen] = useState(false);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);

  const [applied, setApplied] = useState<Filters>(getDefaultFilters);
  const [draft, setDraft] = useState<Filters>(applied);

  const { from, to, professionalId, serviceId, interval, limit } = applied;

  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [basic, setBasic] = useState<{ appointments_total: number; appointments_completed: number; revenue_total: number; avg_ticket: number } | null>(null);
  const [topServices, setTopServices] = useState<{ service_name: string; qty: number; revenue: number }[] | null>(null);
  const [revenueSeries, setRevenueSeries] = useState<{ period_start: string; revenue: number; appointment_count: number }[] | null>(null);
  const [retention, setRetention] = useState<{ new_clients: { qty: number; revenue: number }; returning_clients: { qty: number; revenue: number } } | null>(null);

  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessError, setBusinessError] = useState<SectionError>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<SectionError>(null);

  const lastBusinessKeyRef = useRef<string | null>(null);
  const lastInsightsKeyRef = useRef<string | null>(null);

  // Load professionals/services once for the filter pickers (business/insights tabs).
  useEffect(() => {
    let active = true;
    fetchProfessionals({ slug, limit: 100 } as any).then((data: any) => {
      if (!active) return;
      setProfessionals(Array.isArray(data) ? data : data.results || []);
    }).catch(() => {});
    fetchServices({ slug } as any).then((data: any) => {
      if (!active) return;
      setServices(Array.isArray(data) ? data : data.results || []);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;
    fetchBasicReports({ from, to, slug }).then((data: any) => {
      if (!active) return;
      setBasic(data.overview);
    }).catch(() => {
      if (!active) return;
      Alert.alert('Erro', 'Não foi possível carregar os dados desta aba.');
    }).finally(() => {
      if (!active) return;
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [from, to, slug]);

  const businessKey = useMemo(
    () => JSON.stringify({ from, to, professionalId, serviceId, interval, limit, slug }),
    [from, to, professionalId, serviceId, interval, limit, slug]
  );

  const fetchBusinessData = async () => {
    setBusinessLoading(true);
    setBusinessError(null);
    try {
      const [topServicesData, revenueData] = await Promise.all([
        fetchTopServices({
          from,
          to,
          limit,
          professionalId: professionalId || undefined,
          serviceId: serviceId || undefined,
          slug,
        }),
        fetchRevenue({ from, to, interval, slug }),
      ]);
      setTopServices(Array.isArray(topServicesData) ? topServicesData : topServicesData?.top_services || []);
      setRevenueSeries(revenueData?.series || []);
      lastBusinessKeyRef.current = businessKey;
    } catch (error: any) {
      const kind = getErrorKind(error);
      setBusinessError(kind);
      if (kind !== 'forbidden') {
        Alert.alert('Erro', 'Não foi possível carregar os dados desta aba.');
      }
    } finally {
      setBusinessLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'business') return;
    if (lastBusinessKeyRef.current === businessKey) return;
    fetchBusinessData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, businessKey]);

  const insightsKey = useMemo(
    () => JSON.stringify({ from, to, professionalId, slug }),
    [from, to, professionalId, slug]
  );

  const fetchInsightsData = async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const data = await fetchRetention({ from, to, professionalId: professionalId || undefined, slug });
      setRetention(data);
      lastInsightsKeyRef.current = insightsKey;
    } catch (error: any) {
      const kind = getErrorKind(error);
      setInsightsError(kind);
      if (kind !== 'forbidden') {
        Alert.alert('Erro', 'Não foi possível carregar os dados desta aba.');
      }
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'insights') return;
    if (lastInsightsKeyRef.current === insightsKey) return;
    fetchInsightsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, insightsKey]);

  const handleApplyFilters = () => {
    setApplied(draft);
    setFiltersOpen(false);
  };

  const handleClearFilters = () => {
    const defaults = getDefaultFilters();
    setDraft(defaults);
    setApplied(defaults);
    setFiltersOpen(false);
  };

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

  const intervalLabel = INTERVAL_OPTIONS.find((option) => option.value === interval)?.label || 'período';

  const draftProfessionalLabel = draft.professionalId
    ? professionals.find((prof: any) => String(prof.id) === draft.professionalId)?.name || 'Todos'
    : 'Todos';
  const draftServiceLabel = draft.serviceId
    ? services.find((service: any) => String(service.id) === draft.serviceId)?.name || 'Todos'
    : 'Todos';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Relatórios</Text>
        <TouchableOpacity onPress={() => setFiltersOpen((prev) => !prev)} style={styles.backBtn} testID="toggle-filters">
          <Ionicons name="options-outline" size={22} color={colors.brandPrimary} />
        </TouchableOpacity>
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
        {filtersOpen && (
          <View style={[styles.filtersBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Filtros</Text>

            <DatePickerInput
              label="Data inicial"
              placeholder="Selecione uma data"
              value={draft.from}
              onDateChange={(date) => setDraft((prev) => ({ ...prev, from: date }))}
            />
            <DatePickerInput
              label="Data final"
              placeholder="Selecione uma data"
              value={draft.to}
              onDateChange={(date) => setDraft((prev) => ({ ...prev, to: date }))}
            />

            {(activeTab === 'business' || activeTab === 'insights') && (
              <View style={styles.inputGroup}>
                <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Profissional</Text>
                <TouchableOpacity
                  testID="reports-professional-picker-trigger"
                  onPress={() => setProfessionalPickerOpen(true)}
                  style={[styles.pickerTrigger, { borderColor: colors.border, backgroundColor: colors.background }]}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{draftProfessionalLabel}</Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'business' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Serviço</Text>
                <TouchableOpacity
                  testID="reports-service-picker-trigger"
                  onPress={() => setServicePickerOpen(true)}
                  style={[styles.pickerTrigger, { borderColor: colors.border, backgroundColor: colors.background }]}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{draftServiceLabel}</Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'business' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Intervalo de Tempo</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {INTERVAL_OPTIONS.map((option) => {
                      const active = draft.interval === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => setDraft((prev) => ({ ...prev, interval: option.value }))}
                          style={[
                            styles.periodOption,
                            { borderColor: active ? colors.brandPrimary : colors.border, backgroundColor: active ? colors.brandPrimary : 'transparent' },
                          ]}
                        >
                          <Text style={{ color: active ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Itens por Página</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {LIMIT_OPTIONS.map((option) => {
                      const active = draft.limit === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          onPress={() => setDraft((prev) => ({ ...prev, limit: option }))}
                          style={[
                            styles.periodOption,
                            { borderColor: active ? colors.brandPrimary : colors.border, backgroundColor: active ? colors.brandPrimary : 'transparent' },
                          ]}
                        >
                          <Text style={{ color: active ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <TouchableOpacity onPress={handleClearFilters}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleApplyFilters}>
                <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: '600' }}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
            {businessLoading && (
              <ActivityIndicator size="small" color={colors.brandPrimary} style={{ marginBottom: 16 }} />
            )}

            {!businessLoading && businessError === 'forbidden' && (
              <View style={[styles.banner, { backgroundColor: colors.warningBackground, borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
                  O seu plano atual não inclui a Análise de Negócio.
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('CreditsPlan' as never)} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.brandPrimary, fontWeight: '600', fontSize: 13 }}>Ver planos</Text>
                </TouchableOpacity>
              </View>
            )}

            {!businessLoading && businessError === 'network' && (
              <View style={[styles.banner, { backgroundColor: colors.errorBackground, borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
                  Não foi possível carregar os dados desta aba.
                </Text>
                <TouchableOpacity onPress={fetchBusinessData} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.brandPrimary, fontWeight: '600', fontSize: 13 }}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}

            {!businessLoading && !businessError && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Serviços</Text>
                {topServices && topServices.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
                    Nenhum dado no período selecionado.
                  </Text>
                ) : (
                  topServices?.map((service) => (
                    <View key={service.service_name} style={[styles.serviceRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                      <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{service.service_name}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{service.qty} agendamentos</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{formatCurrency(service.revenue)}</Text>
                      </View>
                    </View>
                  ))
                )}

                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>Receita por {intervalLabel}</Text>
                {revenueSeries && revenueSeries.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    Nenhum dado no período selecionado.
                  </Text>
                ) : (
                  <>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <TouchableOpacity
                        testID="revenue-view-chart"
                        onPress={() => setRevenueView('chart')}
                        style={[
                          styles.periodOption,
                          {
                            borderColor: revenueView === 'chart' ? colors.brandPrimary : colors.border,
                            backgroundColor: revenueView === 'chart' ? colors.brandPrimary : 'transparent',
                          },
                        ]}
                      >
                        <Text style={{ color: revenueView === 'chart' ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                          Gráfico
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="revenue-view-table"
                        onPress={() => setRevenueView('table')}
                        style={[
                          styles.periodOption,
                          {
                            borderColor: revenueView === 'table' ? colors.brandPrimary : colors.border,
                            backgroundColor: revenueView === 'table' ? colors.brandPrimary : 'transparent',
                          },
                        ]}
                      >
                        <Text style={{ color: revenueView === 'table' ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
                          Tabela
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {revenueView === 'chart' ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.barChartRow}>
                          {revenueSeries?.map((item) => (
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
                      </ScrollView>
                    ) : (
                      <View style={[styles.table, { borderColor: colors.border, backgroundColor: colors.surface }]} testID="revenue-table">
                        <View style={[styles.tableRow, styles.tableHeaderRow, { borderColor: colors.border }]}>
                          <Text style={[styles.tableCell, styles.tableHeaderCell, { color: colors.textSecondary, flex: 1.2 }]}>Período</Text>
                          <Text style={[styles.tableCell, styles.tableHeaderCell, { color: colors.textSecondary, flex: 1 }]}>Receita</Text>
                          <Text style={[styles.tableCell, styles.tableHeaderCell, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>
                            Agend.
                          </Text>
                        </View>
                        {revenueSeries?.map((item) => (
                          <View key={item.period_start} style={[styles.tableRow, { borderColor: colors.border }]}>
                            <Text style={[styles.tableCell, { color: colors.textPrimary, flex: 1.2 }]}>
                              {formatShortDate(item.period_start)}
                            </Text>
                            <Text style={[styles.tableCell, { color: colors.textPrimary, flex: 1 }]}>
                              {formatCurrency(item.revenue)}
                            </Text>
                            <Text style={[styles.tableCell, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}>
                              {item.appointment_count}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'insights' && (
          <>
            {insightsLoading && (
              <ActivityIndicator size="small" color={colors.brandPrimary} style={{ marginBottom: 16 }} />
            )}

            {!insightsLoading && insightsError === 'forbidden' && (
              <View style={[styles.banner, { backgroundColor: colors.warningBackground, borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
                  O seu plano atual não inclui os Insights.
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('CreditsPlan' as never)} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.brandPrimary, fontWeight: '600', fontSize: 13 }}>Ver planos</Text>
                </TouchableOpacity>
              </View>
            )}

            {!insightsLoading && insightsError === 'network' && (
              <View style={[styles.banner, { backgroundColor: colors.errorBackground, borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
                  Não foi possível carregar os dados desta aba.
                </Text>
                <TouchableOpacity onPress={fetchInsightsData} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.brandPrimary, fontWeight: '600', fontSize: 13 }}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}

            {!insightsLoading && !insightsError && (
              <>
                <StatCard label="Taxa de Retenção" value={retentionRate} isPrimary />
                {retention && totalRetention === 0 ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    Nenhum dado no período selecionado.
                  </Text>
                ) : retention ? (
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
                ) : null}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={professionalPickerOpen}
        onClose={() => setProfessionalPickerOpen(false)}
        title="Profissional"
        footer={
          <Button onPress={() => setProfessionalPickerOpen(false)} style={{ flex: 1 }}>
            Concluir
          </Button>
        }
      >
        <Picker
          key={`professional-picker-${professionals.length}`}
          testID="reports-professional-picker"
          selectedValue={draft.professionalId}
          onValueChange={(value) => setDraft((prev) => ({ ...prev, professionalId: String(value) }))}
          style={{ color: colors.textPrimary }}
          itemStyle={{ color: colors.textPrimary }}
          dropdownIconColor={colors.textPrimary}
        >
          <Picker.Item label="Todos" value="" color={colors.textPrimary} />
          {professionals.map((prof: any) => (
            <Picker.Item key={prof.id} label={prof.name} value={String(prof.id)} color={colors.textPrimary} />
          ))}
        </Picker>
      </Modal>

      <Modal
        visible={servicePickerOpen}
        onClose={() => setServicePickerOpen(false)}
        title="Serviço"
        footer={
          <Button onPress={() => setServicePickerOpen(false)} style={{ flex: 1 }}>
            Concluir
          </Button>
        }
      >
        <Picker
          key={`service-picker-${services.length}`}
          testID="reports-service-picker"
          selectedValue={draft.serviceId}
          onValueChange={(value) => setDraft((prev) => ({ ...prev, serviceId: String(value) }))}
          style={{ color: colors.textPrimary }}
          itemStyle={{ color: colors.textPrimary }}
          dropdownIconColor={colors.textPrimary}
        >
          <Picker.Item label="Todos" value="" color={colors.textPrimary} />
          {services.map((service: any) => (
            <Picker.Item key={service.id} label={service.name} value={String(service.id)} color={colors.textPrimary} />
          ))}
        </Picker>
      </Modal>
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
    gap: 24,
    height: 160,
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: 'center',
    width: 56,
  },
  bar: {
    width: 28,
    borderRadius: 4,
  },
  retentionCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  filtersBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  table: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableHeaderRow: {
    borderTopWidth: 0,
  },
  tableCell: {
    fontSize: 13,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  periodOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
});
