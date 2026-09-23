import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../contexts/LanguageContext';
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
import { Select } from '../components/ui/Select';

type TabKey = 'basic' | 'business' | 'insights';
type IntervalKey = 'day' | 'week' | 'month';
type SectionError = 'forbidden' | 'network' | null;

const LIMIT_OPTIONS = [10, 25, 50, 100];

const COPY = {
  pt: {
    tabBasic: 'Básicos',
    tabBusiness: 'Análise de Negócio',
    tabInsights: 'Insights',
    intervalDay: 'Dia',
    intervalWeek: 'Semana',
    intervalMonth: 'Mês',
    title: 'Relatórios',
    filters: 'Filtros',
    dateFrom: 'Data inicial',
    dateTo: 'Data final',
    selectDate: 'Selecione uma data',
    professional: 'Profissional',
    all: 'Todos',
    service: 'Serviço',
    timeInterval: 'Intervalo de Tempo',
    itemsPerPage: 'Itens por Página',
    clear: 'Limpar',
    applyFilters: 'Aplicar filtros',
    totalAppointments: 'Agendamentos Totais',
    completedAppointments: 'Agendamentos Concluídos',
    completionRate: (rate: string) => `Taxa de conclusão: ${rate}`,
    totalRevenue: 'Receita Total',
    avgTicket: 'Ticket Médio',
    exportCsv: 'Exportar CSV',
    loadError: 'Não foi possível carregar os dados desta aba.',
    exportError: 'Não foi possível exportar o relatório.',
    errorTitle: 'Erro',
    businessPlanBlocked: 'O seu plano atual não inclui a Análise de Negócio.',
    insightsPlanBlocked: 'O seu plano atual não inclui os Insights.',
    viewPlans: 'Ver planos',
    tryAgain: 'Tentar novamente',
    topServices: 'Top Serviços',
    noDataInPeriod: 'Nenhum dado no período selecionado.',
    appointmentsSuffix: 'agendamentos',
    revenueByInterval: (interval: string) => `Receita por ${interval}`,
    defaultPeriod: 'período',
    chart: 'Gráfico',
    table: 'Tabela',
    period: 'Período',
    revenue: 'Receita',
    appointmentsAbbrev: 'Agend.',
    retentionRate: 'Taxa de Retenção',
    newClients: 'Novos',
    returningClients: 'Recorrentes',
  },
  en: {
    tabBasic: 'Basic',
    tabBusiness: 'Business Analysis',
    tabInsights: 'Insights',
    intervalDay: 'Day',
    intervalWeek: 'Week',
    intervalMonth: 'Month',
    title: 'Reports',
    filters: 'Filters',
    dateFrom: 'Start date',
    dateTo: 'End date',
    selectDate: 'Select a date',
    professional: 'Professional',
    all: 'All',
    service: 'Service',
    timeInterval: 'Time Interval',
    itemsPerPage: 'Items per Page',
    clear: 'Clear',
    applyFilters: 'Apply filters',
    totalAppointments: 'Total Appointments',
    completedAppointments: 'Completed Appointments',
    completionRate: (rate: string) => `Completion rate: ${rate}`,
    totalRevenue: 'Total Revenue',
    avgTicket: 'Average Ticket',
    exportCsv: 'Export CSV',
    loadError: 'Could not load the data for this tab.',
    exportError: 'Could not export the report.',
    errorTitle: 'Error',
    businessPlanBlocked: 'Your current plan does not include Business Analysis.',
    insightsPlanBlocked: 'Your current plan does not include Insights.',
    viewPlans: 'View plans',
    tryAgain: 'Try again',
    topServices: 'Top Services',
    noDataInPeriod: 'No data in the selected period.',
    appointmentsSuffix: 'appointments',
    revenueByInterval: (interval: string) => `Revenue by ${interval}`,
    defaultPeriod: 'period',
    chart: 'Chart',
    table: 'Table',
    period: 'Period',
    revenue: 'Revenue',
    appointmentsAbbrev: 'Appts.',
    retentionRate: 'Retention Rate',
    newClients: 'New',
    returningClients: 'Returning',
  },
} as const;

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
  const { language } = useLanguage();
  const t = language === 'en' ? COPY.en : COPY.pt;

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'basic', label: t.tabBasic },
    { key: 'business', label: t.tabBusiness },
    { key: 'insights', label: t.tabInsights },
  ];

  const INTERVAL_OPTIONS: { value: IntervalKey; label: string }[] = [
    { value: 'day', label: t.intervalDay },
    { value: 'week', label: t.intervalWeek },
    { value: 'month', label: t.intervalMonth },
  ];

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
      Alert.alert(t.errorTitle, t.loadError);
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
        Alert.alert(t.errorTitle, t.loadError);
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
        Alert.alert(t.errorTitle, t.loadError);
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
      Alert.alert(t.errorTitle, t.exportError);
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

  const intervalLabel = INTERVAL_OPTIONS.find((option) => option.value === interval)?.label || t.defaultPeriod;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.title}</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.filters}</Text>

            <DatePickerInput
              label={t.dateFrom}
              placeholder={t.selectDate}
              value={draft.from}
              onDateChange={(date) => setDraft((prev) => ({ ...prev, from: date }))}
            />
            <DatePickerInput
              label={t.dateTo}
              placeholder={t.selectDate}
              value={draft.to}
              onDateChange={(date) => setDraft((prev) => ({ ...prev, to: date }))}
            />

            {(activeTab === 'business' || activeTab === 'insights') && (
              <View style={styles.inputGroup}>
                <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>{t.professional}</Text>
                <Select
                  testID="reports-professional-picker"
                  selectedValue={draft.professionalId}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, professionalId: value }))}
                  placeholder={t.all}
                  title={t.professional}
                  options={[
                    { label: t.all, value: '' },
                    ...professionals.map((prof: any) => ({ label: prof.name, value: String(prof.id) })),
                  ]}
                />
              </View>
            )}

            {activeTab === 'business' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>{t.service}</Text>
                <Select
                  testID="reports-service-picker"
                  selectedValue={draft.serviceId}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, serviceId: value }))}
                  placeholder={t.all}
                  title={t.service}
                  options={[
                    { label: t.all, value: '' },
                    ...services.map((service: any) => ({ label: service.name, value: String(service.id) })),
                  ]}
                />
              </View>
            )}

            {activeTab === 'business' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>{t.timeInterval}</Text>
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
                  <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>{t.itemsPerPage}</Text>
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
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>{t.clear}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleApplyFilters}>
                <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: '600' }}>{t.applyFilters}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'basic' && basic && (
          <>
            <StatCard label={t.totalAppointments} value={basic.appointments_total} />
            <StatCard label={t.completedAppointments} value={basic.appointments_completed} hint={t.completionRate(completionRate)} />
            <StatCard label={t.totalRevenue} value={formatCurrency(basic.revenue_total)} isPrimary />
            <StatCard label={t.avgTicket} value={formatCurrency(basic.avg_ticket)} />

            <Button onPress={handleExportCSV} loading={exporting} disabled={exporting}>
              {t.exportCsv}
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
                  {t.businessPlanBlocked}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('CreditsPlan' as never)} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.brandPrimary, fontWeight: '600', fontSize: 13 }}>{t.viewPlans}</Text>
                </TouchableOpacity>
              </View>
            )}

            {!businessLoading && businessError === 'network' && (
              <View style={[styles.banner, { backgroundColor: colors.errorBackground, borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
                  {t.loadError}
                </Text>
                <TouchableOpacity onPress={fetchBusinessData} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.brandPrimary, fontWeight: '600', fontSize: 13 }}>{t.tryAgain}</Text>
                </TouchableOpacity>
              </View>
            )}

            {!businessLoading && !businessError && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.topServices}</Text>
                {topServices && topServices.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
                    {t.noDataInPeriod}
                  </Text>
                ) : (
                  topServices?.map((service) => (
                    <View key={service.service_name} style={[styles.serviceRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                      <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{service.service_name}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{service.qty} {t.appointmentsSuffix}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{formatCurrency(service.revenue)}</Text>
                      </View>
                    </View>
                  ))
                )}

                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>{t.revenueByInterval(intervalLabel)}</Text>
                {revenueSeries && revenueSeries.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {t.noDataInPeriod}
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
                          {t.chart}
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
                          {t.table}
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
                          <Text style={[styles.tableCell, styles.tableHeaderCell, { color: colors.textSecondary, flex: 1.2 }]}>{t.period}</Text>
                          <Text style={[styles.tableCell, styles.tableHeaderCell, { color: colors.textSecondary, flex: 1 }]}>{t.revenue}</Text>
                          <Text style={[styles.tableCell, styles.tableHeaderCell, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>
                            {t.appointmentsAbbrev}
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
                  {t.insightsPlanBlocked}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('CreditsPlan' as never)} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.brandPrimary, fontWeight: '600', fontSize: 13 }}>{t.viewPlans}</Text>
                </TouchableOpacity>
              </View>
            )}

            {!insightsLoading && insightsError === 'network' && (
              <View style={[styles.banner, { backgroundColor: colors.errorBackground, borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
                  {t.loadError}
                </Text>
                <TouchableOpacity onPress={fetchInsightsData} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.brandPrimary, fontWeight: '600', fontSize: 13 }}>{t.tryAgain}</Text>
                </TouchableOpacity>
              </View>
            )}

            {!insightsLoading && !insightsError && (
              <>
                <StatCard label={t.retentionRate} value={retentionRate} isPrimary />
                {retention && totalRetention === 0 ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {t.noDataInPeriod}
                  </Text>
                ) : retention ? (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={[styles.retentionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t.newClients}</Text>
                      <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>{retention.new_clients.qty}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatCurrency(retention.new_clients.revenue)}</Text>
                    </View>
                    <View style={[styles.retentionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t.returningClients}</Text>
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
